import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { YouCorner } from '@/components/YouCorner';
import { Button } from '@/components/ui';
import { DayProgress } from '@/components/DayProgress';
import { EmptyState } from '@/components/EmptyState';
import { HabitRow } from '@/components/HabitRow';
import { Milestone } from '@/components/Milestone';
import { DayProgressSkeleton, RowsSkeleton } from '@/components/Skeleton';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { useAuth } from '@/auth/AuthProvider';
import {
  byHabit,
  useCheckIns,
  useGroups,
  useHabitOrder,
  useHabits,
  usePeople,
  useProfile,
  useSetArchived,
  useToggleCheckIn,
  peopleById,
} from '@/lib/queries';
import { handle } from '@/lib/identity';
import { useRemembered } from '@/lib/remembered';
import { feel } from '@/lib/feel';
import { reachedMilestone } from '@/lib/milestone';
import { sortHabits } from '@/lib/ordering';
import { weekCells } from '@/lib/week';
import { formatDayLabel, toLocalDate } from '@/lib/date';
import { computeStreak, describeProgress, isScheduled } from '@/lib/streak';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import type { Habit } from '@/lib/types';

/** The schedule shape the streak helpers want, off a habit row. */
function scheduleOf(h: Habit) {
  return { cadence: h.cadence, targetDays: h.target_days, targetPerWeek: h.target_per_week };
}

export default function TodayScreen() {
  const styles = useThemedStyles(makeStyles);
  const { userId } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useRemembered('today.tab', 'mine', ['mine', 'shared'] as const);

  const today = toLocalDate();
  // The habit whose contextual actions are open. Null when the sheet is shut.
  const [menuFor, setMenuFor] = useState<Habit | null>(null);
  // The run that was just reached, if this visit reached one.
  const [milestone, setMilestone] = useState<{ title: string; days: number } | null>(null);
  const setArchived = useSetArchived();
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

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () =>
      Promise.all([
        habitsQuery.refetch(),
        checkInsQuery.refetch(),
        groupsQuery.refetch(),
        order.refetch(),
        profile.refetch(),
      ]),
    [habitsQuery, checkInsQuery, groupsQuery, order, profile],
  );

  // The longest run going among the habits on screen, as the one extra fact
  // the day's progress carries.
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
      ? 'Nothing is owed today. Enjoy the rest.'
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

  /**
   * Checking in, and the two things that make it land.
   *
   * The write itself is optimistic — the stamp comes down before the network
   * is asked. What makes it land is the NavySum completion: the seal stamping
   * down with a success haptic, and, on the day a run reaches a week or a
   * month, one quiet line saying so. Taking a check-in back is a lighter
   * touch, so undo is distinguishable by feel.
   *
   * The streak is computed from the set the toggle is about to produce rather
   * than from the query, because the query has not been told yet. Waiting for
   * it would put the moment a beat behind the tap.
   */
  function onToggle(habit: Habit, dates: Set<string>, complete: boolean) {
    toggle.mutate({ habitId: habit.id, date: today, complete: !complete });

    if (complete) {
      feel('select');
      return;
    }

    feel('success');
    const schedule = scheduleOf(habit);
    const before = computeStreak(schedule, dates, today);
    const after = computeStreak(schedule, new Set([...dates, today]), today);
    if (reachedMilestone(before, after)) setMilestone({ title: habit.title, days: after });
  }

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
        onToggle={() => onToggle(habit, dates, complete)}
        onPress={() => router.push(`/habit/${habit.id}`)}
        onLongPress={() => setMenuFor(habit)}
      />
    );
  }

  return (
    <Screen
      onRefresh={onRefresh}
      title="Today"
      label={formatDayLabel(today)}
      trailing={<YouCorner />}
    >
      {error ? (
        <Notice
          label="Could not load"
          action={{ title: 'Try again', onPress: () => void onRefresh() }}
        >
          {'Your habits did not load. Check your connection, then try again.'}
        </Notice>
      ) : null}

      {milestone ? (
        <Milestone
          // Keyed by the run, so reaching a second milestone in one sitting
          // starts afresh rather than inheriting the first one's timer.
          key={`${milestone.title}-${milestone.days}`}
          title={milestone.title}
          days={milestone.days}
          onDone={() => setMilestone(null)}
        />
      ) : null}

      {loading ? (
        <DayProgressSkeleton />
      ) : (
        <DayProgress
          done={doneToday}
          total={owed.length}
          label={tab === 'mine' ? 'Private · owed today' : 'Shared · owed today'}
          note={note}
        />
      )}

      <Segmented
        accessibilityLabel="Which habits"
        value={tab}
        onChange={setTab}
        // No counts until they are real. "Mine · 0" during the first load is
        // not a placeholder, it is a wrong number — and the one it is most
        // likely to be mistaken for is "you have no habits".
        options={[
          { value: 'mine', label: loading ? 'Mine' : `Mine · ${mine.length}` },
          { value: 'shared', label: loading ? 'Shared' : `Shared · ${shared.length}` },
        ]}
      />

      {loading ? (
        <RowsSkeleton />
      ) : tab === 'mine' ? (
        mine.length === 0 ? (
          <EmptyState
            title="No habits yet"
            body="Add your first one. All it needs is a name — everything else has a sensible default."
            actionLabel="Add a habit"
            onAction={() => router.push('/habit/new')}
          />
        ) : (
          <Section label="Private" list>
            {mine.map((h, i) => row(h, i === mine.length - 1))}
          </Section>
        )
      ) : shared.length === 0 ? (
        <EmptyState
          title="No shared habits yet"
          body={
            groupsQuery.data?.length
              ? 'Open a group and add one. Everyone in it checks in against the same habit.'
              : 'Join or start a group first, then add a habit everyone checks in against.'
          }
          actionLabel="Go to groups"
          onAction={() => router.push('/groups')}
        />
      ) : (
        [...byGroup.entries()].map(([groupId, list]) => {
          const group = groupsQuery.data?.find((g) => g.id === groupId);
          return (
            <Section
              key={groupId}
              label={group?.name ?? 'Group'}
              action="Board"
              actionLabel={`Open the board for ${group?.name ?? 'the group'}`}
              onAction={() => router.push(`/group/${groupId}`)}
              list
            >
              {list.map((h, i) => row(h, i === list.length - 1))}
            </Section>
          );
        })
      )}

      {latest ? (
        <Section label="Activity" action="See all" onAction={() => router.push('/activity')} list>
          <Row
            last
            onPress={() => router.push('/activity')}
            accessibilityLabel={`${latest.who} checked in on ${latest.habit.title}. Open activity`}
          >
            <Avatar name={latest.who} size={32} />
            <View style={styles.grow}>
              <Text numberOfLines={2} style={styles.feed}>
                <Text style={styles.strong}>{latest.who}</Text>
                {' checked in on '}
                <Text style={styles.strong}>{latest.habit.title}</Text>
              </Text>
              {latest.more > 0 ? (
                <Text style={styles.more}>
                  and {latest.more} more {latest.more === 1 ? 'check-in' : 'check-ins'} from your groups
                </Text>
              ) : null}
            </View>
          </Row>
        </Section>
      ) : null}

      <View style={styles.links}>
        <Button title="Add habit" onPress={() => router.push('/habit/new')} style={styles.grow} />
        <Button title="Manage" variant="outline" onPress={() => router.push('/manage')} />
      </View>

      {/* Contextual actions. Nothing here is exclusive to the gesture:
          Open is the row's own tap, Edit is a link on the detail screen, and
          Archive is a button on the edit screen. Delete is deliberately absent
          — an accidental long press must not be two taps from destroying a
          year of check-ins. */}
      <Sheet
        visible={menuFor !== null}
        title={menuFor?.title}
        onClose={() => setMenuFor(null)}
        actions={
          menuFor
            ? [
                {
                  label: 'Open',
                  hint: 'History, streak and details',
                  onPress: () => router.push(`/habit/${menuFor.id}`),
                },
                {
                  label: 'Edit',
                  hint: 'Name, schedule and sharing',
                  onPress: () =>
                    router.push({ pathname: '/habit/edit', params: { id: menuFor.id } }),
                },
                {
                  label: menuFor.archived_at ? 'Restore' : 'Archive',
                  hint: menuFor.archived_at
                    ? 'Put it back on Today'
                    : 'Off Today, but every check-in is kept',
                  onPress: () =>
                    setArchived.mutate({
                      id: menuFor.id,
                      archived: !menuFor.archived_at,
                    }),
                },
              ]
            : []
        }
      />
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    links: { flexDirection: 'row', gap: space.md },
    grow: { flex: 1, minWidth: 0 },
    feed: { ...t.type.body, color: t.colors.ink },
    strong: { fontFamily: t.fonts.uiMedium },
    more: { ...t.type.italic, color: t.colors.inkMuted, marginTop: 2 },
  });
