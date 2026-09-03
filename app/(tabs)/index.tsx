import { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { HabitRow } from '@/components/HabitRow';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import { byHabit, useCheckIns, useHabits, useToggleCheckIn } from '@/lib/queries';
import { formatToday, toLocalDate } from '@/lib/date';
import { describeProgress } from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();

  const today = toLocalDate();
  const habitsQuery = useHabits();
  const checkInsQuery = useCheckIns();
  const toggle = useToggleCheckIn(userId);

  const habits = habitsQuery.data ?? [];
  const completed = useMemo(() => byHabit(checkInsQuery.data, userId), [checkInsQuery.data, userId]);

  const doneToday = habits.filter((h) => completed.get(h.id)?.has(today)).length;
  const loading = habitsQuery.isLoading || checkInsQuery.isLoading;
  const error = habitsQuery.error ?? checkInsQuery.error;

  return (
    <Screen
      title="Today"
      eyebrow={
        loading
          ? formatToday(today)
          : `${formatToday(today)} · ${doneToday} of ${habits.length} done`
      }
    >
      {error ? (
        <Notice label="Could not load" tone="bad">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : habits.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <Text style={[typography.rowName, { color: colors.textPrimary }]}>No habits yet</Text>
            <Text style={[typography.body, styles.emptyBody, { color: colors.textSecondary }]}>
              Add your first one. All it needs is a name — everything else has a sensible default.
            </Text>
            <Link href="/habit/new" style={[typography.rowName, { color: colors.green }]}>
              + Add habit
            </Link>
          </View>
        </Card>
      ) : (
        <Card title="Private" action="+ Add habit">
          {habits.map((habit, i) => {
            const dates = completed.get(habit.id) ?? new Set<string>();
            const complete = dates.has(today);
            return (
              <HabitRow
                key={habit.id}
                name={habit.emoji ? `${habit.emoji}  ${habit.title}` : habit.title}
                meta={describeProgress(
                  {
                    cadence: habit.cadence,
                    targetDays: habit.target_days,
                    targetPerWeek: habit.target_per_week,
                  },
                  dates,
                  today,
                )}
                complete={complete}
                last={i === habits.length - 1}
                onToggle={() =>
                  toggle.mutate({ habitId: habit.id, date: today, complete: !complete })
                }
                onPress={() => router.push(`/habit/${habit.id}`)}
              />
            );
          })}
        </Card>
      )}

      <View style={styles.links}>
        <Link href="/habit/new" style={[typography.rowName, { color: colors.green }]}>
          + Add habit
        </Link>
        <Link href="/manage" style={[typography.rowName, { color: colors.textMuted }]}>
          Manage
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 24 },
  empty: { gap: 7, paddingVertical: 4, alignItems: 'flex-start' },
  emptyBody: { lineHeight: 18 },
  links: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
});
