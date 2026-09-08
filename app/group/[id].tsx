import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Avatar } from '@/components/Avatar';
import { Board } from '@/components/Board';
import { HabitRow } from '@/components/HabitRow';
import { Button } from '@/components/Button';
import { Plate } from '@/components/Plate';
import { Notice } from '@/components/Notice';
import { Tag } from '@/components/Tag';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
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
  useToggleCheckIn,
  doneKey,
} from '@/lib/queries';
import { toLocalDate } from '@/lib/date';
import { aggregateCells } from '@/lib/week';
import { handle } from '@/lib/identity';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, tnum, typography } from '@/theme/tokens';

export default function GroupScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const members = useGroupMembers(id);
  const habits = useHabits();
  const checkIns = useCheckIns();
  const order = useHabitOrder(userId);
  const leave = useLeaveGroup(userId);
  const rotate = useRotateInviteCode();
  const toggle = useToggleCheckIn(userId);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    }));
    const rows = list.map((member) => {
      const cells = aggregateCells(
        today,
        schedules,
        (habitId, day) => done.has(doneKey(habitId, member.user_id, day)),
        today,
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

  if (groups.isLoading || members.isLoading) {
    return (
      <Screen title="Group">
        <ActivityIndicator style={styles.loader} color={ink(colors, 62)} />
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen title="Group" label="Not found">
        <Notice label="Gone">
          {'This group no longer exists, or you are not a member of it.'}
        </Notice>
        <Button label="Back to groups" onPress={() => router.replace('/groups')} />
      </Screen>
    );
  }

  async function copyCode() {
    await Clipboard.setStringAsync(group!.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function shareCode() {
    await Share.share({
      message: `Join ${group!.name} on StreakMates — the code is ${group!.invite_code}`,
    });
  }

  function confirmLeave() {
    Alert.alert(
      `Leave ${group!.name}?`,
      isOwner
        ? 'You are the owner. Leaving does not delete the group, but nobody will be able to change its code afterwards.'
        : 'You can rejoin later with the code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () =>
            leave.mutate(group!.id, {
              onSuccess: () => router.replace('/groups'),
              onError: (e) => setError(e instanceof Error ? e.message : 'Could not leave.'),
            }),
        },
      ],
    );
  }

  return (
    <Screen
      title={group.name}
      label={`${list.length} member${list.length === 1 ? '' : 's'} · ${groupHabits.length} shared ${groupHabits.length === 1 ? 'habit' : 'habits'}`}
      back={{ label: 'Groups', onPress: () => router.replace('/groups') }}
      onMenu={() => setMenuOpen(true)}
      menuLabel="Group options"
    >
      <Plate marks>
        <View style={styles.plateHead}>
          <Text style={[typography.label, { color: ink(colors, 65) }]}>This week</Text>
          <Text style={[typography.figure, tnum, { color: colors.text }]}>
            {weekDone} / {weekOwed}
          </Text>
        </View>
        <View style={styles.board}>
          <Board habits={groupHabits} members={list} done={done} date={today} userId={userId} />
        </View>
        <Text style={[typography.caption, styles.footnote, { color: ink(colors, 65) }]}>
          A square fills only when that person kept everything owed that day.
        </Text>
      </Plate>

      <Plate
        label="Shared habits"
        action="+ Add"
        onAction={() => router.push({ pathname: '/habit/new', params: { group: group.id } })}
        flush
      >
        {groupHabits.length === 0 ? (
          <Text style={[typography.caption, styles.none, { color: ink(colors, 70) }]}>
            None yet. A shared habit is one habit the whole group checks in against.
          </Text>
        ) : (
          groupHabits.map((habit, i) => {
            const inToday = list.filter((m) =>
              done.has(doneKey(habit.id, m.user_id, today)),
            ).length;
            return (
              <HabitRow
                key={habit.id}
                name={habit.title}
                meta={`${inToday} of ${list.length} in today`}
                complete={userId ? done.has(doneKey(habit.id, userId, today)) : false}
                last={i === groupHabits.length - 1}
                onToggle={
                  userId
                    ? () =>
                        toggle.mutate({
                          habitId: habit.id,
                          date: today,
                          complete: !done.has(doneKey(habit.id, userId, today)),
                        })
                    : undefined
                }
                onPress={() => router.push(`/habit/${habit.id}`)}
              />
            );
          })
        )}
      </Plate>

      <Pressable
        onPress={() => router.push({ pathname: '/group/leaderboard', params: { id: group.id } })}
        accessibilityRole="button"
        accessibilityLabel="See all standings"
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Plate label="Standings" action="See all" flush>
          {top3.map((row, i) => (
            <View
              key={row.member.user_id}
              style={[
                styles.rank,
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: i === top3.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.figureSmall,
                  styles.place,
                  { color: i === 0 ? colors.accents[700] : ink(colors, 62) },
                ]}
              >
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Avatar name={row.member.profile?.display_name ?? '?'} size={28} />
              <Text
                numberOfLines={1}
                style={[typography.body, styles.name, { color: colors.text }]}
              >
                {row.member.profile?.display_name ?? 'Someone'}
              </Text>
              <Text style={[typography.figureSmall, styles.score, { color: colors.text }]}>
                {Math.round(row.rate * 100)}%
              </Text>
            </View>
          ))}
        </Plate>
      </Pressable>

      <Plate marks>
        <View style={styles.plateHead}>
          <Text style={[typography.label, { color: ink(colors, 65) }]}>Invite code</Text>
          {isOwner ? <Tag label="Owner" variant="outline" /> : null}
        </View>
        <Pressable
          onPress={copyCode}
          accessibilityRole="button"
          accessibilityLabel="Copy invite code"
        >
          <Text style={[typography.code, styles.code, { color: colors.text }]}>
            {group.invite_code}
          </Text>
        </Pressable>
        <View style={styles.codeActions}>
          <Button label={copied ? 'Copied' : 'Copy'} onPress={copyCode} style={styles.grow} />
          <Button label="Share" variant="primary" onPress={shareCode} style={styles.grow} />
        </View>
      </Plate>

      <Plate label="Members">
        {list.map((member, i) => (
          <View
            key={member.user_id}
            style={[
              styles.row,
              {
                borderBottomColor: colors.divider,
                borderBottomWidth: i === list.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Avatar name={member.profile?.display_name ?? '?'} size={28} />
            <Text
              numberOfLines={1}
              style={[typography.body, styles.name, { color: colors.text }]}
            >
              {handle(member.profile)}
              {member.user_id === userId ? ' (you)' : ''}
            </Text>
            {member.role === 'owner' ? <Tag label="Owner" /> : null}
          </View>
        ))}
      </Plate>

      {error ? <Notice label="Something went wrong">{error}</Notice> : null}

      <Sheet
        visible={menuOpen}
        title="Group options"
        onClose={() => setMenuOpen(false)}
        actions={[
          ...(isOwner
            ? [
                {
                  label: 'Group settings',
                  hint: 'Name and description',
                  onPress: () =>
                    router.push({ pathname: '/group/settings', params: { id: group.id } }),
                },
                {
                  label: 'Change the invite code',
                  hint: 'The old one stops working',
                  onPress: () =>
                    rotate.mutate(group.id, {
                      onError: (e: unknown) =>
                        setError(e instanceof Error ? e.message : 'Could not change it.'),
                    }),
                },
              ]
            : []),
          {
            label: 'Leave group',
            tone: 'danger' as const,
            hint: 'You can rejoin with the code',
            onPress: confirmLeave,
          },
        ]}
      />

      <Notice label="How shared habits work">
        {'A shared habit is one habit the whole group checks in against — not a copy each. Check in from Today; the board here shows who has and who hasn’t, and updates as they do.'}
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  plateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: 24,
  },
  board: { marginTop: space.xl },
  footnote: { marginTop: space.xl },
  code: {
    textAlign: 'center',
    // The tracking hangs off the last character, so the same amount of space
    // is added back on the left to keep the code optically centred.
    paddingLeft: 10.6,
    paddingVertical: space.xxl,
  },
  codeActions: { flexDirection: 'row', gap: space.md },
  grow: { flex: 1 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  rank: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  place: { width: 22 },
  score: { minWidth: 40, textAlign: 'right' },
  name: { flex: 1, minWidth: 0 },
  none: { paddingBottom: space.sm },
  pressed: { opacity: 0.7 },
});
