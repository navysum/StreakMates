import { useMemo, useState } from 'react';
import { Alert, Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { RampGrid } from '@/components/RampGrid';
import { StatTrio } from '@/components/StatTrio';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/auth/AuthProvider';
import { handle } from '@/lib/identity';
import {
  byHabit,
  useCheckIns,
  useDeleteAccount,
  useGroups,
  useHabits,
  useProfile,
} from '@/lib/queries';
import { addDays, fromLocalDate, toLocalDate } from '@/lib/date';
import { bestStreak, computeStreak, isScheduled } from '@/lib/streak';
import { gridCells } from '@/lib/week';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { radius, space, typography } from '@/theme/tokens';

export default function YouScreen() {
  const { colors, mode, setMode, scheme } = useTheme();
  const { userId, session, signOut } = useAuth();
  const profile = useProfile(userId);
  const router = useRouter();
  const habits = useHabits(true);
  const groups = useGroups();
  const remove = useDeleteAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIns = useCheckIns();
  const today = toLocalDate();

  const joined = useMemo(() => {
    const first = (habits.data ?? [])
      .map((h) => h.created_at)
      .sort()[0];
    return first
      ? fromLocalDate(first.slice(0, 10)).toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric',
        })
      : null;
  }, [habits.data]);

  // Streaks and rate are computed per habit and then taken across them, so a
  // rest day on one habit does not read as a broken streak overall.
  const perHabit = useMemo(() => {
    const done = byHabit(checkIns.data, userId);
    return (habits.data ?? [])
      .filter((h) => !h.archived_at)
      .map((habit) => {
        const dates = done.get(habit.id) ?? new Set<string>();
        const schedule = {
          cadence: habit.cadence,
          targetDays: habit.target_days,
          targetPerWeek: habit.target_per_week,
        };
        return {
          habit,
          dates,
          schedule,
          streak: computeStreak(schedule, dates, today),
          best: bestStreak(schedule, dates, today),
        };
      });
  }, [habits.data, checkIns.data, userId, today]);

  const totals = useMemo(() => {
    const window = Array.from({ length: 30 }, (_, i) => addDays(today, -(29 - i)));
    let owed = 0;
    let hit = 0;
    for (const row of perHabit) {
      for (const day of window) {
        if (day < row.habit.created_at.slice(0, 10)) continue;
        if (!isScheduled(row.schedule, day)) continue;
        owed++;
        if (row.dates.has(day)) hit++;
      }
    }
    return {
      streak: perHabit.reduce((n, r) => Math.max(n, r.streak), 0),
      best: perHabit.reduce((n, r) => Math.max(n, r.best), 0),
      rate: owed === 0 ? null : Math.round((hit / owed) * 100),
      checkIns: (checkIns.data ?? []).filter((c) => c.user_id === userId).length,
    };
  }, [perHabit, checkIns.data, userId, today]);

  const topStreaks = useMemo(
    () => [...perHabit].filter((r) => r.best > 0).sort((a, b) => b.best - a.best).slice(0, 4),
    [perHabit],
  );

  // Every day you did anything, so the grid reads as one picture of the season
  // rather than one habit's.
  const heat = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of checkIns.data ?? []) {
      if (c.user_id !== userId) continue;
      counts.set(c.local_date, (counts.get(c.local_date) ?? 0) + 1);
    }
    const weeks = gridCells(
      18,
      new Set(counts.keys()),
      { cadence: 'daily', targetDays: [], targetPerWeek: 7 },
      today,
    );
    return { weeks, counts };
  }, [checkIns.data, userId, today]);

  function confirmDelete() {
    const owned = (groups.data ?? []).length;
    const count = (habits.data ?? []).length;
    Alert.alert(
      'Delete your account?',
      `This removes your profile, your ${count} habit${count === 1 ? '' : 's'} and every check-in you have made. ` +
        (owned > 0
          ? 'Shared habits you created are handed to another member so their history survives, and groups you own pass to the longest-standing member. '
          : '') +
        'It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync();
              await signOut();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not delete the account.');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen
      title="You"
      eyebrow="Profile"
      onMenu={() => setMenuOpen(true)}
      menuLabel="Account options"
    >
      <View style={styles.profile}>
        <Avatar id={userId ?? 'me'} name={profile.data?.display_name ?? '?'} size={56} />
        <View style={styles.who}>
          <Text numberOfLines={1} style={[typography.sectionTitle, { color: colors.textPrimary }]}>
            {profile.data?.display_name ?? 'You'}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {handle(profile.data)}
            {joined ? ` · joined ${joined}` : ''}
          </Text>
        </View>
      </View>

      <StatTrio
        stats={[
          { value: String(totals.streak), label: 'Current streak' },
          { value: String(totals.best), label: 'Best streak' },
          { value: totals.rate === null ? '—' : `${totals.rate}%`, label: '30-day rate' },
        ]}
      />

      <Card title="Last 18 weeks" action={`${totals.checkIns} check-ins`}>
        <RampGrid weeks={heat.weeks} counts={heat.counts} />
      </Card>

      {topStreaks.length > 0 ? (
        <Card title="Longest streaks" flush>
          {topStreaks.map((row, i) => (
            <View
              key={row.habit.id}
              style={[
                styles.streak,
                {
                  borderBottomColor: colors.borderDefault,
                  borderBottomWidth: i === topStreaks.length - 1 ? 0 : 1,
                },
              ]}
            >
              <View style={[styles.tile, { backgroundColor: colors.bgSurfaceMuted }]}>
                <Text style={styles.glyph}>{row.habit.emoji ?? '•'}</Text>
              </View>
              <Text
                numberOfLines={1}
                style={[typography.rowName, styles.name, { color: colors.textPrimary }]}
              >
                {row.habit.title}
              </Text>
              <Text style={[typography.stat, { color: colors.textPrimary }]}>{row.best}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>days</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card title="Appearance">
        <View style={styles.stack}>
          <Segmented<ThemeMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
            {mode === 'system'
              ? `FOLLOWING YOUR DEVICE · CURRENTLY ${scheme.toUpperCase()}`
              : `ALWAYS ${mode.toUpperCase()}`}
          </Text>
        </View>
      </Card>

      <Card title="Account">
        <Pressable
          onPress={() => router.push('/username')}
          accessibilityRole="button"
          accessibilityLabel="Change your username"
        >
          <View
            style={[styles.row, { borderBottomColor: colors.borderDefault, borderBottomWidth: 1 }]}
          >
            <Text style={[typography.label, { color: colors.textMuted }]}>Username</Text>
            <View style={styles.editable}>
              <Text style={[typography.rowName, { color: colors.textPrimary }]}>
                {profile.data?.username ? `@${profile.data.username}` : 'Not set'}
              </Text>
              <Text style={[typography.tabLabel, { color: colors.green }]}>Change</Text>
            </View>
          </View>
        </Pressable>
        <Row label="Name" value={profile.data?.display_name ?? '—'} />
        <Row label="Email" value={session?.user.email ?? '—'} />
        <Row label="Timezone" value={profile.data?.timezone ?? '—'} last />
      </Card>

      <Button label="Sign out" onPress={() => signOut()} />

      {error ? <Notice label="Could not delete" tone="bad">{error}</Notice> : null}

      <Sheet
        visible={menuOpen}
        title="Account options"
        onClose={() => setMenuOpen(false)}
        actions={[
          { label: 'Sign out', hint: 'YOUR DATA STAYS', onPress: () => signOut() },
          {
            label: 'Delete account',
            tone: 'danger' as const,
            hint: 'PERMANENT',
            onPress: confirmDelete,
          },
        ]}
      />
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text numberOfLines={1} style={[typography.rowName, styles.value, { color: colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  who: { flex: 1, minWidth: 0, gap: 2 },
  streak: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md },
  tile: {
    width: 36,
    height: 36,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 18, lineHeight: 22 },
  name: { flex: 1, minWidth: 0 },
  stack: { gap: space.md },
  editable: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  row: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
