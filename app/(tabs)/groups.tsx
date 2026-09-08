import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AvatarRow } from '@/components/Avatar';
import { Bar } from '@/components/Bar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import {
  checkInIndex,
  doneKey,
  membersByGroup,
  useAllMembers,
  useCheckIns,
  useGroups,
  useHabits,
} from '@/lib/queries';
import { formatWeekOf, toLocalDate } from '@/lib/date';
import { aggregateCells } from '@/lib/week';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, tnum, typography } from '@/theme/tokens';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const groups = useGroups();
  const members = useAllMembers();
  const habits = useHabits();
  const checkIns = useCheckIns();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () =>
      Promise.all([
        groups.refetch(),
        habits.refetch(),
        checkIns.refetch(),
      ]),
    [groups, habits, checkIns],
  );

  const today = toLocalDate();
  const byGroup = useMemo(() => membersByGroup(members.data), [members.data]);

  /**
   * How much of this week each group has actually kept.
   *
   * This is deliberately the same walk the board itself draws — one row per
   * member, a day counting only when everything owed that day was kept — so
   * the ratio on this card and the ratio at the top of the board are the same
   * number arrived at the same way. Multiplying members by habits by days
   * instead, as this used to, answers a different question and disagreed with
   * the board by a wide margin on any group with more than one habit.
   */
  const stats = useMemo(() => {
    const done = checkInIndex(checkIns.data);

    const map = new Map<string, { habits: number; done: number; owed: number }>();
    for (const group of groups.data ?? []) {
      const shared = (habits.data ?? []).filter((h) => h.group_id === group.id);
      const people = byGroup.get(group.id) ?? [];
      const schedules = shared.map((h) => ({
        id: h.id,
        schedule: {
          cadence: h.cadence,
          targetDays: h.target_days,
          targetPerWeek: h.target_per_week,
        },
        startsOn: h.created_at.slice(0, 10),
      }));

      let kept = 0;
      let owed = 0;
      for (const m of people) {
        const cells = aggregateCells(
          today,
          schedules,
          (habitId, day) => done.has(doneKey(habitId, m.user_id, day)),
          today,
          m.joined_at.slice(0, 10),
        );
        kept += cells.filter((c) => c.state === 'done').length;
        owed += cells.filter((c) => c.state !== 'off').length;
      }

      map.set(group.id, { habits: shared.length, done: kept, owed });
    }
    return map;
  }, [groups.data, habits.data, byGroup, checkIns.data, today]);

  const list = groups.data ?? [];

  return (
    <Screen
      onRefresh={onRefresh} title="Groups" label={formatWeekOf(today)}>
      {groups.error ? (
        <Notice label="Could not load">
          {groups.error instanceof Error ? groups.error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {groups.isLoading ? (
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No groups yet"
          body="Create one and share its six-character code, or enter a friend’s code to join theirs."
          actionLabel="Create a group"
          onAction={() => router.push('/group/new')}
        />
      ) : (
        list.map((group) => {
          const people = byGroup.get(group.id) ?? [];
          const stat = stats.get(group.id) ?? { habits: 0, done: 0, owed: 0 };
          return (
            <Pressable
              key={group.id}
              onPress={() => router.push(`/group/${group.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.name}`}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Plate>
                <View style={styles.top}>
                  <Text
                    numberOfLines={1}
                    style={[typography.cardTitle, styles.grow, { color: colors.text }]}
                  >
                    {group.name}
                  </Text>
                  <Text style={[typography.label, { color: colors.meaning.action }]}>Open</Text>
                </View>

                <Text style={[typography.caption, styles.meta, { color: ink(colors, 70) }]}>
                  {people.length} {people.length === 1 ? 'member' : 'members'} · {stat.habits} shared{' '}
                  {stat.habits === 1 ? 'habit' : 'habits'}
                </Text>

                {people.length ? (
                  <View style={styles.faces}>
                    <AvatarRow
                      people={people.map((m) => ({
                        id: m.user_id,
                        name: m.profile?.display_name ?? '?',
                      }))}
                    />
                  </View>
                ) : null}

                <View style={styles.ratio}>
                  <View style={styles.grow}>
                    <Bar value={stat.done} max={stat.owed} />
                  </View>
                  <Text style={[typography.figureSmall, tnum, { color: colors.text }]}>
                    {stat.done} / {stat.owed}
                  </Text>
                </View>

                <Text style={[typography.caption, styles.caption, { color: ink(colors, 70) }]}>
                  {stat.owed > 0
                    ? 'Days kept this week, of what the group owed'
                    : 'No shared habits yet'}
                </Text>
              </Plate>
            </Pressable>
          );
        })
      )}

      <View style={styles.actions}>
        <Button
          label="New group"
          variant="primary"
          onPress={() => router.push('/group/new')}
          style={styles.grow}
        />
        <Button
          label="Join with code"
          onPress={() => router.push('/group/join')}
          style={styles.grow}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: space.xxxl },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meta: { marginTop: space.sm },
  faces: { marginTop: space.lg },
  ratio: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.lg },
  caption: { marginTop: space.sm },
  actions: { flexDirection: 'row', gap: space.md },
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
});
