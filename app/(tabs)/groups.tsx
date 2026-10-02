import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AvatarRow } from '@/components/Avatar';
import { Bar } from '@/components/Bar';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { RowsSkeleton } from '@/components/Skeleton';
import { YouCorner } from '@/components/YouCorner';
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
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

export default function GroupsScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  const groups = useGroups();
  const members = useAllMembers();
  const habits = useHabits();
  const checkIns = useCheckIns();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () => Promise.all([groups.refetch(), members.refetch(), habits.refetch(), checkIns.refetch()]),
    [groups, members, habits, checkIns],
  );

  const today = toLocalDate();
  const byGroup = useMemo(() => membersByGroup(members.data), [members.data]);

  /**
   * How much of this week each group has actually kept.
   *
   * Deliberately the same walk the board itself draws — one row per member, a
   * day counting only when everything owed that day was kept — so the ratio
   * here and the ratio at the top of the board are the same number arrived at
   * the same way.
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
    <Screen onRefresh={onRefresh} title="Groups" label={formatWeekOf(today)} trailing={<YouCorner />}>
      {groups.error ? (
        <Notice label="Could not load" action={{ title: 'Try again', onPress: () => void onRefresh() }}>
          {'Your groups did not load. Check your connection, then try again.'}
        </Notice>
      ) : null}

      {groups.isLoading ? (
        <RowsSkeleton rows={2} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No groups yet"
          body="Start one and share its six-character code, or enter a friend’s code to join theirs."
          actionLabel="Start a group"
          onAction={() => router.push('/group/new')}
        />
      ) : (
        <Section label="Your groups" list>
          {list.map((group, i) => {
            const people = byGroup.get(group.id) ?? [];
            const stat = stats.get(group.id) ?? { habits: 0, done: 0, owed: 0 };
            const members = `${people.length} ${people.length === 1 ? 'member' : 'members'}`;
            const shared = `${stat.habits} shared ${stat.habits === 1 ? 'habit' : 'habits'}`;
            return (
              <Row
                key={group.id}
                last={i === list.length - 1}
                onPress={() => router.push(`/group/${group.id}`)}
                accessibilityLabel={`${group.name}, ${members}, ${shared}${
                  stat.owed > 0 ? `, ${stat.done} of ${stat.owed} days kept this week` : ''
                }. Open`}
                style={styles.group}
              >
                <Text numberOfLines={1} style={styles.name}>
                  {group.name}
                </Text>
                <Text style={styles.meta}>
                  {members} · {shared}
                </Text>

                {people.length ? (
                  <AvatarRow
                    people={people.map((m) => ({
                      id: m.user_id,
                      name: m.profile?.display_name ?? '?',
                    }))}
                  />
                ) : null}

                {stat.owed > 0 ? (
                  <View style={styles.ratio}>
                    <View style={styles.grow}>
                      <Bar value={stat.done} max={stat.owed} />
                    </View>
                    <Text style={styles.figure}>
                      {stat.done} of {stat.owed}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.meta}>
                  {stat.owed > 0
                    ? 'Days kept this week, of what the group owed.'
                    : 'No shared habits yet.'}
                </Text>
              </Row>
            );
          })}
        </Section>
      )}

      <View style={styles.actions}>
        <Button title="New group" onPress={() => router.push('/group/new')} style={styles.grow} />
        <Button
          title="Join"
          variant="outline"
          accessibilityLabel="Join a group with a code"
          onPress={() => router.push('/group/join')}
          style={styles.grow}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    group: { flexDirection: 'column', alignItems: 'stretch', gap: space.sm, paddingVertical: space.lg },
    name: { ...t.type.heading, color: t.colors.ink },
    meta: { ...t.type.italic, color: t.colors.inkMuted },
    ratio: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
    figure: { ...t.type.figureSmall, color: t.colors.ink },
    actions: { flexDirection: 'row', gap: space.md },
    grow: { flex: 1, minWidth: 0 },
  });
