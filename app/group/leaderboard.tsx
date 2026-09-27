import { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Bar } from '@/components/Bar';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StatTrio } from '@/components/StatTrio';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/auth/AuthProvider';
import { handle } from '@/lib/identity';
import { checkInIndex, useCheckIns, useGroupMembers, useGroups, useHabits } from '@/lib/queries';
import {
  groupRate,
  habitRates,
  mostImproved,
  percent,
  perfectDays,
  standings,
  windowDays,
  type ScoredHabit,
  type ScoredMember,
} from '@/lib/leaderboard';
import { toLocalDate } from '@/lib/date';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

const localDate = (iso: string) => iso.slice(0, 10);

export default function LeaderboardScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { userId } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const members = useGroupMembers(id);
  const habits = useHabits();
  const checkIns = useCheckIns();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () => Promise.all([groups.refetch(), members.refetch(), habits.refetch(), checkIns.refetch()]),
    [groups, members, habits, checkIns],
  );

  const group = groups.data?.find((g) => g.id === id);
  const today = toLocalDate();

  const scored: ScoredHabit[] = useMemo(
    () =>
      (habits.data ?? [])
        .filter((h) => h.group_id === id)
        .map((h) => ({
          id: h.id,
          title: h.title,
          emoji: h.emoji,
          cadence: h.cadence,
          targetDays: h.target_days,
          targetPerWeek: h.target_per_week,
          createdOn: localDate(h.created_at),
          archivedOn: h.archived_at ? localDate(h.archived_at) : null,
        })),
    [habits.data, id],
  );

  const roster: ScoredMember[] = useMemo(
    () =>
      (members.data ?? []).map((m) => ({
        userId: m.user_id,
        joinedOn: localDate(m.joined_at),
      })),
    [members.data],
  );

  const done = useMemo(() => checkInIndex(checkIns.data), [checkIns.data]);

  const week = windowDays(7, today);
  const previousWeek = windowDays(14, today).slice(7);

  const rows = standings(scored, roster, done, week);
  const before = standings(scored, roster, done, previousWeek);
  const improved = mostImproved(rows, before);
  const byHabit = habitRates(scored, roster, done, windowDays(30, today));
  const perfect = perfectDays(scored, roster, done, week);

  const nameOf = (uid: string) => {
    const m = (members.data ?? []).find((x) => x.user_id === uid);
    return uid === userId ? `${handle(m?.profile)} (you)` : handle(m?.profile);
  };
  // A monogram is drawn from the person's name, not their handle — "@alex"
  // gave "AL" where the rest of the app shows Alex Moore as "AM".
  const realName = (uid: string) =>
    (members.data ?? []).find((x) => x.user_id === uid)?.profile?.display_name ?? '?';

  const back = { label: 'Board' };

  if (groups.isLoading || members.isLoading || habits.isLoading || checkIns.isLoading) {
    return (
      <Screen title="Leaderboard" back={back}>
        <ActivityIndicator style={styles.loader} color={t.colors.inkMuted} />
      </Screen>
    );
  }

  if (scored.length === 0) {
    return (
      <Screen title="Leaderboard" label={group?.name ?? ''} back={back}>
        <Notice label="Nothing to rank yet">
          {'This group has no shared habits. Add one, and everyone is counted from the day it was made.'}
        </Notice>
      </Screen>
    );
  }

  const best = byHabit.find((h) => h.rate !== null);
  const worst = [...byHabit].reverse().find((h) => h.rate !== null);
  const struggling = worst && worst.rate !== null && worst.rate < 0.4 && worst !== best;

  // The best rate is the leader's own, off the same rows the list is drawn
  // from — the screen never carries a second copy of a number.
  const bestRate = rows.reduce<number | null>(
    (top, r) => (r.rate === null ? top : top === null ? r.rate : Math.max(top, r.rate)),
    null,
  );

  return (
    <Screen
      onRefresh={onRefresh}
      title="Leaderboard"
      label={`${group?.name ?? 'Group'} · this week`}
      back={back}
    >
      {/* Collective first, deliberately: the top of the screen is something
          the group wins together before the part where they beat each other. */}
      <StatTrio
        stats={[
          { value: percent(groupRate(rows)), label: 'the whole group', accent: true },
          { value: String(perfect), label: perfect === 1 ? 'perfect day' : 'perfect days' },
          { value: percent(bestRate), label: 'best of anyone' },
        ]}
      />

      <Section label="Consistency" action="This week" list>
        {rows.map((row, i) => {
          const you = row.userId === userId;
          const name = nameOf(row.userId);
          return (
            <Row
              key={row.userId}
              last={i === rows.length - 1}
              accessibilityLabel={
                row.rate === null
                  ? `${name}, nothing owed yet`
                  : `${i + 1}, ${name}, ${percent(row.rate)}`
              }
            >
              <Text style={[styles.rank, i === 0 && row.rate !== null && styles.leader]}>
                {row.rate === null ? '––' : String(i + 1).padStart(2, '0')}
              </Text>
              <Avatar name={realName(row.userId)} size={28} />
              <View style={styles.main}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={[styles.name, you && styles.you]}>
                    {name}
                  </Text>
                  <Text style={styles.figure}>{percent(row.rate)}</Text>
                </View>
                {/* Your own bar carries the accent; everyone else's is ink. */}
                <Bar
                  value={Math.round((row.rate ?? 0) * 100)}
                  max={100}
                  tone={you ? undefined : t.colors.inkSoft}
                />
              </View>
            </Row>
          );
        })}
      </Section>

      {improved ? (
        <Section label="Most improved">
          <Text numberOfLines={1} style={styles.standout}>
            {nameOf(improved.userId)}
          </Text>
          <Text style={styles.note}>
            Up {Math.round(improved.delta * 100)} points on last week. The one way to win that is
            open to whoever is at the bottom.
          </Text>
        </Section>
      ) : null}

      <Section label="Habits" action="30 days" list>
        {byHabit.map((h, i) => (
          <Row
            key={h.habit.id}
            last={i === byHabit.length - 1}
            accessibilityLabel={`${h.habit.title}, ${percent(h.rate)}${
              h === best && h.rate !== null ? ', the strongest' : h === worst && struggling ? ', needs work' : ''
            }`}
          >
            <View style={styles.main}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {h.habit.title}
                </Text>
                <Text style={styles.figure}>{percent(h.rate)}</Text>
              </View>
              {/* Ink, stepping back to the muted ink for a struggling habit:
                  it fades, it does not turn red. */}
              <Bar
                value={Math.round((h.rate ?? 0) * 100)}
                max={100}
                tone={(h.rate ?? 0) < 0.4 ? t.colors.inkMuted : t.colors.inkSoft}
              />
              {h === best && h.rate !== null ? (
                <Tag label="Strongest" />
              ) : h === worst && struggling ? (
                <Tag label="Needs work" />
              ) : null}
            </View>
          </Row>
        ))}
      </Section>

      {struggling ? (
        <Notice label="That habit, not those people">
          {`${worst!.habit.title} is at ${percent(worst!.rate)} across the whole group. A habit nobody manages is usually a target set wrong rather than a group trying too little — try moving the time, lowering it, or letting it go.`}
        </Notice>
      ) : null}

      <Notice label="How this is counted">
        {'Consistency is what you did divided by what was owed of you, so tracking more habits is not an advantage and joining late is not a penalty. Only shared habits count — private ones never reach this screen.'}
      </Notice>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    loader: { marginTop: space.xl },
    rank: { ...t.type.figureSmall, color: t.colors.inkMuted, width: 28 },
    leader: { color: t.colors.ink },
    main: { flex: 1, minWidth: 0, gap: space.sm },
    nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
    name: { ...t.type.body, color: t.colors.ink, flex: 1, minWidth: 0 },
    you: { fontFamily: t.fonts.uiMedium },
    figure: { ...t.type.figureSmall, color: t.colors.ink },
    standout: { ...t.type.heading, color: t.colors.ink },
    note: { ...t.type.italic, color: t.colors.inkMuted, marginTop: space.sm },
  });
