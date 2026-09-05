import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
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
import { radius, typography } from '@/theme/tokens';

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
      title="Activity"
      eyebrow={feed.length ? `Last ${FEED_DAYS} days` : 'Nothing yet'}
      trailing={
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [
            styles.close,
            { backgroundColor: pressed ? colors.bgHover : colors.bgSurfaceMuted },
          ]}
        >
          <Text style={[styles.closeGlyph, { color: colors.textSecondary }]}>✕</Text>
        </Pressable>
      }
    >
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : feed.length === 0 ? (
        <EmptyState
          icon="📣"
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
        <Card title="Recent" flush>
          {feed.map(({ checkIn, habit }, i) => {
            const person = names.get(checkIn.user_id);
            const group = groups.data?.find((g) => g.id === habit.group_id);
            return (
              <View
                key={checkIn.id}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.borderDefault,
                    borderBottomWidth: i === feed.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <Avatar
                  id={checkIn.user_id}
                  name={person?.display_name ?? 'Someone'}
                  size={32}
                />

                <View style={styles.text}>
                  <View style={styles.line}>
                    <Text style={[typography.body, styles.grow, { color: colors.textPrimary }]}>
                      <Text style={styles.strong}>
                        {checkIn.user_id === userId ? 'You' : handle(person)}
                      </Text>
                      {' checked in on '}
                      <Text style={styles.strong}>{habit.title}</Text>
                    </Text>
                    {habit.emoji ? (
                      <View style={[styles.tile, { backgroundColor: colors.bgSurfaceMuted }]}>
                        <Text style={styles.glyph}>{habit.emoji}</Text>
                      </View>
                    ) : null}
                  </View>

                  {checkIn.note ? (
                    <Text style={[typography.body, styles.note, { color: colors.textSecondary }]}>
                      “{checkIn.note}”
                    </Text>
                  ) : null}

                  <Text style={[typography.caption, { color: colors.textMuted }]}>
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
        </Card>
      )}

      <Notice label="Shared only">
        {'Only check-ins on shared habits appear here. Private habits never do — not to your friends, and not to you in this list.'}
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 24 },
  empty: { gap: 7, paddingVertical: 4, alignItems: 'flex-start' },
  body: {},
  close: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: { fontSize: 16, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  text: { flex: 1, minWidth: 0, gap: 4 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  tile: {
    width: 32,
    height: 32,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 16, lineHeight: 20 },
  strong: { fontFamily: 'DMSans-SemiBold' },
  note: { fontStyle: 'italic' },
});
