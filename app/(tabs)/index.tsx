import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, initials } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { DayProgress } from '@/components/DayProgress';
import { EmptyState } from '@/components/EmptyState';
import { HabitRow } from '@/components/HabitRow';
import { Notice } from '@/components/Notice';
import { Plate } from '@/components/Plate';
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
import { formatDayLabel, toLocalDate } from '@/lib/date';
import { computeStreak, describeProgress, isScheduled } from '@/lib/streak';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, ink, radius, space, typography } from '@/theme/tokens';
import type { Habit } from '@/lib/types';

/** The schedule shape the streak helpers want, off a habit row. */
function scheduleOf(h: Habit) {
  return { cadence: h.cadence, targetDays: h.target_days, targetPerWeek: h.target_per_week };
}

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

  // The ratio counts what is *owed today*, not everything on the list — a
  // habit whose Thursday cell is off is not something left to do.
  const owed = useMemo(
    () => visible.filter((h) => isScheduled(scheduleOf(h), today)),
    [visible, today],
  );
  const doneToday = owed.filter((h) => completed.get(h.id)?.has(today)).length;

  const profile = useProfile(userId);

  // The longest run going among the habits on screen, as the one extra fact
  // the progress plate carries.
  const best = useMemo(() => {
    let top = 0;
    for (const h of visible) {
      const dates = completed.get(h.id) ?? new Set<string>();
      top = Math.max(top, computeStreak(scheduleOf(h), dates, today));
    }
    return top;
  }, [visible, completed, today]);

  const left = owed.length - doneToday;
  const run = best > 1 ? ` Longest run going: ${best} days.` : '';
  const note =
    owed.length === 0
      ? 'Nothing is owed today.'
      : left > 0
        ? `${left} left today.${run}`
        : `Everything owed today is in.${run}`;

  // The most recent thing anyone in a group did, as the reason to tap through
  // to the feed. Only shared habits ever appear here — a private habit is
  // private, including from this preview.
  const people = usePeople();
  const latest = useMemo(() => {
    const sharedById = new Map(
      (habitsQuery.data ?? []).filter((h) => h.group_id).map((h) => [h.id, h]),
    );
    const feed = (checkInsQuery.data ?? [])
      .filter((c) => sharedById.has(c.habit_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const head = feed[0];
    if (!head) return null;
    const person = peopleById(people.data).get(head.user_id);
    return {
      habit: sharedById.get(head.habit_id)!,
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
    const schedule = scheduleOf(habit);
    return (
      <HabitRow
        key={habit.id}
        name={habit.title}
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
      label={formatDayLabel(today)}
      trailing={
        profile.data ? (
          <Pressable
            onPress={() => router.push('/you')}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            style={({ pressed }) => [
              styles.avatar,
              { borderColor: colors.divider, backgroundColor: colors.accents[100] },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[typography.figure, { color: colors.accents[700] }]}>
              {initials(profile.data.display_name)}
            </Text>
          </Pressable>
        ) : null
      }
    >
      {error ? (
        <Notice label="Could not load">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {loading ? null : (
        <DayProgress
          done={doneToday}
          total={owed.length}
          label={tab === 'mine' ? 'Private · owed today' : 'Shared · owed today'}
          note={note}
        />
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'mine', label: `Mine · ${mine.length}` },
          { value: 'shared', label: `Shared · ${shared.length}` },
        ]}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
      ) : tab === 'mine' ? (
        mine.length === 0 ? (
          <EmptyState
            title="No habits yet"
            body="Add your first one. All it needs is a name — everything else has a sensible default."
            actionLabel="Add habit"
            onAction={() => router.push('/habit/new')}
          />
        ) : (
          <Plate label="Private" flush>
            {mine.map((h, i) => row(h, i === mine.length - 1))}
          </Plate>
        )
      ) : shared.length === 0 ? (
        <EmptyState
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
            <Plate
              key={groupId}
              label={group?.name ?? 'Group'}
              action="Open board"
              onAction={() => router.push(`/group/${groupId}`)}
              flush
            >
              {list.map((h, i) => row(h, i === list.length - 1))}
            </Plate>
          );
        })
      )}

      {latest ? (
        <Plate
          label="Activity"
          action="See all"
          onAction={() => router.push('/activity')}
        >
          <Pressable
            onPress={() => router.push('/activity')}
            accessibilityRole="button"
            accessibilityLabel="Open activity"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={styles.feedRow}>
              <Avatar name={latest.who} size={32} />
              <Text numberOfLines={2} style={[typography.body, styles.grow, { color: colors.text }]}>
                <Text style={typography.bodyStrong}>{latest.who}</Text>
                {' checked in on '}
                <Text style={typography.bodyStrong}>{latest.habit.title}</Text>
              </Text>
            </View>
            {latest.more > 0 ? (
              <Text style={[typography.caption, styles.more, { color: ink(colors, 70) }]}>
                and {latest.more} more {latest.more === 1 ? 'check-in' : 'check-ins'} from the group
              </Text>
            ) : null}
          </Pressable>
        </Plate>
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
  links: { flexDirection: 'row', gap: space.lg },
  pressed: { opacity: 0.6 },
  avatar: {
    width: hit,
    height: hit,
    borderWidth: 1,
    borderRadius: radius.none,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  grow: { flex: 1, minWidth: 0 },
  more: { marginTop: space.md },
});
