import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Bar } from '@/components/Bar';
import { Notice } from '@/components/Notice';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
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
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, typography } from '@/theme/tokens';

const localDate = (iso: string) => iso.slice(0, 10);

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const members = useGroupMembers(id);
  const habits = useHabits();
  const checkIns = useCheckIns();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () =>
      Promise.all([
        groups.refetch(),
        members.refetch(),
        habits.refetch(),
        checkIns.refetch(),
      ]),
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

  const back = { label: 'Board', onPress: () => router.back() };

  if (groups.isLoading || members.isLoading || habits.isLoading || checkIns.isLoading) {
    return (
      <Screen title="Leaderboard" back={back}>
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
      </Screen>
    );
  }

  if (scored.length === 0) {
    return (
      <Screen title="Leaderboard" label={group?.name ?? ''} back={back}>
        <Notice label="Nothing to rank yet">
          {'This group has no shared habits. Add one and everyone starts being counted from the day it was created.'}
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
        labelFirst
        stats={[
          { value: percent(groupRate(rows)), label: 'Group rate', accent: true },
          { value: String(perfect), label: 'Perfect days' },
          { value: percent(bestRate), label: 'Best rate' },
        ]}
      />

      <Plate label="Consistency" action="This week" flush>
        {rows.map((row, i) => {
          const you = row.userId === userId;
          return (
            <View
              key={row.userId}
              style={[
                styles.row,
                you && { backgroundColor: colors.meaningSoft.action },
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.rank,
                  typography.figureSmall,
                  {
                    color:
                      i === 0 && row.rate !== null ? colors.meaning.celebrate : ink(colors, 62),
                  },
                ]}
              >
                {row.rate === null ? '––' : String(i + 1).padStart(2, '0')}
              </Text>

              <Avatar name={nameOf(row.userId)} size={28} />

              <View style={styles.main}>
                <View style={styles.nameRow}>
                  <Text
                    numberOfLines={1}
                    style={[typography.body, styles.name, { color: colors.text }]}
                  >
                    {nameOf(row.userId)}
                  </Text>
                  <Text style={[typography.figureSmall, { color: colors.text }]}>
                    {percent(row.rate)}
                  </Text>
                </View>
                <Bar
                  value={Math.round((row.rate ?? 0) * 100)}
                  max={100}
                  height={6}
                  tone={you ? colors.meaning.action : colors.meaning.progress}
                />
              </View>
            </View>
          );
        })}
      </Plate>

      {improved ? (
        <Plate label="Most improved" feature>
          <View style={styles.standout}>
            <Text numberOfLines={1} style={[typography.cardTitle, styles.name, { color: colors.text }]}>
              {nameOf(improved.userId)}
            </Text>
            <Tag label={`▲ ${Math.round(improved.delta * 100)}%`} />
          </View>
          <Text style={[typography.prose, styles.hint, { color: ink(colors, 78) }]}>
            Against last week. The one way to win that is open to whoever is bottom.
          </Text>
        </Plate>
      ) : null}

      <Plate label="Habits" action="30 days" flush>
        {byHabit.map((h, i) => (
          <View
            key={h.habit.id}
            style={[
              styles.row,
              {
                borderBottomColor: colors.divider,
                borderBottomWidth: i === byHabit.length - 1 ? 0 : 1,
              },
            ]}
          >
            <View style={styles.main}>
              <View style={styles.nameRow}>
                <Text
                  numberOfLines={1}
                  style={[typography.body, styles.name, { color: colors.text }]}
                >
                  {h.habit.title}
                </Text>
                <Text style={[typography.figureSmall, { color: colors.text }]}>
                  {percent(h.rate)}
                </Text>
              </View>
              <Bar
                value={Math.round((h.rate ?? 0) * 100)}
                max={100}
                height={6}
                // Tone by ramp step, not by hue: a struggling habit steps back
                // down the accent, it does not turn red.
                tone={(h.rate ?? 0) < 0.4 ? colors.accents[400] : colors.meaning.progress}
              />
              {h === best && h.rate !== null ? (
                <View style={styles.tag}>
                  <Tag label="Strongest" />
                </View>
              ) : h === worst && struggling ? (
                <View style={styles.tag}>
                  <Tag label="Needs work" variant="outline" />
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </Plate>

      {struggling ? (
        <Notice label="That habit, not those people">
          {`${worst!.habit.title} is at ${percent(worst!.rate)} across the whole group. A habit nobody manages is usually a badly-set target rather than a lazy group — try moving the time, lowering it, or dropping it.`}
        </Notice>
      ) : null}

      <Notice label="How this is counted">
        {'Consistency is what you completed divided by what was owed of you, so tracking more habits is not an advantage and joining late is not a penalty. Only shared habits count — private ones never reach this screen.'}
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
  },
  rank: { width: 22 },
  main: { flex: 1, minWidth: 0, gap: space.sm },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  name: { flex: 1, minWidth: 0 },
  tag: { flexDirection: 'row', marginTop: space.xs },
  standout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  hint: { marginTop: space.md },
});
