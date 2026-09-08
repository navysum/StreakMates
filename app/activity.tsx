import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Plate } from '@/components/Plate';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { ReactionBar } from '@/components/ReactionBar';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import { handle } from '@/lib/identity';
import {
  peopleById,
  reactionSummary,
  useCheckIns,
  useGroups,
  useHabits,
  usePeople,
  useReactions,
  useToggleReaction,
} from '@/lib/queries';
import { addDays, toLocalDate } from '@/lib/date';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, ink, radius, space, typography } from '@/theme/tokens';

const FEED_DAYS = 14;

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();

  const habits = useHabits();
  const checkIns = useCheckIns();
  const people = usePeople();
  const groups = useGroups();
  const reactions = useReactions();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () =>
      Promise.all([
        habits.refetch(),
        checkIns.refetch(),
        groups.refetch(),
        reactions.refetch(),
      ]),
    [habits, checkIns, groups, reactions],
  );
  const toggle = useToggleReaction(userId);

  const names = useMemo(() => peopleById(people.data), [people.data]);
  const summary = useMemo(() => reactionSummary(reactions.data, userId), [reactions.data, userId]);

  /**
   * Shared check-ins only. A private habit in a feed other people can read
   * would be exactly the leak the whole permission model exists to prevent.
   */
  const feed = useMemo(() => {
    const shared = new Map(
      (habits.data ?? []).filter((h) => h.group_id).map((h) => [h.id, h]),
    );
    const since = addDays(toLocalDate(), -FEED_DAYS);
    return (checkIns.data ?? [])
      .filter((c) => shared.has(c.habit_id) && c.local_date >= since)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 60)
      .map((c) => ({ checkIn: c, habit: shared.get(c.habit_id)! }));
  }, [checkIns.data, habits.data]);

  const loading = habits.isLoading || checkIns.isLoading || people.isLoading;

  return (
    <Screen
      onRefresh={onRefresh}
      title="Activity"
      label={feed.length ? `Last ${FEED_DAYS} days` : 'Nothing yet'}
      trailing={
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [
            styles.close,
            { borderColor: colors.divider },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[typography.action, { color: ink(colors, 70) }]}>✕</Text>
        </Pressable>
      }
    >
      {loading ? (
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
      ) : feed.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          body={
            groups.data?.length
              ? 'Check in on a shared habit and it shows up here for the group.'
              : 'Join or create a group, add a shared habit, and check-ins appear here.'
          }
          actionLabel="Go to groups"
          onAction={() => router.push('/groups')}
        />
      ) : (
        <Plate label="Recent" flush>
          {feed.map(({ checkIn, habit }, i) => {
            const person = names.get(checkIn.user_id);
            const group = groups.data?.find((g) => g.id === habit.group_id);
            return (
              <View
                key={checkIn.id}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.divider,
                    borderBottomWidth: i === feed.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <Avatar name={person?.display_name ?? 'Someone'} size={32} />

                <View style={styles.text}>
                  <Text style={[typography.body, { color: colors.text }]}>
                    <Text style={typography.bodyStrong}>
                      {checkIn.user_id === userId ? 'You' : handle(person)}
                    </Text>
                    {' checked in on '}
                    <Text style={typography.bodyStrong}>{habit.title}</Text>
                  </Text>

                  {checkIn.note ? (
                    <Text style={[typography.body, styles.note, { color: ink(colors, 70) }]}>
                      “{checkIn.note}”
                    </Text>
                  ) : null}

                  <Text style={[typography.caption, { color: ink(colors, 70) }]}>
                    {checkIn.local_date === toLocalDate() ? 'Today' : checkIn.local_date}
                    {group ? ` · ${group.name}` : ''}
                  </Text>

                  <ReactionBar
                    counts={summary.get(checkIn.id)}
                    onToggle={(emoji, on) => toggle.mutate({ checkInId: checkIn.id, emoji, on })}
                  />
                </View>
              </View>
            );
          })}
        </Plate>
      )}

      <Notice label="Shared only">
        {'Only check-ins on shared habits appear here. Private habits never do — not to your friends, and not to you in this list.'}
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: space.xxxl },
  close: {
    width: hit,
    height: hit,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row', gap: space.lg, paddingVertical: space.xl },
  text: { flex: 1, minWidth: 0, gap: space.xs },
  note: { fontStyle: 'italic' },
});
