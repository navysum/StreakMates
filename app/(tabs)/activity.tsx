import { useMemo } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { ReactionBar } from '@/components/ReactionBar';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import { handle, initial } from '@/lib/identity';
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
import { typography } from '@/theme/tokens';

const FEED_DAYS = 14;
const MEMBER_COLORS = ['green', 'amber', 'blue', 'purple', 'teal', 'coral'] as const;

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();

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
  const colorFor = (id: string) => {
    const index = [...names.keys()].sort().indexOf(id);
    return colors[MEMBER_COLORS[(index < 0 ? 0 : index) % MEMBER_COLORS.length]];
  };

  return (
    <Screen title="Activity" eyebrow={feed.length ? `Last ${FEED_DAYS} days` : 'Nothing yet'}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : feed.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <Text style={[typography.rowName, { color: colors.textPrimary }]}>Nothing yet</Text>
            <Text style={[typography.body, styles.body, { color: colors.textSecondary }]}>
              {groups.data?.length
                ? 'Check in on a shared habit and it shows up here for the group.'
                : 'Join or create a group, add a shared habit, and check-ins appear here.'}
            </Text>
            <Link href="/groups" style={[typography.rowName, { color: colors.green }]}>
              Go to groups
            </Link>
          </View>
        </Card>
      ) : (
        <Card title="Recent">
          {feed.map(({ checkIn, habit }, i) => {
            const person = names.get(checkIn.user_id);
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
                <View style={[styles.avatar, { backgroundColor: colorFor(checkIn.user_id) }]}>
                  <Text style={styles.initial}>{initial(person)}</Text>
                </View>

                <View style={styles.text}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>
                    <Text style={styles.strong}>
                      {checkIn.user_id === userId ? 'You' : handle(person)}
                    </Text>
                    {' checked in '}
                    <Text style={styles.strong}>
                      {habit.emoji ? `${habit.emoji} ${habit.title}` : habit.title}
                    </Text>
                  </Text>

                  {checkIn.note ? (
                    <Text style={[typography.body, styles.note, { color: colors.textSecondary }]}>
                      “{checkIn.note}”
                    </Text>
                  ) : null}

                  <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
                    {checkIn.local_date === toLocalDate() ? 'TODAY' : checkIn.local_date}
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
  body: { lineHeight: 18 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 11 },
  avatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'CascadiaCode-SemiBold', fontSize: 9, color: '#fff' },
  text: { flex: 1, minWidth: 0, gap: 2 },
  strong: { fontFamily: 'DMSans-SemiBold' },
  note: { fontStyle: 'italic' },
});
