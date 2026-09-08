import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { StatTrio } from '@/components/StatTrio';
import { TaskRow } from '@/components/TaskRow';
import { useAuth } from '@/auth/AuthProvider';
import {
  membersByGroup,
  peopleById,
  useAddTask,
  useAllMembers,
  useDeleteTask,
  useFocusSessions,
  useGroups,
  usePeople,
  useRecordFocus,
  useTaskCompletions,
  useTasks,
  useToggleTask,
} from '@/lib/queries';
import { byTask, doneBy, isDone, progress, sortTasks, toggleIntent } from '@/lib/tasks';
import { handle } from '@/lib/identity';
import type { Task, TaskCompletionKind } from '@/lib/types';
import {
  DEFAULTS,
  PHASE_LABEL,
  advance,
  finishesAt,
  format,
  idle,
  isFinished,
  minutesFor,
  pause,
  remainingMs,
  reset,
  start,
  type Timer,
} from '@/lib/pomodoro';
import { loadTimer, saveTimer } from '@/lib/focus-storage';
import { cancelFocusAlarm, ensurePermission, scheduleFocusAlarm } from '@/lib/reminders';
import { toLocalDate } from '@/lib/date';
import { useTheme } from '@/theme/ThemeProvider';
import { Bar } from '@/components/Bar';
import { ink, radius, space, typography } from '@/theme/tokens';

export default function FocusScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();

  const tasks = useTasks();
  const completions = useTaskCompletions();
  const groups = useGroups();
  const members = useAllMembers();
  const sessions = useFocusSessions();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () =>
      Promise.all([
        tasks.refetch(),
        completions.refetch(),
        groups.refetch(),
        sessions.refetch(),
      ]),
    [tasks, completions, groups, sessions],
  );
  const addTask = useAddTask(userId);
  const toggleTask = useToggleTask(userId);
  const deleteTask = useDeleteTask();
  const record = useRecordFocus(userId);
  const people = usePeople();

  const [timer, setTimer] = useState<Timer>(idle());
  const [ready, setReady] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // The composer is a contextual action, not furniture. See the note on the
  // Plate below.
  const [composing, setComposing] = useState(false);
  const [scope, setScope] = useState<'mine' | 'shared'>('mine');
  const [addTo, setAddTo] = useState<string | null>(null);
  const [kind, setKind] = useState<TaskCompletionKind>('once');

  // Re-renders once a second purely to move the clock. Nothing counts down —
  // the remaining time is worked out from the start time every time.
  const [, tick] = useState(0);
  useEffect(() => {
    if (timer.state !== 'running') return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer.state]);

  // Restore whatever was running when the app was last open.
  useEffect(() => {
    loadTimer().then((saved) => {
      if (saved) setTimer(saved);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) saveTimer(timer);
  }, [timer, ready]);

  // Coming back from the background can land long after a stretch ended.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  const finished = isFinished(timer, Date.now());
  const recorded = useRef<string | null>(null);

  // A finished stretch rolls on to the next one, and a finished *focus*
  // stretch is written down. The ref keeps a re-render from recording twice.
  useEffect(() => {
    if (!finished || timer.state !== 'running') return;
    const key = `${timer.startedAt}`;
    if (recorded.current === key) return;
    recorded.current = key;

    if (timer.phase === 'focus') {
      record.mutate({
        startedAt: new Date(timer.startedAt),
        minutes: Math.round(timer.durationMs / 60_000),
        taskId,
      });
    }
    setTimer(advance(timer, DEFAULTS));
  }, [finished, timer, taskId, record]);

  const onStart = useCallback(async () => {
    const next = start(timer, DEFAULTS, Date.now());
    setTimer(next);

    // Ask here rather than on first open. The alert is the whole reason to
    // leave the app while a stretch runs, so this is the moment it makes sense
    // to ask for — and without it the alarm would be scheduled and silently
    // never arrive. Saying no leaves the timer working, just quiet.
    const at = finishesAt(next);
    if (at && (await ensurePermission())) {
      await scheduleFocusAlarm(at, PHASE_LABEL[next.phase]);
    }
  }, [timer]);

  const onPause = useCallback(async () => {
    setTimer(pause(timer, Date.now()));
    await cancelFocusAlarm();
  }, [timer]);

  const onReset = useCallback(async () => {
    setTimer(reset(timer));
    await cancelFocusAlarm();
  }, [timer]);

  async function onAdd() {
    const title = draft.trim();
    if (!title) return;
    setError(null);

    // Adding on the shared tab with nowhere to share to used to fall through
    // to groupId = null: the task was written as a private one and vanished
    // from the list you were looking at. Refuse instead of guessing.
    if (scope === 'shared' && !addTo) {
      setError('Pick a group first — a shared task has to belong to one.');
      return;
    }

    try {
      const groupId = scope === 'shared' ? addTo : null;
      const siblings = (tasks.data ?? []).filter((t) => t.group_id === groupId);
      const highest = siblings.reduce((n, t) => Math.max(n, t.position), -1);
      await addTask.mutateAsync({ title, position: highest + 1, groupId, completion: kind });
      setDraft('');
      // Closes on success only. A failed add keeps the composer open with the
      // reason showing, so nothing typed is lost to a dismissed form.
      setComposing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that.');
    }
  }

  const all = tasks.data ?? [];
  const ticked = useMemo(() => byTask(completions.data), [completions.data]);
  const names = useMemo(() => peopleById(people.data), [people.data]);
  const roster = useMemo(() => membersByGroup(members.data), [members.data]);

  const mine = useMemo(
    () => sortTasks(all.filter((t) => !t.group_id), ticked, userId),
    [all, ticked, userId],
  );
  const sharedByGroup = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of all) {
      if (!t.group_id) continue;
      map.set(t.group_id, [...(map.get(t.group_id) ?? []), t]);
    }
    for (const [id, ts] of map) map.set(id, sortTasks(ts, ticked, userId));
    return map;
  }, [all, ticked, userId]);

  const visible = scope === 'mine' ? mine : all.filter((t) => t.group_id);
  const open = visible.filter((t) => !isDone(t, ticked, userId));
  const activeTask = all.find((t) => t.id === taskId) ?? null;

  // Only ever one group in the picker if that is all there is.
  const groupList = groups.data ?? [];
  useEffect(() => {
    if (addTo === null && groupList.length > 0) setAddTo(groupList[0].id);
  }, [addTo, groupList]);

  /** "done by Dan", or "2 of 3" — whichever the task's kind makes true. */
  function metaFor(task: Task): string | undefined {
    const who = doneBy(task, ticked);
    if (task.group_id && task.completion === 'once') {
      if (who.size === 0) return undefined;
      const first = [...who][0];
      return `Done by ${first === userId ? 'you' : handle(names.get(first))}`;
    }
    const p = progress(task, ticked, (roster.get(task.group_id ?? '') ?? []).length);
    return p ? `${p.done} of ${p.total} done` : undefined;
  }

  /** Ticked tasks, which are the ones it makes sense to clear away. */
  function clearable(list: Task[]): Task[] {
    return list.filter((t) => isDone(t, ticked, userId));
  }

  function clearDone(list: Task[]) {
    for (const t of clearable(list)) deleteTask.mutate(t.id);
  }

  function taskRow(task: Task, last: boolean) {
    return (
      <TaskRow
        key={task.id}
        title={task.title}
        done={isDone(task, ticked, userId)}
        meta={metaFor(task)}
        active={task.id === taskId}
        last={last}
        onToggle={() => toggleTask.mutate({ taskId: task.id, ...toggleIntent(task, ticked, userId) })}
        onPress={() => setTaskId(task.id === taskId ? null : task.id)}
      />
    );
  }

  const stats = useMemo(() => {
    const all = sessions.data ?? [];
    const today = toLocalDate();
    const todayMinutes = all
      .filter((s) => s.started_at.slice(0, 10) === today)
      .reduce((n, s) => n + s.minutes, 0);
    const weekMinutes = all
      .filter((s) => Date.parse(s.started_at) > Date.now() - 7 * 86_400_000)
      .reduce((n, s) => n + s.minutes, 0);
    return { todayMinutes, weekMinutes, sessions: all.length };
  }, [sessions.data]);

  const total = minutesFor(timer.phase, DEFAULTS) * 60_000;
  const left = timer.state === 'idle' ? total : remainingMs(timer, Date.now());
  const barFilled = total > 0 ? 1 - left / total : 0;

  return (
    <Screen
      onRefresh={onRefresh} title="Focus" label={`${PHASE_LABEL[timer.phase]} · ${minutesFor(timer.phase, DEFAULTS)} minutes`}>
      <Plate feature>
        <Text style={[typography.label, { color: ink(colors, 65) }]}>
          {timer.phase === 'focus' ? (activeTask ? 'Working on' : 'Focus') : 'Step away from it'}
        </Text>
        {timer.phase === 'focus' && activeTask ? (
          <Text numberOfLines={1} style={[typography.cardTitle, styles.working, { color: colors.text }]}>
            {activeTask.title}
          </Text>
        ) : null}

        <Text style={[typography.clock, styles.clock, { color: colors.text }]}>{format(left)}</Text>

        <View style={styles.bar}>
          <Bar value={Math.min(1, Math.max(0, barFilled))} max={1} />
        </View>

        <View style={styles.controls}>
          {timer.state === 'running' ? (
            <Button label="Pause" variant="primary" onPress={onPause} style={styles.grow} />
          ) : (
            <Button
              label={
                timer.state === 'paused'
                  ? 'Resume'
                  : `Start ${PHASE_LABEL[timer.phase].toLowerCase()}`
              }
              variant="primary"
              onPress={onStart}
              style={styles.grow}
            />
          )}
          {timer.state !== 'idle' ? <Button label="Reset" onPress={onReset} /> : null}
        </View>

        <Text style={[typography.caption, { color: ink(colors, 65) }]}>
          {timer.done === 0
            ? `${DEFAULTS.focus} minutes on, ${DEFAULTS.short} off. A longer break every ${DEFAULTS.longEvery}.`
            : `${timer.done} ${timer.done === 1 ? 'stretch' : 'stretches'} done today.`}
        </Text>
      </Plate>

      <Segmented
        value={scope}
        onChange={(v) => {
          setScope(v);
          setError(null);
          // The composer means something different on each tab — a shared task
          // needs a group — so it does not survive the switch.
          setComposing(false);
          setDraft('');
        }}
        options={[
          { value: 'mine', label: `Mine · ${mine.length}` },
          { value: 'shared', label: `Shared · ${all.filter((t) => t.group_id).length}` },
        ]}
      />

      {/* A permanently open creation form is desktop thinking: it sat between
          the timer and the list, taking the best space on the screen for
          something most visits never use, and on a phone the keyboard covered
          the list it was adding to. It is an action now, and the screen has
          one job again — decide what to work on, and start. */}
      {!composing ? (
        <Button
          label={scope === 'mine' ? 'Add a task' : 'Add a shared task'}
          onPress={() => {
            setError(null);
            setComposing(true);
          }}
        />
      ) : (
      <Plate
        label={scope === 'mine' ? 'Add a task' : 'Add a shared task'}
        action="Cancel"
        onAction={() => {
          setDraft('');
          setError(null);
          setComposing(false);
        }}
      >
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a task"
            placeholderTextColor={ink(colors, 45)}
            onSubmitEditing={onAdd}
            returnKeyType="done"
            maxLength={140}
            style={[
              styles.input,
              typography.body,
              { borderColor: colors.divider, color: colors.text },
            ]}
            accessibilityLabel="Add a task"
          />
          <Button
            label="Add"
            variant="primary"
            onPress={onAdd}
            disabled={!draft.trim() || (scope === 'shared' && !addTo)}
            busy={addTask.isPending}
          />
        </View>

        {scope === 'shared' ? (
          groupList.length === 0 ? (
            <Text style={[typography.caption, styles.hint, { color: ink(colors, 70) }]}>
              Join or create a group first, then tasks can be shared with it.
            </Text>
          ) : (
            <View style={styles.options}>
              {groupList.length > 1 ? (
                <View style={styles.chips}>
                  {groupList.map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => setAddTo(g.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: addTo === g.id }}
                      style={[
                        styles.chip,
                        addTo === g.id
                          ? { backgroundColor: colors.accents[100], borderColor: colors.accent }
                          : { backgroundColor: 'transparent', borderColor: colors.divider },
                      ]}
                    >
                      <Text
                        style={[
                          typography.action,
                          { color: addTo === g.id ? colors.accents[700] : ink(colors, 70) },
                        ]}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Segmented
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'once', label: 'One of us' },
                  { value: 'everyone', label: 'Each of us' },
                ]}
              />
              <Text style={[typography.prose, { color: ink(colors, 78) }]}>
                {kind === 'once'
                  ? 'Whoever does it ticks it off, and it is done for everyone.'
                  : 'Everyone ticks off their own, and you can see who has not.'}
              </Text>
            </View>
          )
        ) : null}

        {error ? (
          <Notice label="Could not add">{error}</Notice>
        ) : null}
      </Plate>
      )}

      {tasks.isLoading ? (
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
      ) : scope === 'mine' ? (
        mine.length === 0 ? (
          <EmptyState
            title="Nothing on the list"
            body="Add the one thing you keep putting off, then start a stretch of focus on it."
            actionLabel="Add a task"
            onAction={() => {
              setError(null);
              setComposing(true);
            }}
          />
        ) : (
          <Plate
            label="Your list"
            action={clearable(mine).length ? `Clear ${clearable(mine).length}` : undefined}
            onAction={clearable(mine).length ? () => clearDone(mine) : undefined}
            flush
          >
            {mine.map((t, i) => taskRow(t, i === mine.length - 1))}
          </Plate>
        )
      ) : sharedByGroup.size === 0 ? (
        <EmptyState
          title="No shared tasks yet"
          body={
            groupList.length
              ? 'Either one of you does it, or all of you do — you choose when you add it.'
              : 'Join or create a group first, then tasks can be shared with it.'
          }
          // The action depends on why it is empty: with no group there is
          // nothing to share *to*, so sending someone to a composer they
          // cannot submit would be a dead end.
          actionLabel={groupList.length ? 'Add a shared task' : 'Go to groups'}
          onAction={
            groupList.length
              ? () => {
                  setError(null);
                  setComposing(true);
                }
              : () => router.push('/groups')
          }
        />
      ) : (
        [...sharedByGroup.entries()].map(([groupId, list]) => {
          const group = groupList.find((g) => g.id === groupId);
          return (
            <Plate
              key={groupId}
              label={group?.name ?? 'Group'}
              action={clearable(list).length ? `Clear ${clearable(list).length}` : undefined}
              onAction={clearable(list).length ? () => clearDone(list) : undefined}
              flush
            >
              {list.map((t, i) => taskRow(t, i === list.length - 1))}
            </Plate>
          );
        })
      )}

      {open.length === 0 && visible.length > 0 ? (
        <Notice label="All clear">
          {scope === 'mine'
            ? 'Nothing left on your list.'
            : 'Nothing left for you in any group.'}
        </Notice>
      ) : null}

      {/* Below the list, not above it. These are how the day went, which is
          worth knowing but is not what the screen is for — between the timer
          and the tasks they interrupted the one flow the screen has. */}
      <StatTrio
        stats={[
          { value: `${stats.todayMinutes}m`, label: 'Focused today' },
          { value: `${Math.round(stats.weekMinutes / 6) / 10}h`, label: 'This week' },
          { value: String(open.length), label: 'Still to do' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  working: { marginTop: space.sm },
  clock: { marginTop: space.xl },
  bar: { marginTop: space.xl, marginBottom: space.xl },
  controls: { flexDirection: 'row', gap: space.md, marginBottom: space.lg },
  grow: { flex: 1 },
  addRow: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
  },
  loader: { marginTop: space.xxxl },
  options: { gap: space.md, marginTop: space.lg },
  hint: { marginTop: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
