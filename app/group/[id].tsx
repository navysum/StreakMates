import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Avatar } from '@/components/Avatar';
import { Board } from '@/components/Board';
import { HabitRow } from '@/components/HabitRow';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
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
import { space, typography } from '@/theme/tokens';

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
      top3: [...rows].sort((a, b) => b.kept - a.kept).slice(0, 3),
    };
  }, [groupHabits, list, done, today]);

  if (groups.isLoading || members.isLoading) {
    return (
      <Screen title="Group">
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen title="Group" eyebrow="Not found">
        <Notice label="Gone" tone="warn">
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
      message: `Join ${group!.name} on Habits — the code is ${group!.invite_code}`,
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
      title={group.emoji ? `${group.emoji}  ${group.name}` : group.name}
      eyebrow={`${list.length} member${list.length === 1 ? '' : 's'} · ${groupHabits.length} shared ${groupHabits.length === 1 ? 'habit' : 'habits'}`}
      onMenu={() => setMenuOpen(true)}
      menuLabel="Group options"
    >
      <Card title="This week" action={`${weekDone} / ${weekOwed}`}>
        <Board habits={groupHabits} members={list} done={done} date={today} />
      </Card>

      <Card title="Shared habits" action="+ Add" onAction={() => router.push({ pathname: '/habit/new', params: { group: group.id } })} flush>
        {groupHabits.length === 0 ? (
          <Text style={[typography.caption, styles.none, { color: colors.textMuted }]}>
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
                icon={habit.emoji}
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
      </Card>

      <Pressable
        onPress={() => router.push({ pathname: '/group/leaderboard', params: { id: group.id } })}
        accessibilityRole="button"
        accessibilityLabel="See all standings"
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Card title="Standings" action="See all" flush>
          {top3.map((row, i) => (
            <View
              key={row.member.user_id}
              style={[
                styles.rank,
                {
                  borderBottomColor: colors.borderDefault,
                  borderBottomWidth: i === top3.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.stat,
                  styles.place,
                  { color: i === 0 ? colors.amber : colors.textMuted },
                ]}
              >
                {i + 1}
              </Text>
              <Avatar
                id={row.member.user_id}
                name={row.member.profile?.display_name ?? '?'}
                size={28}
              />
              <Text
                numberOfLines={1}
                style={[typography.body, styles.name, { color: colors.textPrimary }]}
              >
                {row.member.profile?.display_name ?? 'Someone'}
              </Text>
              <Text style={[typography.stat, styles.score, { color: colors.textPrimary }]}>
                {row.kept}
              </Text>
            </View>
          ))}
        </Card>
      </Pressable>

      <Card title="Invite code" action={isOwner ? 'Owner' : undefined}>
        <Pressable onPress={copyCode} accessibilityRole="button" accessibilityLabel="Copy invite code">
          <Text style={[styles.code, { color: colors.textPrimary }]}>{group.invite_code}</Text>
        </Pressable>
        <View style={styles.codeActions}>
          <Button label={copied ? 'Copied' : 'Copy'} onPress={copyCode} style={styles.grow} />
          <Button label="Share" variant="primary" onPress={shareCode} style={styles.grow} />
        </View>
      </Card>

      <Card title="Members">
        {list.map((member, i) => (
          <View
            key={member.user_id}
            style={[
              styles.row,
              {
                borderBottomColor: colors.borderDefault,
                borderBottomWidth: i === list.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Avatar id={member.user_id} name={member.profile?.display_name ?? '?'} size={28} />
            <Text numberOfLines={1} style={[typography.rowName, styles.name, { color: colors.textPrimary }]}>
              {handle(member.profile)}
              {member.user_id === userId ? ' (you)' : ''}
            </Text>
            {member.role === 'owner' ? <Pill label="Owner" tone="good" /> : null}
          </View>
        ))}
      </Card>

      {error ? <Notice label="Something went wrong" tone="bad">{error}</Notice> : null}

      <Sheet
        visible={menuOpen}
        title="Group options"
        onClose={() => setMenuOpen(false)}
        actions={[
          ...(isOwner
            ? [
                {
                  label: 'Group settings',
                  hint: 'NAME AND ICON',
                  onPress: () =>
                    router.push({ pathname: '/group/settings', params: { id: group.id } }),
                },
                {
                  label: 'Change the invite code',
                  hint: 'THE OLD ONE STOPS WORKING',
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
            hint: 'YOU CAN REJOIN WITH THE CODE',
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
  code: {
    fontFamily: 'CascadiaCode-SemiBold',
    fontSize: 30,
    letterSpacing: 5,
    textAlign: 'center',
    paddingVertical: 10,
  },
  codeActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  grow: { flex: 1 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.md },
  place: { width: 20 },
  score: { minWidth: 28, textAlign: 'right' },
  name: { flex: 1, minWidth: 0 },
  none: { paddingBottom: space.sm },
  pressed: { opacity: 0.7 },
});
