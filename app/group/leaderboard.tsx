import { useMemo } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import { handle, initial } from '@/lib/identity';
import {
  checkInIndex,
  useCheckIns,
  useGroupMembers,
  useGroups,
  useHabits,
} from '@/lib/queries';
import {
  groupRate,
  groupStreak,
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
import { radius, typography } from '@/theme/tokens';

const MEMBER_COLORS = ['green', 'amber', 'blue', 'purple', 'teal', 'coral'] as const;
const localDate = (iso: string) => iso.slice(0, 10);

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const members = useGroupMembers(id);
  const habits = useHabits();
  const checkIns = useCheckIns();

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
  const streak = groupStreak(scored, roster, done, today);
  const perfect = perfectDays(scored, roster, done, week);

  const nameOf = (uid: string) => {
    const m = (members.data ?? []).find((x) => x.user_id === uid);
    return uid === userId ? `${handle(m?.profile)} (you)` : handle(m?.profile);
  };
  const colorFor = (uid: string) => {
    const index = roster.findIndex((m) => m.userId === uid);
    return colors[MEMBER_COLORS[(index < 0 ? 0 : index) % MEMBER_COLORS.length]];
  };

  if (groups.isLoading || members.isLoading || habits.isLoading || checkIns.isLoading) {
    return (
      <Screen title="Leaderboard">
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      </Screen>
    );
  }

  if (scored.length === 0) {
    return (
      <Screen title="Leaderboard" eyebrow={group?.name ?? ''}>
        <Notice label="Nothing to rank yet" tone="warn">
          {'This group has no shared habits. Add one and everyone starts being counted from the day it was created.'}
        </Notice>
      </Screen>
    );
  }

  const best = byHabit.find((h) => h.rate !== null);
  const worst = [...byHabit].reverse().find((h) => h.rate !== null);
  const struggling = worst && worst.rate !== null && worst.rate < 0.4 && worst !== best;

  return (
    <Screen title="Leaderboard" eyebrow={`${group?.name ?? 'Group'} · this week`}>
      {/* Collective first, deliberately: the top of the screen is something
          the group wins together before the part where they beat each other. */}
      <View style={styles.stats}>
        <Stat label="Group streak" value={String(streak)} tone={streak > 0 ? 'good' : undefined} />
        <Stat label="Perfect days" value={String(perfect)} />
        <Stat label="Group rate" value={percent(groupRate(rows))} />
      </View>

      <Card title="Consistency" action="7 days">
        {rows.map((row, i) => (
          <View
            key={row.userId}
            style={[
              styles.row,
              {
                borderBottomColor: colors.borderDefault,
                borderBottomWidth: i === rows.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text
              style={[
                typography.monoSmall,
                styles.rank,
                { color: i === 0 && row.rate !== null ? colors.green : colors.textMuted },
              ]}
            >
              {row.rate === null ? '–' : i + 1}
            </Text>

            <View style={[styles.avatar, { backgroundColor: colorFor(row.userId) }]}>
              <Text style={styles.initial}>
                {initial((members.data ?? []).find((m) => m.user_id === row.userId)?.profile)}
              </Text>
            </View>

            <View style={styles.main}>
              <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
                {nameOf(row.userId)}
              </Text>
              <View style={[styles.bar, { backgroundColor: colors.neutralChart }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.round((row.rate ?? 0) * 100)}%`,
                      backgroundColor: (row.rate ?? 0) < 0.5 ? colors.amber : colors.green,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.end}>
              <Text style={[typography.stat, styles.value, { color: colors.textPrimary }]}>
                {percent(row.rate)}
              </Text>
              <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
                {row.completed}/{row.expected}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {improved ? (
        <Card title="Most improved">
          <View style={styles.standout}>
            <Text style={[typography.rowName, { color: colors.textPrimary }]}>
              {nameOf(improved.userId)}
            </Text>
            <Pill label={`▲ ${Math.round(improved.delta * 100)}%`} tone="good" />
          </View>
          <Text style={[typography.body, styles.hint, { color: colors.textSecondary }]}>
            Against last week. The one way to win that is open to whoever is bottom.
          </Text>
        </Card>
      ) : null}

      <Card title="Habits" action="30 days">
        {byHabit.map((h, i) => (
          <View
            key={h.habit.id}
            style={[
              styles.row,
              {
                borderBottomColor: colors.borderDefault,
                borderBottomWidth: i === byHabit.length - 1 ? 0 : 1,
              },
            ]}
          >
            <View style={styles.main}>
              <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
                {h.habit.emoji ? `${h.habit.emoji}  ${h.habit.title}` : h.habit.title}
              </Text>
              <View style={[styles.bar, { backgroundColor: colors.neutralChart }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.round((h.rate ?? 0) * 100)}%`,
                      backgroundColor: (h.rate ?? 0) < 0.4 ? colors.amber : colors.green,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.end}>
              <Text style={[typography.stat, styles.value, { color: colors.textPrimary }]}>
                {percent(h.rate)}
              </Text>
              {h === best && h.rate !== null ? <Pill label="Strongest" tone="good" /> : null}
              {h === worst && struggling ? <Pill label="Needs work" tone="warn" /> : null}
            </View>
          </View>
        ))}
      </Card>

      {struggling ? (
        <Notice label="That habit, not those people" tone="warn">
          {`${worst!.habit.title} is at ${percent(worst!.rate)} across the whole group. A habit nobody manages is usually a badly-set target rather than a lazy group — try moving the time, lowering it, or dropping it.`}
        </Notice>
      ) : null}

      <Notice label="How this is counted">
        {'Consistency is what you completed divided by what was owed of you, so tracking more habits is not an advantage and joining late is not a penalty. Only shared habits count — private ones never reach this screen.'}
      </Notice>
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.stat, { color: tone === 'good' ? colors.green : colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 10, borderWidth: 1, borderRadius: radius.card, gap: 2 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rank: { width: 14, textAlign: 'right' },
  avatar: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'CascadiaCode-SemiBold', fontSize: 8, color: '#fff' },
  main: { flex: 1, minWidth: 0, gap: 5 },
  bar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  end: { alignItems: 'flex-end', gap: 3 },
  value: { fontSize: 13 },
  standout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  hint: { lineHeight: 17, marginTop: 6 },
});
