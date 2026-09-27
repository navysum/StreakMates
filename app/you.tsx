import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui';
import { Choice } from '@/components/Choice';
import { FieldRow, FieldValue } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RampGrid } from '@/components/RampGrid';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { StatTrio } from '@/components/StatTrio';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/auth/AuthProvider';
import { confirm } from '@/lib/confirm';
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
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { useThemeChoice } from '@/theme/ThemeChoice';
import { FAMILIES, MODES, space, type Theme, type ThemeFamily, type ThemeMode } from '@/theme';

/**
 * You: who you are to the group, your record, and the app's settings.
 *
 * This was the fourth tab. NavySum apps keep to three, so it opens from your
 * monogram in the corner of each tab and leaves with "‹ Back".
 */
export default function YouScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { family, mode, setFamily, setMode } = useThemeChoice();
  const { userId, session, signOut } = useAuth();
  const profile = useProfile(userId);
  const router = useRouter();
  const habits = useHabits(true);
  const groups = useGroups();
  const remove = useDeleteAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIns = useCheckIns();

  // Pull to refresh. Every query the screen actually shows, refetched
  // together — refreshing one and leaving the rest is how a screen ends up
  // showing two different moments at once.
  const onRefresh = useCallback(
    () => Promise.all([profile.refetch(), habits.refetch(), groups.refetch(), checkIns.refetch()]),
    [profile, habits, groups, checkIns],
  );
  const today = toLocalDate();

  const joined = useMemo(() => {
    const first = (habits.data ?? []).map((h) => h.created_at).sort()[0];
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
    // grid reads MAY … JUL … SEP rather than eighteen repeats. A label is
    // wider than its column, so two month names a column or two apart ran
    // together as "MAYJUN"; the earlier, partial month gives way.
    const months: string[] = weeks.map(() => '');
    let lastName = '';
    let lastAt = -1;
    weeks.forEach((column, i) => {
      const first = column[0];
      if (!first) return;
      const name = monthLabel(first.date);
      if (name === lastName) return;
      lastName = name;
      if (lastAt >= 0 && i - lastAt < 3) months[lastAt] = '';
      months[i] = name;
      lastAt = i;
    });

    return { weeks, counts, months };
  }, [checkIns.data, userId, today]);

  async function confirmDelete() {
    const owned = (groups.data ?? []).length;
    const count = (habits.data ?? []).length;
    const yes = await confirm({
      title: 'Delete your account?',
      message:
        `This removes your profile, your ${count} habit${count === 1 ? '' : 's'} and every check-in you have made. ` +
        (owned > 0
          ? 'Shared habits you created are handed to another member so their history survives, and groups you own pass to the longest-standing member. '
          : '') +
        'It cannot be undone.',
      confirmLabel: 'Delete everything',
      destructive: true,
    });
    if (!yes) return;

    try {
      await remove.mutateAsync();
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your account could not be deleted.');
    }
  }

  const name = profile.data?.display_name ?? 'You';
  const resolved = t.dark ? 'dark' : 'light';

  return (
    <Screen
      onRefresh={onRefresh}
      title={name}
      label="You"
      back={{}}
      onMenu={() => setMenuOpen(true)}
      menuLabel="Options"
      trailing={<Avatar name={name} size={56} />}
    >
      <Text style={styles.who}>
        {handle(profile.data)}
        {joined ? ` · here since ${joined}` : ''}
      </Text>

      <StatTrio
        stats={[
          { value: String(totals.streak), label: 'days in a row now', accent: totals.streak > 0 },
          { value: String(totals.best), label: 'your longest run' },
          {
            value: totals.rate === null ? '—' : `${totals.rate}%`,
            label: 'kept, last 30 days',
          },
        ]}
      />

      <Section label="Last 18 weeks" action={`${totals.checkIns} check-ins`}>
        <RampGrid weeks={heat.weeks} counts={heat.counts} />
        <View style={styles.months} importantForAccessibility="no-hide-descendants">
          {heat.months.map((m, i) => (
            <Text key={`${m}-${i}`} style={styles.month}>
              {m}
            </Text>
          ))}
        </View>
        <Text style={styles.note}>A day you kept five habits reads darker than a day you kept one.</Text>
      </Section>

      {topStreaks.length > 0 ? (
        <Section label="Longest runs" list>
          {topStreaks.map((row, i) => (
            <Row
              key={row.habit.id}
              last={i === topStreaks.length - 1}
              accessibilityLabel={`${row.habit.title}, ${row.best} days`}
            >
              <Text numberOfLines={1} style={styles.habit}>
                {row.habit.title}
              </Text>
              <Text style={styles.figure}>{row.best}</Text>
              <Tag label="days" />
            </Row>
          ))}
        </Section>
      ) : null}

      <Section label="Theme" list>
        <Choice<ThemeFamily>
          value={family}
          onChange={setFamily}
          options={FAMILIES.map((f) => ({ value: f.id, label: f.name, hint: f.description }))}
        />
      </Section>

      <Section label="Light or dark">
        <Segmented<ThemeMode>
          accessibilityLabel="Light or dark"
          value={mode}
          onChange={setMode}
          options={MODES.map((m) => ({ value: m.id, label: m.name }))}
        />
        <Text style={styles.note}>
          {mode === 'system' ? `Following your phone, which is ${resolved} right now.` : `Always ${mode}.`}
        </Text>
      </Section>

      <Section label="Account" list>
        <FieldRow
          label="Username"
          onPress={() => router.push('/username')}
          accessibilityLabel={`Username, ${profile.data?.username ? `@${profile.data.username}` : 'not set'}. Change it`}
        >
          <FieldValue>{profile.data?.username ? `@${profile.data.username}` : 'Not set'}</FieldValue>
          <Text style={styles.change}>Change</Text>
        </FieldRow>
        <FieldRow label="Name">
          <FieldValue>{profile.data?.display_name ?? '—'}</FieldValue>
        </FieldRow>
        <FieldRow label="Email">
          <FieldValue>{session?.user.email ?? '—'}</FieldValue>
        </FieldRow>
        <FieldRow label="Timezone" last>
          <FieldValue>{profile.data?.timezone ?? '—'}</FieldValue>
        </FieldRow>
      </Section>

      <Button title="Sign out" variant="outline" onPress={() => signOut()} />

      {error ? <Notice label="Could not delete">{error}</Notice> : null}

      <Sheet
        visible={menuOpen}
        title="Account"
        onClose={() => setMenuOpen(false)}
        actions={[
          { label: 'Sign out', hint: 'Your habits and history stay', onPress: () => signOut() },
          {
            label: 'Delete account',
            tone: 'danger' as const,
            hint: 'Removes everything, for good',
            onPress: () => void confirmDelete(),
          },
        ]}
      />
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    who: { ...t.type.italic, color: t.colors.inkMuted, marginTop: -space.md },
    months: { flexDirection: 'row', marginTop: space.sm },
    month: { ...t.type.label, letterSpacing: 0, flex: 1 },
    note: { ...t.type.italic, color: t.colors.inkMuted, marginTop: space.sm },
    habit: { ...t.type.row, color: t.colors.ink, flex: 1, minWidth: 0 },
    figure: { ...t.type.figureSmall, color: t.colors.ink },
    change: { ...t.type.button, color: t.colors.seal },
  });
