import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Label } from '@/components/ui';
import { Bar } from '@/components/Bar';
import { Chip } from '@/components/Chip';
import { Clock } from '@/components/Clock';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { RowsSkeleton } from '@/components/Skeleton';
import { StatTrio } from '@/components/StatTrio';
import { TaskRow } from '@/components/TaskRow';
import { YouCorner } from '@/components/YouCorner';
import { useAuth } from '@/auth/AuthProvider';
import {
  membersByGroup,
  peopleById,
  useAddTask,
  useAllMembers,
  useDeleteTask,
  useRenameTask,
  useFocusSessions,
  useGroups,
  usePeople,
  useRecordFocus,
  useTaskCompletions,
  useTasks,
  useToggleTask,
} from '@/lib/queries';
import { byTask, doneBy, isDone, progress, sortTasks, toggleIntent } from '@/lib/tasks';
import { confirm } from '@/lib/confirm';
import { feel } from '@/lib/feel';
import { useRemembered } from '@/lib/remembered';
import { handle } from '@/lib/identity';
import type { Task, TaskCompletionKind } from '@/lib/types';
import {
  DEFAULTS,
  PHASE_LABEL,
  advance,
  finishesAt,
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
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

export default function FocusScreen() {
  const styles = useThemedStyles(makeStyles);
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
  const renameTask = useRenameTask();
  const record = useRecordFocus(userId);
  const people = usePeople();

  const [timer, setTimer] = useState<Timer>(idle());
  const [ready, setReady] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // The composer is a contextual action, not furniture: a permanently open
  // form took the best space on the screen for something most visits never
  // use, and on a phone the keyboard covered the list it was adding to.
  const [composing, setComposing] = useState(false);
  // The task the composer is editing. Null means it is adding a new one — the
  // same field, the same keyboard, one less screen.
  const [editing, setEditing] = useState<Task | null>(null);
  // The task whose options sheet is open.
  const [taskMenu, setTaskMenu] = useState<Task | null>(null);
  const [scope, setScope] = useRemembered('focus.scope', 'mine', ['mine', 'shared'] as const);
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

  /** Rename, using the composer the add flow already has. */
  async function onRename() {
    const title = draft.trim();
    if (!title || !editing) return;
    setError(null);
    try {
      await renameTask.mutateAsync({ id: editing.id, title });
      setDraft('');
      setEditing(null);
      setComposing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That task could not be renamed.');
    }
  }

  async function onRemove(task: Task) {
    const yes = await confirm({
      title: `Delete ${task.title}?`,
      message: task.group_id
        ? 'This removes it for everyone in the group, along with who had finished it.'
        : 'This removes it from your list. It cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!yes) return;
    try {
      await deleteTask.mutateAsync(task.id);
      // The timer cannot keep pointing at a task that no longer exists.
      if (taskId === task.id) setTaskId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That task could not be deleted.');
    }
  }

  function openComposer() {
    setError(null);
    setEditing(null);
    setComposing(true);
  }

  function closeComposer() {
    setDraft('');
    setEditing(null);
    setError(null);
    setComposing(false);
  }

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
      setError(e instanceof Error ? e.message : 'That task could not be added.');
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

  /** "Done by Dan", or "2 of 3 done" — whichever the task's kind makes true. */
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

  /** Finished tasks, which are the ones it makes sense to clear away. */
  function clearable(list: Task[]): Task[] {
    return list.filter((t) => isDone(t, ticked, userId));
  }

  function clearDone(list: Task[]) {
    for (const t of clearable(list)) deleteTask.mutate(t.id);
  }

  function taskRow(task: Task, last: boolean) {
    const done = isDone(task, ticked, userId);
    return (
      <TaskRow
        key={task.id}
        title={task.title}
        done={done}
        meta={metaFor(task)}
        active={task.id === taskId}
        last={last}
        onToggle={() => {
          // Finishing a task is a completion; taking it back is a lighter touch.
          feel(done ? 'select' : 'success');
          toggleTask.mutate({ taskId: task.id, ...toggleIntent(task, ticked, userId) });
        }}
        onPress={() => setTaskId(task.id === taskId ? null : task.id)}
        onMore={() => setTaskMenu(task)}
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
  const hours = Math.round(stats.weekMinutes / 6) / 10;

  return (
    <Screen
      onRefresh={onRefresh}
      title="Focus"
      label={`${PHASE_LABEL[timer.phase]} · ${minutesFor(timer.phase, DEFAULTS)} minutes`}
      trailing={<YouCorner />}
    >
      <View style={styles.timer}>
        <Label>
          {timer.phase === 'focus' ? (activeTask ? 'Working on' : 'Focus') : 'Step away from it'}
        </Label>
        {timer.phase === 'focus' && activeTask ? (
          <Text numberOfLines={2} style={styles.working}>
            {activeTask.title}
          </Text>
        ) : null}

        <Clock ms={left} />
        <Bar value={Math.min(1, Math.max(0, barFilled))} max={1} />

        <View style={styles.controls}>
          {timer.state === 'running' ? (
            <Button title="Pause" onPress={onPause} style={styles.grow} />
          ) : (
            <Button
              title={
                timer.state === 'paused'
                  ? 'Resume'
                  : `Start ${PHASE_LABEL[timer.phase].toLowerCase()}`
              }
              onPress={onStart}
              style={styles.grow}
            />
          )}
          {timer.state !== 'idle' ? <Button title="Reset" variant="outline" onPress={onReset} /> : null}
        </View>

        <Text style={styles.note}>
          {timer.done === 0
            ? `${DEFAULTS.focus} minutes on, ${DEFAULTS.short} off, and a longer break every ${DEFAULTS.longEvery}.`
            : `${timer.done} ${timer.done === 1 ? 'stretch' : 'stretches'} done today.`}
        </Text>
      </View>

      <Segmented
        accessibilityLabel="Which tasks"
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

      {!composing ? (
        <Button
          title={scope === 'mine' ? 'Add a task' : 'Add a shared task'}
          variant="outline"
          onPress={openComposer}
        />
      ) : (
        <Section
          label={editing ? 'Rename task' : scope === 'mine' ? 'Add a task' : 'Add a shared task'}
          action="Cancel"
          onAction={closeComposer}
        >
          <View style={styles.composer}>
            <Field
              label="Task"
              value={draft}
              onChangeText={setDraft}
              placeholder="The thing you keep putting off"
              onSubmitEditing={editing ? onRename : onAdd}
              returnKeyType="done"
              maxLength={140}
              autoFocus
            />

            {editing ? null : scope === 'shared' ? (
              groupList.length === 0 ? (
                <Text style={styles.note}>
                  Join or start a group first, then tasks can be shared with it.
                </Text>
              ) : (
                <>
                  {groupList.length > 1 ? (
                    <View style={styles.chips} accessibilityLabel="Which group">
                      {groupList.map((g) => (
                        <Chip
                          key={g.id}
                          label={g.name}
                          selected={addTo === g.id}
                          onPress={() => setAddTo(g.id)}
                        />
                      ))}
                    </View>
                  ) : null}

                  <Segmented
                    accessibilityLabel="Who finishes it"
                    value={kind}
                    onChange={setKind}
                    options={[
                      { value: 'once', label: 'One of us' },
                      { value: 'everyone', label: 'Each of us' },
                    ]}
                  />
                  <Text style={styles.note}>
                    {kind === 'once'
                      ? 'Whoever does it marks it done, and it is done for everyone.'
                      : 'Everyone finishes their own, and you can see who has not yet.'}
                  </Text>
                </>
              )
            ) : null}

            {error ? <Notice label="Could not save">{error}</Notice> : null}

            {/* Outlined, not filled: the timer's button is this screen's one
                primary action. */}
            <Button
              title={editing ? 'Save' : 'Add'}
              variant="outline"
              onPress={editing ? onRename : onAdd}
              disabled={!draft.trim() || (!editing && scope === 'shared' && !addTo)}
              loading={addTask.isPending || renameTask.isPending}
            />
          </View>
        </Section>
      )}

      {tasks.isLoading ? (
        <RowsSkeleton />
      ) : scope === 'mine' ? (
        mine.length === 0 ? (
          <EmptyState
            title="Nothing on the list"
            body="Add the one thing you keep putting off, then start a stretch of focus on it."
            actionLabel="Add a task"
            onAction={openComposer}
          />
        ) : (
          <Section
            label="Your list"
            action={clearable(mine).length ? `Clear ${clearable(mine).length}` : undefined}
            actionLabel={`Clear ${clearable(mine).length} finished`}
            onAction={clearable(mine).length ? () => clearDone(mine) : undefined}
            list
          >
            {mine.map((t, i) => taskRow(t, i === mine.length - 1))}
          </Section>
        )
      ) : sharedByGroup.size === 0 ? (
        <EmptyState
          title="No shared tasks yet"
          body={
            groupList.length
              ? 'Either one of you does it, or all of you do — you choose when you add it.'
              : 'Join or start a group first, then tasks can be shared with it.'
          }
          // The action depends on why it is empty: with no group there is
          // nothing to share *to*, so sending someone to a composer they
          // cannot submit would be a dead end.
          actionLabel={groupList.length ? 'Add a shared task' : 'Go to groups'}
          onAction={groupList.length ? openComposer : () => router.push('/groups')}
        />
      ) : (
        [...sharedByGroup.entries()].map(([groupId, list]) => {
          const group = groupList.find((g) => g.id === groupId);
          return (
            <Section
              key={groupId}
              label={group?.name ?? 'Group'}
              action={clearable(list).length ? `Clear ${clearable(list).length}` : undefined}
              actionLabel={`Clear ${clearable(list).length} finished`}
              onAction={clearable(list).length ? () => clearDone(list) : undefined}
              list
            >
              {list.map((t, i) => taskRow(t, i === list.length - 1))}
            </Section>
          );
        })
      )}

      {open.length === 0 && visible.length > 0 ? (
        <Notice label="All clear">
          {scope === 'mine' ? 'Nothing left on your list.' : 'Nothing left for you in any group.'}
        </Notice>
      ) : null}

      {/* Below the list, not above it. These are how the day went, which is
          worth knowing but is not what the screen is for — between the timer
          and the tasks they interrupted the one flow the screen has. */}
      <StatTrio
        stats={[
          { value: String(stats.todayMinutes), label: 'minutes today' },
          { value: String(hours), label: hours === 1 ? 'hour this week' : 'hours this week' },
          { value: String(open.length), label: 'still to do' },
        ]}
      />

      {/* Reachable from the row's "Edit" as well as by holding it. A task has
          no detail screen to hide these behind, so gesture-only would have
          meant deleting one was a capability you could only find by accident. */}
      <Sheet
        visible={taskMenu !== null}
        title={taskMenu?.title}
        onClose={() => setTaskMenu(null)}
        actions={
          taskMenu
            ? [
                {
                  label: 'Rename',
                  onPress: () => {
                    setDraft(taskMenu.title);
                    setEditing(taskMenu);
                    setError(null);
                    setComposing(true);
                  },
                },
                {
                  label: 'Delete',
                  tone: 'danger' as const,
                  hint: taskMenu.group_id ? 'Removes it for the whole group' : 'Cannot be undone',
                  onPress: () => void onRemove(taskMenu),
                },
              ]
            : []
        }
      />
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    timer: { gap: space.md },
    working: { ...t.type.heading, color: t.colors.ink },
    controls: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
    grow: { flex: 1 },
    note: { ...t.type.italic, color: t.colors.inkMuted },
    composer: { gap: space.md },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  });
