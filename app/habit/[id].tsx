import { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Label } from '@/components/ui';
import { FieldRow, FieldValue } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StatTrio } from '@/components/StatTrio';
import { TextAction } from '@/components/TextAction';
import { WeekStrip } from '@/components/WeekStrip';
import { useAuth } from '@/auth/AuthProvider';
import {
  byHabit,
  checkInIndex,
  doneKey,
  useCheckIns,
  useGroupMembers,
  useGroups,
  useHabit,
  useToggleCheckIn,
} from '@/lib/queries';
import { addDays, formatShortDate, toLocalDate, WEEKDAY_LABELS } from '@/lib/date';
import { feel } from '@/lib/feel';
import { gridCells } from '@/lib/week';
import {
  bestStreak,
  computeStreak,
  describeProgress,
  isScheduled,
  weeklyProgress,
} from '@/lib/streak';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

const HISTORY = 40;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HabitDetailScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const habitQuery = useHabit(id);
  const checkIns = useCheckIns();
  const groups = useGroups();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () => Promise.all([habitQuery.refetch(), checkIns.refetch(), groups.refetch()]),
    [habitQuery, checkIns, groups],
  );
  const toggle = useToggleCheckIn(userId);

  const habit = habitQuery.data;
  const today = toLocalDate();

  // Only fetched for a shared habit; the hook no-ops on an empty id.
  const members = useGroupMembers(habit?.group_id ?? undefined);

  const dates = useMemo(
    () => byHabit(checkIns.data, userId).get(id ?? '') ?? new Set<string>(),
    [checkIns.data, userId, id],
  );
  const everyone = useMemo(() => checkInIndex(checkIns.data), [checkIns.data]);

  const notes = useMemo(
    () =>
      (checkIns.data ?? [])
        .filter((c) => c.habit_id === id && c.user_id === userId && c.note)
        .sort((a, b) => b.local_date.localeCompare(a.local_date))
        .slice(0, 5),
    [checkIns.data, id, userId],
  );

  if (habitQuery.isLoading) {
    return (
      <Screen title="Habit" back={{}}>
        <ActivityIndicator style={styles.loader} color={t.colors.inkMuted} />
      </Screen>
    );
  }

  // Loading and gone are different answers, and running them together as
  // `isLoading || !habit` meant a deleted habit span its loader forever with
  // no way out. Deleting a habit lands here every time; so does opening one on
  // a second device after deleting it on the first.
  if (!habit) {
    return (
      <Screen title="Habit" label="Not found" back={{}}>
        <Notice label="Gone">
          {'This habit no longer exists. It may have been deleted here or on another device.'}
        </Notice>
        <Button title="Back to Today" variant="outline" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const schedule = {
    cadence: habit.cadence,
    targetDays: habit.target_days,
    targetPerWeek: habit.target_per_week,
  };

  // Oldest first, so the grid reads like a calendar rather than backwards.
  const days = Array.from({ length: HISTORY }, (_, i) => addDays(today, -(HISTORY - 1 - i)));
  const owed = days.filter((d) => isScheduled(schedule, d) && d >= habit.created_at.slice(0, 10));
  const hit = owed.filter((d) => dates.has(d)).length;
  const streak = computeStreak(schedule, dates, today);
  const best = bestStreak(schedule, dates, today);
  const grid = gridCells(12, dates, schedule, today);
  const week = weeklyProgress(schedule, dates, today);
  const group = groups.data?.find((g) => g.id === habit.group_id);
  const completeToday = dates.has(today);

  // A shared habit's third figure is who is in today, not a rate — it is the
  // thing you actually open the screen to find out.
  const roster = members.data ?? [];
  const inToday = roster.filter((m) => everyone.has(doneKey(habit.id, m.user_id, today))).length;
  const third = group
    ? { value: `${inToday}/${roster.length}`, label: 'in today' }
    : {
        value: owed.length === 0 ? '—' : `${Math.round((hit / owed.length) * 100)}%`,
        label: `kept, last ${HISTORY} days`,
      };

  function checkIn() {
    feel(completeToday ? 'select' : 'success');
    toggle.mutate({ habitId: habit!.id, date: today, complete: !completeToday });
  }

  // "Any three days a week" has no fixed days, so none is marked; every day
  // and chosen days are marked where they fall.
  const flexible = habit.cadence === 'weekly';
  const owedOn = (day: number) =>
    habit.cadence === 'daily' || (habit.cadence === 'days' && habit.target_days.includes(day));

  return (
    <Screen
      onRefresh={onRefresh}
      title={habit.title}
      label={`${group ? group.name : 'Private'} · ${cadenceLabel(habit.cadence, habit.target_days, habit.target_per_week)}`}
      back={{}}
      footer={
        completeToday ? (
          <Button title="Undo today’s check-in" variant="outline" onPress={checkIn} />
        ) : (
          <Button title="Check in for today" onPress={checkIn} />
        )
      }
    >
      <StatTrio
        stats={[
          { value: String(streak), label: streak === 1 ? 'day in a row' : 'days in a row', accent: streak > 0 },
          { value: String(best), label: 'longest run' },
          third,
        ]}
      />

      {habit.cadence === 'weekly' ? (
        <Section label="This week" list>
          <Row last accessibilityLabel={`${week.done} of ${week.target} this week`}>
            <Text style={styles.week}>
              {week.done} of {week.target}
            </Text>
          </Row>
        </Section>
      ) : null}

      <Section label="Last 12 weeks">
        {/* Twelve weeks as columns, Monday at the top: the same strip as
            everywhere else, turned on its side — and stamped in the accent,
            because this one is a calendar. */}
        <View style={styles.grid} accessible accessibilityLabel={`Last 12 weeks: kept ${hit} of the ${owed.length} days owed in the last ${HISTORY}`}>
          {grid.map((column, i) => (
            <WeekStrip key={i} cells={column} size={20} direction="column" calendar />
          ))}
        </View>
      </Section>

      <Section label="Schedule">
        <View
          style={styles.days}
          accessible
          accessibilityLabel={
            flexible
              ? `Any ${habit.target_per_week} days a week. ${describeProgress(schedule, dates, today)}`
              : habit.cadence === 'daily'
                ? `Every day. ${describeProgress(schedule, dates, today)}`
                : `${habit.target_days.map((d) => DAY_NAMES[d - 1]).join(', ')}. ${describeProgress(schedule, dates, today)}`
          }
        >
          {WEEKDAY_LABELS.map((letter, i) => {
            // A weekly target has no fixed days, so none of the seven is
            // marked — an even row says "any day" without lying.
            const on = owedOn(i + 1);
            return (
              <View key={i} style={styles.day}>
                <Label style={[styles.letter, on && styles.letterOn]}>{letter}</Label>
                <View style={[styles.mark, on && styles.markOn]} />
              </View>
            );
          })}
        </View>
        <Text style={styles.note}>{describeProgress(schedule, dates, today)}</Text>
      </Section>

      <Section label="Details" list>
        <FieldRow label="Schedule">
          <FieldValue>{cadenceLabel(habit.cadence, habit.target_days, habit.target_per_week)}</FieldValue>
        </FieldRow>
        <FieldRow label="Who sees it">
          <FieldValue>{group ? `Everyone in ${group.name}` : 'Only you'}</FieldValue>
        </FieldRow>
        <FieldRow label="Reminder" last>
          <FieldValue>{habit.reminder_at ? habit.reminder_at.slice(0, 5) : 'Off'}</FieldValue>
        </FieldRow>
      </Section>

      {notes.length > 0 ? (
        <Section label="Notes" list>
          {notes.map((note, i) => (
            <Row key={note.id} last={i === notes.length - 1} style={styles.noteRow}>
              <Text style={styles.noteText}>“{note.note}”</Text>
              <Label>{note.local_date === today ? 'Today' : formatShortDate(note.local_date)}</Label>
            </Row>
          ))}
        </Section>
      ) : null}

      <TextAction
        title="Edit habit"
        onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })}
        style={styles.start}
      />

      {habit.archived_at ? (
        <Notice label="Archived">
          {'This habit is archived, so it no longer appears on Today. Its history is kept, and you can restore it from the edit screen.'}
        </Notice>
      ) : null}
    </Screen>
  );
}

function cadenceLabel(cadence: string, days: number[], perWeek: number): string {
  if (cadence === 'daily') return 'Every day';
  if (cadence === 'weekly') return `${perWeek}× a week`;
  return days.map((d) => WEEKDAY_LABELS[d - 1]).join(' ') || 'No days picked';
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    loader: { marginTop: space.xl },
    week: { ...t.type.figureSmall, color: t.colors.ink },
    grid: { flexDirection: 'row', gap: 4, justifyContent: 'space-between' },
    days: { flexDirection: 'row' },
    day: { flex: 1, alignItems: 'center', gap: 6 },
    letter: { letterSpacing: 0 },
    letterOn: { color: t.colors.ink },
    // The tab bar's own mark, under each day the habit is owed.
    mark: { width: 4, height: 4 },
    markOn: { backgroundColor: t.colors.seal },
    note: { ...t.type.italic, color: t.colors.inkMuted, marginTop: space.md },
    noteRow: { flexDirection: 'column', alignItems: 'flex-start', gap: space.xs },
    noteText: { ...t.type.italicTitle, color: t.colors.inkSoft },
    start: { alignSelf: 'flex-start' },
  });
