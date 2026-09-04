import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, AvatarStack } from '@/components/Avatar';
import { Bar } from '@/components/Bar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useAllMembers, useCheckIns, useGroups, useHabits, membersByGroup } from '@/lib/queries';
import { fromLocalDate, startOfWeek, toLocalDate } from '@/lib/date';
import { weekOf } from '@/lib/week';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, typography } from '@/theme/tokens';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const groups = useGroups();
  const members = useAllMembers();
  const habits = useHabits();
  const checkIns = useCheckIns();

  const today = toLocalDate();
  const byGroup = useMemo(() => membersByGroup(members.data), [members.data]);

  // Shared habits per group, and how much of this week the group has actually
  // kept: every member owes every shared habit every day of the week so far.
  const week = useMemo(() => weekOf(today), [today]);
  const elapsed = useMemo(() => week.filter((d) => d <= today), [week, today]);

  const stats = useMemo(() => {
    const done = new Set(
      (checkIns.data ?? [])
        .filter((c) => week.includes(c.local_date))
        .map((c) => `${c.habit_id}|${c.user_id}|${c.local_date}`),
    );

    const map = new Map<string, { habits: number; done: number; owed: number }>();
    for (const group of groups.data ?? []) {
      const shared = (habits.data ?? []).filter((h) => h.group_id === group.id);
      const people = byGroup.get(group.id) ?? [];
      let hit = 0;
      for (const h of shared) {
        for (const m of people) {
          for (const day of elapsed) if (done.has(`${h.id}|${m.user_id}|${day}`)) hit++;
        }
      }
      map.set(group.id, {
        habits: shared.length,
        done: hit,
        owed: shared.length * people.length * elapsed.length,
      });
    }
    return map;
  }, [groups.data, habits.data, byGroup, checkIns.data, week, elapsed]);

  const list = groups.data ?? [];
  const weekLabel = fromLocalDate(startOfWeek(today)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Screen title="Groups" eyebrow={`Week of ${weekLabel}`}>
      {groups.error ? (
        <Notice label="Could not load" tone="bad">
          {groups.error instanceof Error ? groups.error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {groups.isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="👥"
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
              <Card>
                <View style={styles.top}>
                  <View style={[styles.tile, { backgroundColor: colors.bgSurfaceMuted }]}>
                    <Text style={styles.glyph}>{group.emoji ?? '👥'}</Text>
                  </View>

                  <View style={styles.head}>
                    <Text
                      numberOfLines={1}
                      style={[typography.cardTitle, { color: colors.textPrimary }]}
                    >
                      {group.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {people.length} {people.length === 1 ? 'member' : 'members'} ·{' '}
                      {stat.habits} shared {stat.habits === 1 ? 'habit' : 'habits'}
                    </Text>
                  </View>

                  <Text style={[styles.chevron, { color: colors.borderStrong }]}>›</Text>
                </View>

                <View style={styles.bottom}>
                  {people.length ? (
                    <AvatarStack
                      people={people.map((m) => ({
                        id: m.user_id,
                        name: m.profile?.display_name ?? '?',
                      }))}
                    />
                  ) : null}

                  <View style={styles.progress}>
                    <Bar value={stat.done} max={stat.owed} />
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {stat.owed > 0
                        ? `${stat.done} of ${stat.owed} check-ins this week`
                        : 'No shared habits yet'}
                    </Text>
                  </View>
                </View>
              </Card>
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
        <Button label="Join with code" onPress={() => router.push('/group/join')} style={styles.grow} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: space.xxxl },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 20, lineHeight: 24 },
  head: { flex: 1, minWidth: 0, gap: 2 },
  chevron: { fontSize: 26, lineHeight: 26, marginTop: -2 },
  bottom: { marginTop: space.lg, gap: space.sm },
  progress: { gap: space.sm },
  actions: { flexDirection: 'row', gap: space.md },
  grow: { flex: 1 },
  pressed: { opacity: 0.7 },
});
