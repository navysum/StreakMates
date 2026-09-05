import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { StatTrio } from '@/components/StatTrio';
import { TaskRow } from '@/components/TaskRow';
import { useAuth } from '@/auth/AuthProvider';
import {
  useAddTask,
  useDeleteTask,
  useFocusSessions,
  useRecordFocus,
  useTasks,
  useToggleTask,
} from '@/lib/queries';
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
import { radius, space, typography } from '@/theme/tokens';

export default function FocusScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();

  const tasks = useTasks();
  const sessions = useFocusSessions();
  const addTask = useAddTask(userId);
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const record = useRecordFocus(userId);

  const [timer, setTimer] = useState<Timer>(idle());
  const [ready, setReady] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    try {
      const highest = (tasks.data ?? []).reduce((n, t) => Math.max(n, t.position), -1);
      await addTask.mutateAsync({ title, position: highest + 1 });
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that.');
    }
  }

  const list = tasks.data ?? [];
  const open = useMemo(() => list.filter((t) => !t.done_at), [list]);
  const done = useMemo(() => list.filter((t) => t.done_at), [list]);
  const activeTask = list.find((t) => t.id === taskId) ?? null;

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
  const progress = total > 0 ? 1 - left / total : 0;

  return (
    <Screen title="Focus" eyebrow={PHASE_LABEL[timer.phase]}>
      <Card>
        <Text style={[typography.label, { color: colors.textMuted }]}>
          {timer.phase === 'focus'
            ? activeTask
              ? 'Working on'
              : 'Focus'
            : 'Step away from it'}
        </Text>
        {timer.phase === 'focus' && activeTask ? (
          <Text numberOfLines={1} style={[typography.cardTitle, { color: colors.textPrimary }]}>
            {activeTask.title}
          </Text>
        ) : null}

        <Text style={[typography.display, styles.clock, { color: colors.textPrimary }]}>
          {format(left)}
        </Text>

        <View style={[styles.track, { backgroundColor: colors.neutralChart }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
                backgroundColor: timer.phase === 'focus' ? colors.green : colors.blue,
              },
            ]}
          />
        </View>

        <View style={styles.controls}>
          {timer.state === 'running' ? (
            <Button label="Pause" onPress={onPause} style={styles.grow} />
          ) : (
            <Button
              label={timer.state === 'paused' ? 'Resume' : `Start ${PHASE_LABEL[timer.phase].toLowerCase()}`}
              variant="primary"
              onPress={onStart}
              style={styles.grow}
            />
          )}
          {timer.state !== 'idle' ? <Button label="Reset" onPress={onReset} /> : null}
        </View>

        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {timer.done === 0
            ? `${DEFAULTS.focus} minutes on, ${DEFAULTS.short} off. A longer break every ${DEFAULTS.longEvery}.`
            : `${timer.done} ${timer.done === 1 ? 'stretch' : 'stretches'} done today.`}
        </Text>
      </Card>

      <StatTrio
        stats={[
          { value: `${stats.todayMinutes}m`, label: 'Focused today' },
          { value: `${Math.round(stats.weekMinutes / 6) / 10}h`, label: 'This week' },
          { value: String(open.length), label: 'Still to do' },
        ]}
      />

      <Card title="To do">
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a task"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={onAdd}
            returnKeyType="done"
            maxLength={140}
            style={[
              styles.input,
              typography.rowName,
              {
                backgroundColor: colors.bgSurfaceMuted,
                borderColor: colors.borderDefault,
                color: colors.textPrimary,
              },
            ]}
            accessibilityLabel="Add a task"
          />
          <Button label="Add" onPress={onAdd} disabled={!draft.trim()} busy={addTask.isPending} />
        </View>

        {error ? (
          <Notice label="Could not add" tone="bad">
            {error}
          </Notice>
        ) : null}
      </Card>

      {tasks.isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Nothing on the list"
          body="Add the one thing you keep putting off, then start a stretch of focus on it."
        />
      ) : (
        <>
          {open.length > 0 ? (
            <Card title="Open" subtitle="Tap a task to focus on it" flush>
              {open.map((task, i) => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  done={false}
                  active={task.id === taskId}
                  last={i === open.length - 1}
                  onToggle={() => toggleTask.mutate({ id: task.id, done: true })}
                  onPress={() => setTaskId(task.id === taskId ? null : task.id)}
                />
              ))}
            </Card>
          ) : null}

          {done.length > 0 ? (
            <Card
              title="Done"
              action="Clear"
              onAction={() => done.forEach((t) => deleteTask.mutate(t.id))}
              flush
            >
              {done.map((task, i) => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  done
                  last={i === done.length - 1}
                  onToggle={() => toggleTask.mutate({ id: task.id, done: false })}
                />
              ))}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { fontVariant: ['tabular-nums'], marginTop: space.xs },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden', marginVertical: space.md },
  fill: { height: '100%', borderRadius: radius.pill },
  controls: { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  grow: { flex: 1 },
  addRow: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: space.lg,
  },
  loader: { marginTop: space.xxxl },
});
