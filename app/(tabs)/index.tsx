import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { HabitRow } from '@/components/HabitRow';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/auth/AuthProvider';
import { byHabit, useCheckIns, useGroups, useHabits, useToggleCheckIn } from '@/lib/queries';
import { formatToday, toLocalDate } from '@/lib/date';
import { describeProgress } from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';
import type { Habit } from '@/lib/types';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');

  const today = toLocalDate();
  const habitsQuery = useHabits();
  const checkInsQuery = useCheckIns();
  const groupsQuery = useGroups();
  const toggle = useToggleCheckIn(userId);

  const all = habitsQuery.data ?? [];
  const mine = useMemo(() => all.filter((h) => !h.group_id), [all]);
  const shared = useMemo(() => all.filter((h) => h.group_id), [all]);
  const completed = useMemo(() => byHabit(checkInsQuery.data, userId), [checkInsQuery.data, userId]);

  const visible = tab === 'mine' ? mine : shared;
  const doneToday = visible.filter((h) => completed.get(h.id)?.has(today)).length;

  const loading = habitsQuery.isLoading || checkInsQuery.isLoading;
  const error = habitsQuery.error ?? checkInsQuery.error;

  // Shared habits are grouped under the group they belong to.
  const byGroup = useMemo(() => {
    const map = new Map<string, Habit[]>();
    for (const h of shared) {
      const list = map.get(h.group_id!) ?? [];
      list.push(h);
      map.set(h.group_id!, list);
    }
    return map;
  }, [shared]);

  function row(habit: Habit, last: boolean) {
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
        last={last}
        onToggle={() => toggle.mutate({ habitId: habit.id, date: today, complete: !complete })}
        onPress={() => router.push(`/habit/${habit.id}`)}
      />
    );
  }

  return (
    <Screen
      title="Today"
      eyebrow={
        loading
          ? formatToday(today)
          : `${formatToday(today)} · ${doneToday} of ${visible.length} done`
      }
    >
      {error ? (
        <Notice label="Could not load" tone="bad">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'mine', label: `Mine${mine.length ? ` (${mine.length})` : ''}` },
          { value: 'shared', label: `Shared${shared.length ? ` (${shared.length})` : ''}` },
        ]}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : tab === 'mine' ? (
        mine.length === 0 ? (
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
          <Card title="Private" action="+ Add habit" onAction={() => router.push('/habit/new')}>
            {mine.map((h, i) => row(h, i === mine.length - 1))}
          </Card>
        )
      ) : shared.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <Text style={[typography.rowName, { color: colors.textPrimary }]}>
              No shared habits yet
            </Text>
            <Text style={[typography.body, styles.emptyBody, { color: colors.textSecondary }]}>
              {groupsQuery.data?.length
                ? 'Open a group and add one. Everyone in it checks in against the same habit.'
                : 'Join or create a group first, then add a habit everyone checks in against.'}
            </Text>
            <Link href="/groups" style={[typography.rowName, { color: colors.green }]}>
              Go to groups
            </Link>
          </View>
        </Card>
      ) : (
        [...byGroup.entries()].map(([groupId, list]) => {
          const group = groupsQuery.data?.find((g) => g.id === groupId);
          return (
            <Card
              key={groupId}
              title={group ? (group.emoji ? `${group.emoji} ${group.name}` : group.name) : 'Group'}
              action="Open"
              onAction={() => router.push(`/group/${groupId}`)}
            >
              {list.map((h, i) => row(h, i === list.length - 1))}
            </Card>
          );
        })
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
