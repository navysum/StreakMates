import { useMemo } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatTrio } from '@/components/StatTrio';
import { WeekStrip } from '@/components/WeekStrip';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import { byHabit, useCheckIns, useGroups, useHabit, useToggleCheckIn } from '@/lib/queries';
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
import { radius, space, typography } from '@/theme/tokens';

const HISTORY = 40;

export default function HabitDetailScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const habitQuery = useHabit(id);
  const checkIns = useCheckIns();
  const groups = useGroups();
  const toggle = useToggleCheckIn(userId);

  const habit = habitQuery.data;
  const today = toLocalDate();

  const dates = useMemo(
    () => byHabit(checkIns.data, userId).get(id ?? '') ?? new Set<string>(),
    [checkIns.data, userId, id],
  );

  const notes = useMemo(
    () =>
      (checkIns.data ?? [])
        .filter((c) => c.habit_id === id && c.user_id === userId && c.note)
        .sort((a, b) => b.local_date.localeCompare(a.local_date))
        .slice(0, 5),
    [checkIns.data, id, userId],
  );

  if (habitQuery.isLoading || !habit) {
    return (
      <Screen title="Habit">
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
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

  return (
    <Screen
      title={habit.title}
      eyebrow={`${group ? group.name : 'Private'} · ${cadenceLabel(habit.cadence, habit.target_days, habit.target_per_week)}`}
      trailing={
        habit.emoji ? (
          <View style={[styles.tile, { backgroundColor: colors.bgSurfaceMuted }]}>
            <Text style={styles.tileGlyph}>{habit.emoji}</Text>
          </View>
        ) : null
      }
      footer={
        <Button
          label={completeToday ? '✓  Done today' : 'Check in for today'}
          variant={completeToday ? 'default' : 'primary'}
          onPress={() =>
            toggle.mutate({ habitId: habit.id, date: today, complete: !completeToday })
          }
        />
      }
    >
      <StatTrio
        stats={[
          { value: String(streak), label: 'Streak' },
          { value: String(best), label: 'Best' },
          {
            value: owed.length === 0 ? '—' : `${Math.round((hit / owed.length) * 100)}%`,
            label: `${HISTORY}-day rate`,
          },
        ]}
      />

      {habit.cadence === 'weekly' ? (
        <Card title="This week">
          <Text style={[typography.stat, { color: colors.textPrimary }]}>
            {week.done} of {week.target}
          </Text>
        </Card>
      ) : null}

      <Card title="Last 12 weeks">
        <View style={styles.grid}>
          {grid.map((week, i) => (
            <WeekStrip key={i} cells={week} size={20} direction="column" />
          ))}
        </View>
      </Card>

      <Card title="Cadence">
        <View style={styles.chips}>
          {WEEKDAY_LABELS.map((letter, i) => {
            const on = habit.cadence === 'days' && habit.target_days.includes(i + 1);
            const flexible = habit.cadence !== 'days';
            return (
              <View
                key={i}
                style={[
                  styles.chip,
                  flexible
                    ? { backgroundColor: colors.bgPage, borderColor: colors.borderDefault }
                    : on
                      ? { backgroundColor: colors.greenSoft, borderColor: colors.green }
                      : { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    styles.chipText,
                    { color: !flexible && on ? colors.green : colors.textMuted },
                  ]}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[typography.caption, styles.cadenceNote, { color: colors.textSecondary }]}>
          {describeProgress(schedule, dates, today)}
        </Text>
      </Card>

      <Card title="Details">
        <Row label="Cadence" value={cadenceLabel(habit.cadence, habit.target_days, habit.target_per_week)} />
        <Row label="Visibility" value={group ? `Shared · ${group.name}` : 'Private'} />
        <Row label="Reminder" value={habit.reminder_at ? habit.reminder_at.slice(0, 5) : 'Off'} last />
      </Card>

      {notes.length > 0 ? (
        <Card title="Notes">
          {notes.map((note, i) => (
            <View
              key={note.id}
              style={[
                styles.note,
                {
                  borderBottomColor: colors.borderDefault,
                  borderBottomWidth: i === notes.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={[typography.body, styles.noteText, { color: colors.textPrimary }]}>
                “{note.note}”
              </Text>
              <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
                {note.local_date === today ? 'TODAY' : note.local_date}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Link
        href={{ pathname: '/habit/edit', params: { id: habit.id } }}
        style={[typography.rowName, styles.edit, { color: colors.green }]}
      >
        Edit habit
      </Link>

      {habit.archived_at ? (
        <Notice label="Archived" tone="warn">
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
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.rowName, styles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGlyph: { fontSize: 26, lineHeight: 32 },
  // Twelve weeks as columns, Monday at the top: the same strip as everywhere
  // else, turned on its side.
  grid: { flexDirection: 'row', gap: 4, justifyContent: 'space-between' },
  chips: { flexDirection: 'row', gap: space.sm },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: 'DMSans-SemiBold' },
  cadenceNote: { marginTop: space.md },
  row: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  note: { paddingVertical: 9, gap: 2 },
  noteText: { fontStyle: 'italic' },
  edit: { paddingHorizontal: 2 },
});
