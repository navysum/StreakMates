import { useMemo, useState } from 'react';
import { Alert, Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { RampGrid } from '@/components/RampGrid';
import { StatTrio } from '@/components/StatTrio';
import { Plate } from '@/components/Plate';
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
import { addDays, fromLocalDate, monthLabel, toLocalDate } from '@/lib/date';
import { bestStreak, computeStreak, isScheduled } from '@/lib/streak';
import { gridCells } from '@/lib/week';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { FieldRow } from '@/components/Field';
import { ink, space, typography } from '@/theme/tokens';

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
    // One label per column, printed only where the month turns over, so the
    // grid reads MAY … JUL … SEP rather than eighteen repeats.
    let last = '';
    const months = weeks.map((column) => {
      const first = column[0];
      if (!first) return '';
      const name = monthLabel(first.date);
      if (name === last) return '';
      last = name;
      return name;
    });

    return { weeks, counts, months };
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
      label="Profile"
      onMenu={() => setMenuOpen(true)}
      menuLabel="Account options"
    >
      <View style={styles.profile}>
        <Avatar name={profile.data?.display_name ?? '?'} size={56} />
        <View style={styles.who}>
          <Text numberOfLines={1} style={[typography.sectionTitle, { color: colors.text }]}>
            {profile.data?.display_name ?? 'You'}
          </Text>
          <Text style={[typography.caption, { color: ink(colors, 70) }]}>
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

      <Plate marks>
        <View style={styles.plateHead}>
          <Text style={[typography.label, { color: ink(colors, 65) }]}>Last 18 weeks</Text>
          <Text style={[typography.label, { color: ink(colors, 65) }]}>
            {totals.checkIns} check-ins
          </Text>
        </View>
        <View style={styles.grid}>
          <RampGrid weeks={heat.weeks} counts={heat.counts} />
        </View>
        <View style={styles.months}>
          {heat.months.map((m, i) => (
            <Text
              key={`${m}-${i}`}
              style={[typography.labelSmall, styles.month, { color: ink(colors, 62) }]}
            >
              {m}
            </Text>
          ))}
        </View>
        <Text style={[typography.caption, styles.footnote, { color: ink(colors, 65) }]}>
          A day you kept five habits reads darker than a day you kept one.
        </Text>
      </Plate>

      {topStreaks.length > 0 ? (
        <Plate label="Longest streaks" flush>
          {topStreaks.map((row, i) => (
            <View
              key={row.habit.id}
              style={[
                styles.streak,
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: i === topStreaks.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[typography.body, styles.name, { color: colors.text }]}
              >
                {row.habit.title}
              </Text>
              <Text style={[typography.statSmall, { color: colors.text }]}>{row.best}</Text>
              <Text style={[typography.labelSmall, { color: ink(colors, 62) }]}>Days</Text>
            </View>
          ))}
        </Plate>
      ) : null}

      <Plate label="Appearance">
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
          <Text style={[typography.caption, { color: ink(colors, 70) }]}>
            {mode === 'system'
              ? `Following your device · currently ${scheme}`
              : `Always ${mode}`}
          </Text>
        </View>
      </Plate>

      <Plate label="Account">
        <Pressable
          onPress={() => router.push('/username')}
          accessibilityRole="button"
          accessibilityLabel="Change your username"
        >
          <FieldRow label="Username">
            <Text numberOfLines={1} style={[typography.body, { color: colors.text }]}>
              {profile.data?.username ? `@${profile.data.username}` : 'Not set'}
            </Text>
            <Text style={[typography.label, { color: colors.accent }]}>Change</Text>
          </FieldRow>
        </Pressable>
        <Row label="Name" value={profile.data?.display_name ?? '—'} />
        <Row label="Email" value={session?.user.email ?? '—'} />
        <Row label="Timezone" value={profile.data?.timezone ?? '—'} last />
      </Plate>

      <Button label="Sign out" onPress={() => signOut()} />

      {error ? <Notice label="Could not delete">{error}</Notice> : null}

      <Sheet
        visible={menuOpen}
        title="Account options"
        onClose={() => setMenuOpen(false)}
        actions={[
          { label: 'Sign out', hint: 'Your data stays', onPress: () => signOut() },
          {
            label: 'Delete account',
            tone: 'danger' as const,
            hint: 'Permanent',
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
    <FieldRow label={label} last={last}>
      <Text numberOfLines={1} style={[typography.body, styles.value, { color: colors.text }]}>
        {value}
      </Text>
    </FieldRow>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  who: { flex: 1, minWidth: 0, gap: space.xs },
  plateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  grid: { marginTop: space.lg },
  months: { flexDirection: 'row', marginTop: space.sm },
  month: { flex: 1 },
  footnote: { marginTop: space.lg },
  streak: { minHeight: 56, flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  name: { flex: 1, minWidth: 0 },
  stack: { gap: space.lg },
  value: { flexShrink: 1, textAlign: 'right' },
});
