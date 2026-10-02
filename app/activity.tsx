import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Label } from '@/components/ui';
import { Notice } from '@/components/Notice';
import { ReactionBar } from '@/components/ReactionBar';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { RowsSkeleton } from '@/components/Skeleton';
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
import { addDays, formatShortDate, toLocalDate } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

const FEED_DAYS = 14;

export default function ActivityScreen() {
  const styles = useThemedStyles(makeStyles);
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
    () => Promise.all([habits.refetch(), checkIns.refetch(), groups.refetch(), reactions.refetch()]),
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
  const today = toLocalDate();

  return (
    <Screen
      onRefresh={onRefresh}
      title="Activity"
      label={feed.length ? `The last ${FEED_DAYS} days` : 'Your groups'}
      back={{}}
    >
      {loading ? (
        <RowsSkeleton />
      ) : feed.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          body={
            groups.data?.length
              ? 'Check in on a shared habit and it shows up here for the group.'
              : 'Join or start a group, add a shared habit, and check-ins appear here.'
          }
          actionLabel="Go to groups"
          onAction={() => router.push('/groups')}
        />
      ) : (
        <Section label="Recent" list>
          {feed.map(({ checkIn, habit }, i) => {
            const person = names.get(checkIn.user_id);
            const group = groups.data?.find((g) => g.id === habit.group_id);
            const who = checkIn.user_id === userId ? 'You' : handle(person);
            const when = checkIn.local_date === today ? 'Today' : formatShortDate(checkIn.local_date);
            return (
              <Row key={checkIn.id} last={i === feed.length - 1} style={styles.row}>
                <Avatar name={person?.display_name ?? 'Someone'} size={32} />
                <View style={styles.text}>
                  <Text style={styles.line}>
                    <Text style={styles.strong}>{who}</Text>
                    {' checked in on '}
                    <Text style={styles.strong}>{habit.title}</Text>
                  </Text>

                  {checkIn.note ? <Text style={styles.note}>“{checkIn.note}”</Text> : null}

                  <Label>
                    {when}
                    {group ? ` · ${group.name}` : ''}
                  </Label>

                  <ReactionBar
                    counts={summary.get(checkIn.id)}
                    onToggle={(emoji, on) => toggle.mutate({ checkInId: checkIn.id, emoji, on })}
                  />
                </View>
              </Row>
            );
          })}
        </Section>
      )}

      <Notice label="Shared only">
        {'Only check-ins on shared habits appear here. Private habits never do — not to your friends, and not to you in this list.'}
      </Notice>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { alignItems: 'flex-start', paddingVertical: space.lg },
    text: { flex: 1, minWidth: 0, gap: space.xs },
    line: { ...t.type.body, color: t.colors.ink },
    strong: { fontFamily: t.fonts.uiMedium },
    note: { ...t.type.italicTitle, color: t.colors.inkSoft },
  });
