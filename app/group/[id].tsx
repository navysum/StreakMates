import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Avatar } from '@/components/Avatar';
import { Board } from '@/components/Board';
import { Button } from '@/components/ui';
import { HabitRow } from '@/components/HabitRow';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/auth/AuthProvider';
import { sortHabits } from '@/lib/ordering';
import {
  checkInIndex,
  useCheckIns,
  useHabitOrder,
  useGroupMembers,
  useGroups,
  useHabits,
  useLeaveGroup,
  useRotateInviteCode,
  useSetArchived,
  useToggleCheckIn,
  doneKey,
} from '@/lib/queries';
import type { Habit } from '@/lib/types';
import { toLocalDate } from '@/lib/date';
import { aggregateCells } from '@/lib/week';
import { confirm } from '@/lib/confirm';
import { feel } from '@/lib/feel';
import { handle } from '@/lib/identity';
import { shareText } from '@/lib/share';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

export default function GroupScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const members = useGroupMembers(id);
  const habits = useHabits();
  const checkIns = useCheckIns();
  const order = useHabitOrder(userId);
  const setArchived = useSetArchived();

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
        order.refetch(),
      ]),
    [groups, members, habits, checkIns, order],
  );
  const leave = useLeaveGroup(userId);
  const rotate = useRotateInviteCode();
  const toggle = useToggleCheckIn(userId);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // The shared habit whose contextual actions are open. Kept separate from
  // menuOpen: two sheets, never both at once.
  const [habitMenu, setHabitMenu] = useState<Habit | null>(null);

  const today = toLocalDate();
  const group = useMemo(() => groups.data?.find((g) => g.id === id), [groups.data, id]);
  const list = members.data ?? [];
  const isOwner = list.some((m) => m.user_id === userId && m.role === 'owner');

  const groupHabits = useMemo(
    () => sortHabits((habits.data ?? []).filter((h) => h.group_id === id), order.data ?? new Map()),
    [habits.data, id, order.data],
  );
  const done = useMemo(() => checkInIndex(checkIns.data), [checkIns.data]);

  // This week, aggregated the same way the board draws it: a member-day counts
  // only when everything owed that day was kept.
  const { weekDone, weekOwed, top3 } = useMemo(() => {
    const schedules = groupHabits.map((h) => ({
      id: h.id,
      schedule: {
        cadence: h.cadence,
        targetDays: h.target_days,
        targetPerWeek: h.target_per_week,
      },
      startsOn: h.created_at.slice(0, 10),
    }));
    const rows = list.map((member) => {
      const cells = aggregateCells(
        today,
        schedules,
        (habitId, day) => done.has(doneKey(habitId, member.user_id, day)),
        today,
        member.joined_at.slice(0, 10),
      );
      return {
        member,
        kept: cells.filter((c) => c.state === 'done').length,
        owed: cells.filter((c) => c.state !== 'off').length,
      };
    });
    return {
      weekDone: rows.reduce((n, r) => n + r.kept, 0),
      weekOwed: rows.reduce((n, r) => n + r.owed, 0),
      // Ranked on rate, not raw days, so somebody who joined mid-week is not
      // punished for the days they were never owed.
      top3: [...rows]
        .map((r) => ({ ...r, rate: r.owed > 0 ? r.kept / r.owed : 0 }))
        .sort((a, b) => b.rate - a.rate || b.kept - a.kept)
        .slice(0, 3),
    };
  }, [groupHabits, list, done, today]);

  const back = { label: 'Groups', onPress: () => router.replace('/groups') };

  if (groups.isLoading || members.isLoading) {
    return (
      <Screen title="Group" back={back}>
        <ActivityIndicator style={styles.loader} color={t.colors.inkMuted} />
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen title="Group" label="Not found" back={back}>
        <Notice label="Gone">{'This group no longer exists, or you are not in it any more.'}</Notice>
        <Button title="Back to groups" variant="outline" onPress={() => router.replace('/groups')} />
      </Screen>
    );
  }

  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function copyCode() {
    await Clipboard.setStringAsync(group!.invite_code);
    flashCopied();
  }

  async function shareCode() {
    const shared = await shareText(
      `Join ${group!.name} on StreakMates — the code is ${group!.invite_code}`,
    );
    // Desktop browsers have no share sheet. Falling back to the clipboard is
    // the same outcome by a different route, so it says so rather than failing.
    if (shared === 'copied') flashCopied();
  }

  async function confirmLeave() {
    const yes = await confirm({
      title: `Leave ${group!.name}?`,
      message: isOwner
        ? 'You own it. Leaving does not delete the group, but nobody will be able to change its code afterwards.'
        : 'You can rejoin later with the code.',
      confirmLabel: 'Leave',
      destructive: true,
    });
    if (!yes) return;

    leave.mutate(group!.id, {
      onSuccess: () => router.replace('/groups'),
      onError: (e) => setError(e instanceof Error ? e.message : 'You could not leave the group.'),
    });
  }

  const code = group.invite_code;

  return (
    <Screen
      onRefresh={onRefresh}
      title={group.name}
      label={`${list.length} member${list.length === 1 ? '' : 's'} · ${groupHabits.length} shared ${groupHabits.length === 1 ? 'habit' : 'habits'}`}
      back={back}
      onMenu={() => setMenuOpen(true)}
      menuLabel="Options"
    >
      <Section label="This week" action={`${weekDone} of ${weekOwed} days`}>
        <Board habits={groupHabits} members={list} done={done} date={today} userId={userId} />
        <Text style={styles.note}>A day fills only when that person kept everything owed that day.</Text>
      </Section>

      <Section
        label="Shared habits"
        action="Add"
        actionLabel="Add a shared habit"
        onAction={() => router.push({ pathname: '/habit/new', params: { group: group.id } })}
        list
      >
        {groupHabits.length === 0 ? (
          <Text style={[styles.note, styles.none]}>
            None yet. A shared habit is one habit the whole group checks in against.
          </Text>
        ) : (
          groupHabits.map((habit, i) => {
            const inToday = list.filter((m) => done.has(doneKey(habit.id, m.user_id, today))).length;
            const mine = userId ? done.has(doneKey(habit.id, userId, today)) : false;
            return (
              <HabitRow
                key={habit.id}
                name={habit.title}
                meta={`${inToday} of ${list.length} in today`}
                complete={mine}
                last={i === groupHabits.length - 1}
                onToggle={
                  userId
                    ? () => {
                        feel(mine ? 'select' : 'success');
                        toggle.mutate({ habitId: habit.id, date: today, complete: !mine });
                      }
                    : undefined
                }
                onPress={() => router.push(`/habit/${habit.id}`)}
                onLongPress={() => setHabitMenu(habit)}
              />
            );
          })
        )}
      </Section>

      <Section
        label="Standings"
        action="See all"
        onAction={() => router.push({ pathname: '/group/leaderboard', params: { id: group.id } })}
        list
      >
        {top3.map((row, i) => {
          const name = row.member.profile?.display_name ?? 'Someone';
          const rate = Math.round(row.rate * 100);
          return (
            <Row
              key={row.member.user_id}
              last={i === top3.length - 1}
              accessibilityLabel={`${i + 1}, ${name}, ${rate}% this week`}
            >
              <Text style={[styles.rank, i === 0 && styles.leader]}>{String(i + 1).padStart(2, '0')}</Text>
              <Avatar name={name} size={28} />
              <Text numberOfLines={1} style={styles.name}>
                {name}
              </Text>
              <Text style={styles.figure}>{rate}%</Text>
            </Row>
          );
        })}
      </Section>

      <Section label="Invite code" action={isOwner ? 'Yours' : undefined}>
        <Pressable
          onPress={copyCode}
          accessibilityRole="button"
          // Spelt out, so a screen reader reads six letters and not a word.
          accessibilityLabel={`Invite code ${code.split('').join(' ')}. Copy it`}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.code} maxFontSizeMultiplier={1.4}>
            {code}
          </Text>
        </Pressable>
        <View style={styles.codeActions}>
          <Button
            title={copied ? 'Copied' : 'Copy'}
            variant="outline"
            onPress={copyCode}
            style={styles.grow}
          />
          <Button title="Share" onPress={shareCode} style={styles.grow} />
        </View>
      </Section>

      <Section label="Members" list>
        {list.map((member, i) => (
          <Row
            key={member.user_id}
            last={i === list.length - 1}
            accessibilityLabel={`${handle(member.profile)}${member.user_id === userId ? ', you' : ''}${member.role === 'owner' ? ', owns the group' : ''}`}
          >
            <Avatar name={member.profile?.display_name ?? '?'} size={28} />
            <Text numberOfLines={1} style={styles.name}>
              {handle(member.profile)}
              {member.user_id === userId ? ' (you)' : ''}
            </Text>
            {member.role === 'owner' ? <Tag label="Owner" /> : null}
          </Row>
        ))}
      </Section>

      {error ? <Notice label="Something went wrong">{error}</Notice> : null}

      <Notice label="How shared habits work">
        {'A shared habit is one habit the whole group checks in against — not a copy each. Check in here or from Today; the board shows who has and who has not yet, and updates as they do.'}
      </Notice>

      {/* Same shortcut as Today, and the same rule: Open is the row's tap,
          Edit is on the detail screen, Archive is on the edit screen. Nothing
          here is only reachable by holding, and Delete is not here at all. */}
      <Sheet
        visible={habitMenu !== null}
        title={habitMenu?.title}
        onClose={() => setHabitMenu(null)}
        actions={
          habitMenu
            ? [
                {
                  label: 'Open',
                  hint: 'History, streak and details',
                  onPress: () => router.push(`/habit/${habitMenu.id}`),
                },
                {
                  label: 'Edit',
                  hint: 'Name, schedule and sharing',
                  onPress: () =>
                    router.push({ pathname: '/habit/edit', params: { id: habitMenu.id } }),
                },
                {
                  label: habitMenu.archived_at ? 'Restore' : 'Archive',
                  hint: habitMenu.archived_at
                    ? 'Put it back on the board'
                    : 'Off the board, but every check-in is kept',
                  onPress: () =>
                    setArchived.mutate({ id: habitMenu.id, archived: !habitMenu.archived_at }),
                },
              ]
            : []
        }
      />

      <Sheet
        visible={menuOpen}
        title={group.name}
        onClose={() => setMenuOpen(false)}
        actions={[
          ...(isOwner
            ? [
                {
                  label: 'Group settings',
                  hint: 'Its name',
                  onPress: () =>
                    router.push({ pathname: '/group/settings', params: { id: group.id } }),
                },
                {
                  label: 'Change the invite code',
                  hint: 'The old one stops working',
                  onPress: () =>
                    rotate.mutate(group.id, {
                      onError: (e: unknown) =>
                        setError(e instanceof Error ? e.message : 'The code could not be changed.'),
                    }),
                },
              ]
            : []),
          {
            label: 'Leave group',
            tone: 'danger' as const,
            hint: 'You can rejoin with the code',
            onPress: () => void confirmLeave(),
          },
        ]}
      />
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    loader: { marginTop: space.xl },
    note: { ...t.type.italic, color: t.colors.inkMuted, marginTop: space.md },
    none: { marginTop: space.md },
    rank: { ...t.type.figureSmall, color: t.colors.inkMuted, width: 28 },
    leader: { color: t.colors.ink },
    name: { ...t.type.body, color: t.colors.ink, flex: 1, minWidth: 0 },
    figure: { ...t.type.figureSmall, color: t.colors.ink },
    code: {
      ...t.type.code,
      color: t.colors.ink,
      textAlign: 'center',
      // The tracking hangs off the last character, so the same amount is
      // added back on the left to keep the code optically centred.
      paddingLeft: t.type.code.letterSpacing,
      paddingVertical: space.md,
    },
    codeActions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
    grow: { flex: 1 },
    pressed: { opacity: 0.6 },
  });
