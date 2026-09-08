import { useMemo } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { StatTrio } from '@/components/StatTrio';
import { WeekStrip } from '@/components/WeekStrip';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
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
import { addDays, toLocalDate, WEEKDAY_LABELS } from '@/lib/date';
import { gridCells } from '@/lib/week';
import {
  bestStreak,
  computeStreak,
  describeProgress,
  isScheduled,
  weeklyProgress,
} from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, streakColor, typography } from '@/theme/tokens';

const HISTORY = 40;

export default function HabitDetailScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const habitQuery = useHabit(id);
  const checkIns = useCheckIns();
  const groups = useGroups();
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

  const back = { label: 'Back', onPress: () => router.back() };

  if (habitQuery.isLoading || !habit) {
    return (
      <Screen title="Habit" back={back}>
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
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
  // The heatmap is coloured by the run it belongs to, so twelve weeks of a
  // long streak read pink and a fresh one reads blue.
  const kept = streakColor(colors, streak) ?? undefined;
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
    ? { value: `${inToday}/${roster.length}`, label: 'In today' }
    : {
        value: owed.length === 0 ? '—' : `${Math.round((hit / owed.length) * 100)}%`,
        label: `${HISTORY}-day rate`,
      };

  return (
    <Screen
      title={habit.title}
      label={`${group ? group.name : 'Private'} · ${cadenceLabel(habit.cadence, habit.target_days, habit.target_per_week)}`}
      back={back}
      footer={
        <Button
          label={completeToday ? 'Checked in today' : 'Check in for today'}
          variant={completeToday ? 'secondary' : 'primary'}
          onPress={() =>
            toggle.mutate({ habitId: habit.id, date: today, complete: !completeToday })
          }
        />
      }
    >
      <StatTrio
        stats={[
          { value: String(streak), label: 'Streak', tone: streakColor(colors, streak) ?? undefined },
          { value: String(best), label: 'Best' },
          third,
        ]}
      />

      {habit.cadence === 'weekly' ? (
        <View style={[styles.weekRow, { borderColor: colors.divider }]}>
          <Text style={[typography.label, { color: ink(colors, 62) }]}>This week</Text>
          <Text style={[typography.cardTitle, { color: colors.text }]}>
            {week.done} of {week.target}
          </Text>
        </View>
      ) : null}

      <Plate feature>
        <Text style={[typography.label, { color: ink(colors, 65) }]}>Last 12 weeks</Text>
        <View style={styles.grid}>
          {grid.map((column, i) => (
            <WeekStrip key={i} cells={column} size={20} direction="column" tone={kept} />
          ))}
        </View>
      </Plate>

      <Plate label="Cadence">
        <View style={styles.chips}>
          {WEEKDAY_LABELS.map((letter, i) => {
            // A flexible cadence has no fixed days, so none of the seven is
            // marked — an even row of neutrals says "any day" without lying.
            const flexible = habit.cadence !== 'days';
            const on = !flexible && habit.target_days.includes(i + 1);
            return (
              <View
                key={i}
                style={[
                  styles.chip,
                  flexible
                    ? { backgroundColor: colors.neutral[100], borderColor: colors.divider }
                    : on
                      ? { backgroundColor: colors.accents[100], borderColor: colors.accent }
                      : { backgroundColor: 'transparent', borderColor: colors.divider },
                ]}
              >
                <Text
                  style={[typography.labelSmall, { color: on ? colors.accents[700] : ink(colors, 62) }]}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[typography.caption, styles.cadenceNote, { color: ink(colors, 70) }]}>
          {describeProgress(schedule, dates, today)}
        </Text>
      </Plate>

      <Plate label="Details">
        <Row
          label="Cadence"
          value={cadenceLabel(habit.cadence, habit.target_days, habit.target_per_week)}
        />
        <Row label="Visibility" value={group ? `Shared · ${group.name}` : 'Private'} />
        <Row
          label="Reminder"
          value={habit.reminder_at ? habit.reminder_at.slice(0, 5) : 'Off'}
          last
        />
      </Plate>

      {notes.length > 0 ? (
        <Plate label="Notes">
          {notes.map((note, i) => (
            <View
              key={note.id}
              style={[
                styles.note,
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: i === notes.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={[typography.body, styles.noteText, { color: colors.text }]}>
                “{note.note}”
              </Text>
              <Text style={[typography.labelSmall, { color: ink(colors, 62) }]}>
                {note.local_date === today ? 'Today' : note.local_date}
              </Text>
            </View>
          ))}
        </Plate>
      ) : null}

      <Link
        href={{ pathname: '/habit/edit', params: { id: habit.id } }}
        style={[typography.label, styles.edit, { color: colors.accent }]}
      >
        Edit habit
      </Link>

      {habit.archived_at ? (
        <Notice label="Archived">
          {'This habit is archived, so it no longer appears on Today. Its history is kept and you can restore it from the edit screen.'}
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

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.row, { borderBottomColor: colors.divider, borderBottomWidth: last ? 0 : 1 }]}
    >
      <Text style={[typography.label, { color: ink(colors, 62) }]}>{label}</Text>
      <Text style={[typography.body, styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  weekRow: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  // Twelve weeks as columns, Monday at the top: the same strip as everywhere
  // else, turned on its side.
  grid: { flexDirection: 'row', gap: 4, justifyContent: 'space-between', marginTop: space.lg },
  chips: { flexDirection: 'row', gap: space.sm },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenceNote: { marginTop: space.lg },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xl,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  note: { paddingVertical: space.md, gap: space.xs },
  noteText: { fontStyle: 'italic' },
  edit: { paddingHorizontal: 2 },
});
