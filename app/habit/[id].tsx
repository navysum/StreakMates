import { useMemo } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Heatmap } from '@/components/Heatmap';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { StatusDot } from '@/components/StatusDot';
import { useAuth } from '@/auth/AuthProvider';
import { byHabit, useCheckIns, useGroups, useHabit, useToggleCheckIn } from '@/lib/queries';
import { addDays, formatToday, toLocalDate, WEEKDAY_LABELS } from '@/lib/date';
import { computeStreak, describeProgress, isScheduled, weeklyProgress } from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

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
  const week = weeklyProgress(schedule, dates, today);
  const group = groups.data?.find((g) => g.id === habit.group_id);
  const completeToday = dates.has(today);

  return (
    <Screen
      title={habit.emoji ? `${habit.emoji}  ${habit.title}` : habit.title}
      eyebrow={describeProgress(schedule, dates, today)}
    >
      <Card>
        <View style={styles.todayRow}>
          <View style={styles.todayText}>
            <Text style={[typography.rowName, { color: colors.textPrimary }]}>
              {formatToday(today)}
            </Text>
            <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
              {completeToday
                ? 'DONE'
                : isScheduled(schedule, today)
                  ? 'NOT YET'
                  : 'NOT SCHEDULED TODAY'}
            </Text>
          </View>
          <View
            onStartShouldSetResponder={() => true}
            onResponderRelease={() =>
              toggle.mutate({ habitId: habit.id, date: today, complete: !completeToday })
            }
          >
            <StatusDot complete={completeToday} />
          </View>
        </View>
      </Card>

      <View style={styles.stats}>
        <Stat label="Streak" value={String(streak)} tone={streak > 0 ? 'good' : undefined} />
        <Stat
          label={`Last ${HISTORY}`}
          value={owed.length === 0 ? '—' : `${Math.round((hit / owed.length) * 100)}%`}
        />
        <Stat label="Total" value={String(dates.size)} />
      </View>

      {habit.cadence === 'weekly' ? (
        <Card title="This week">
          <Text style={[typography.stat, { color: colors.textPrimary }]}>
            {week.done} of {week.target}
          </Text>
        </Card>
      ) : null}

      <Card title={`Last ${HISTORY} days`}>
        <Heatmap days={days} done={dates} schedule={schedule} />
        <View style={styles.legend}>
          <Legend color={colors.green} label="Done" />
          <Legend color={colors.greenMuted} label="Missed" />
          <Legend color={colors.neutralChart} label="Not owed" />
        </View>
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.stat, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[typography.stat, { color: tone === 'good' ? colors.green : colors.textPrimary }]}
      >
        {value}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[typography.monoSmall, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
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
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  todayText: { gap: 2 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 10, borderWidth: 1, borderRadius: radius.card, gap: 2 },
  legend: { flexDirection: 'row', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 9, height: 9, borderRadius: 2 },
  row: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  note: { paddingVertical: 9, gap: 2 },
  noteText: { fontStyle: 'italic', lineHeight: 18 },
  edit: { paddingHorizontal: 2 },
});
