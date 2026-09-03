import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Board } from '@/components/Board';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/auth/AuthProvider';
import {
  checkInIndex,
  useCheckIns,
  useGroupMembers,
  useGroups,
  useHabits,
  useLeaveGroup,
  useRotateInviteCode,
} from '@/lib/queries';
import { formatToday, toLocalDate } from '@/lib/date';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

export default function GroupScreen() {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const groups = useGroups();
  const members = useGroupMembers(id);
  const habits = useHabits();
  const checkIns = useCheckIns();
  const leave = useLeaveGroup(userId);
  const rotate = useRotateInviteCode();

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = toLocalDate();
  const group = useMemo(() => groups.data?.find((g) => g.id === id), [groups.data, id]);
  const list = members.data ?? [];
  const isOwner = list.some((m) => m.user_id === userId && m.role === 'owner');

  const groupHabits = useMemo(
    () => (habits.data ?? []).filter((h) => h.group_id === id),
    [habits.data, id],
  );
  const done = useMemo(() => checkInIndex(checkIns.data), [checkIns.data]);

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
      eyebrow={`${list.length} member${list.length === 1 ? '' : 's'}`}
    >
      <Card title="Today's board" action={formatToday(today)}>
        <Board habits={groupHabits} members={list} done={done} date={today} />
      </Card>

      <Link
        href={{ pathname: '/habit/new', params: { group: group.id } }}
        style={[typography.rowName, styles.add, { color: colors.green }]}
      >
        + Add a shared habit
      </Link>

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
            <View
              style={[
                styles.avatar,
                { backgroundColor: member.role === 'owner' ? colors.green : colors.blue },
              ]}
            >
              <Text style={styles.initial}>
                {(member.profile?.display_name ?? '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text numberOfLines={1} style={[typography.rowName, styles.name, { color: colors.textPrimary }]}>
              {member.profile?.display_name ?? 'Someone'}
              {member.user_id === userId ? ' (you)' : ''}
            </Text>
            {member.role === 'owner' ? <Pill label="Owner" tone="good" /> : null}
          </View>
        ))}
      </Card>

      {error ? <Notice label="Something went wrong" tone="bad">{error}</Notice> : null}

      {isOwner ? (
        <Button
          label="Change the code"
          busy={rotate.isPending}
          onPress={() =>
            rotate.mutate(group.id, {
              onError: (e) => setError(e instanceof Error ? e.message : 'Could not change it.'),
            })
          }
        />
      ) : null}

      <Button label="Leave group" variant="danger" busy={leave.isPending} onPress={confirmLeave} />

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
  row: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'CascadiaCode-SemiBold', fontSize: 9, color: '#fff' },
  name: { flex: 1, minWidth: 0 },
  add: { paddingHorizontal: 2 },
});
