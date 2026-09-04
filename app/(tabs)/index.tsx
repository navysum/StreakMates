import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DayProgress } from '@/components/DayProgress';
import { EmptyState } from '@/components/EmptyState';
import { HabitRow } from '@/components/HabitRow';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/auth/AuthProvider';
import {
  byHabit,
  useCheckIns,
  useGroups,
  useHabitOrder,
  useHabits,
  useToggleCheckIn,
} from '@/lib/queries';
import { sortHabits } from '@/lib/ordering';
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
  const order = useHabitOrder(userId);
  const toggle = useToggleCheckIn(userId);

  const all = habitsQuery.data ?? [];
  const positions = order.data ?? new Map<string, number>();
  // Each list is arranged separately, and only for you.
  const mine = useMemo(
    () => sortHabits(all.filter((h) => !h.group_id), positions),
    [all, positions],
  );
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
    for (const [id, list] of map) map.set(id, sortHabits(list, positions));
    return map;
  }, [shared, positions]);

  function row(habit: Habit, last: boolean) {
    const dates = completed.get(habit.id) ?? new Set<string>();
    const complete = dates.has(today);
    return (
      <HabitRow
        key={habit.id}
        name={habit.title}
        icon={habit.emoji}
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
    <Screen title="Today">
      {error ? (
        <Notice label="Could not load" tone="bad">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {loading ? null : (
        <DayProgress done={doneToday} total={visible.length} date={formatToday(today)} />
      )}

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
          <EmptyState
            icon="✨"
            title="No habits yet"
            body="Add your first one. All it needs is a name — everything else has a sensible default."
            actionLabel="Add habit"
            onAction={() => router.push('/habit/new')}
          />
        ) : (
          <Card title="Private" flush>
            {mine.map((h, i) => row(h, i === mine.length - 1))}
          </Card>
        )
      ) : shared.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No shared habits yet"
          body={
            groupsQuery.data?.length
              ? 'Open a group and add one. Everyone in it checks in against the same habit.'
              : 'Join or create a group first, then add a habit everyone checks in against.'
          }
          actionLabel="Go to groups"
          onAction={() => router.push('/groups')}
        />
      ) : (
        [...byGroup.entries()].map(([groupId, list]) => {
          const group = groupsQuery.data?.find((g) => g.id === groupId);
          return (
            <Card
              key={groupId}
              title={group ? (group.emoji ? `${group.emoji} ${group.name}` : group.name) : 'Group'}
              action="Open"
              onAction={() => router.push(`/group/${groupId}`)}
              flush
            >
              {list.map((h, i) => row(h, i === list.length - 1))}
            </Card>
          );
        })
      )}

      <View style={styles.links}>
        <Button
          label="Add habit"
          variant="primary"
          onPress={() => router.push('/habit/new')}
          style={styles.grow}
        />
        <Button label="Manage" onPress={() => router.push('/manage')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  links: { flexDirection: 'row', gap: 12 },
  grow: { flex: 1 },
});
