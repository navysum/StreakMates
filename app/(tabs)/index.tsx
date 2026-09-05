import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
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
  usePeople,
  useProfile,
  useToggleCheckIn,
  peopleById,
} from '@/lib/queries';
import { handle } from '@/lib/identity';
import { sortHabits } from '@/lib/ordering';
import { weekCells } from '@/lib/week';
import { formatToday, toLocalDate } from '@/lib/date';
import { computeStreak, describeProgress } from '@/lib/streak';
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

  const profile = useProfile(userId);

  // The longest run going among the habits on screen, as the one extra fact
  // the progress card carries.
  const streakNote = useMemo(() => {
    let best = 0;
    for (const h of visible) {
      const dates = completed.get(h.id) ?? new Set<string>();
      best = Math.max(
        best,
        computeStreak(
          { cadence: h.cadence, targetDays: h.target_days, targetPerWeek: h.target_per_week },
          dates,
          today,
        ),
      );
    }
    return best > 1 ? `${best} day streak` : undefined;
  }, [visible, completed, today]);

  // The most recent thing anyone in a group did, as the reason to tap through
  // to the feed. Only shared habits ever appear here — a private habit is
  // private, including from this preview.
  const people = usePeople();
  const latest = useMemo(() => {
    const shared = new Map(
      (habitsQuery.data ?? []).filter((h) => h.group_id).map((h) => [h.id, h]),
    );
    const feed = (checkInsQuery.data ?? [])
      .filter((c) => shared.has(c.habit_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const head = feed[0];
    if (!head) return null;
    const person = peopleById(people.data).get(head.user_id);
    return {
      checkIn: head,
      habit: shared.get(head.habit_id)!,
      who: head.user_id === userId ? 'You' : handle(person),
      more: feed.length - 1,
    };
  }, [habitsQuery.data, checkInsQuery.data, people.data, userId]);

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
    const schedule = {
      cadence: habit.cadence,
      targetDays: habit.target_days,
      targetPerWeek: habit.target_per_week,
    };
    return (
      <HabitRow
        key={habit.id}
        name={habit.title}
        icon={habit.emoji}
        week={weekCells(today, dates, schedule, today)}
        meta={describeProgress(schedule, dates, today)}
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
      eyebrow={formatToday(today)}
      trailing={
        profile.data ? (
          <Pressable
            onPress={() => router.push('/you')}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Avatar id={profile.data.id} name={profile.data.display_name} size={44} />
          </Pressable>
        ) : null
      }
    >
      {error ? (
        <Notice label="Could not load" tone="bad">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {loading ? null : (
        <DayProgress
          done={doneToday}
          total={visible.length}
          label={tab === 'mine' ? 'Private habits' : 'Shared habits'}
          note={streakNote}
        />
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

      {latest ? (
        <Pressable
          onPress={() => router.push('/activity')}
          accessibilityRole="button"
          accessibilityLabel="Open activity"
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card title="Activity" action="See all" flush>
            <View style={styles.feedRow}>
              <Avatar
                id={latest.checkIn.user_id}
                name={latest.who}
                size={32}
              />
              <Text numberOfLines={2} style={[typography.body, styles.grow, { color: colors.textPrimary }]}>
                <Text style={styles.strong}>{latest.who}</Text>
                {' checked in on '}
                <Text style={styles.strong}>{latest.habit.title}</Text>
              </Text>
              {latest.habit.emoji ? (
                <View style={[styles.feedTile, { backgroundColor: colors.bgSurfaceMuted }]}>
                  <Text style={styles.feedGlyph}>{latest.habit.emoji}</Text>
                </View>
              ) : null}
            </View>
            {latest.more > 0 ? (
              <Text style={[typography.caption, styles.more, { color: colors.textMuted }]}>
                and {latest.more} more {latest.more === 1 ? 'check-in' : 'check-ins'} from the group
              </Text>
            ) : null}
          </Card>
        </Pressable>
      ) : null}

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
  pressed: { opacity: 0.6 },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  grow: { flex: 1, minWidth: 0 },
  strong: { fontFamily: 'DMSans-SemiBold' },
  feedTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedGlyph: { fontSize: 16, lineHeight: 20 },
  more: { marginTop: 8 },
});
