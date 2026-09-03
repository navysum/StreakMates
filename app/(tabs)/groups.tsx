import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useGroups } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const groups = useGroups();
  const list = groups.data ?? [];

  return (
    <Screen title="Groups" eyebrow={list.length ? `${list.length} joined` : 'None yet'}>
      {groups.error ? (
        <Notice label="Could not load" tone="bad">
          {groups.error instanceof Error ? groups.error.message : 'Something went wrong.'}
        </Notice>
      ) : null}

      {groups.isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      ) : list.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <Text style={[typography.rowName, { color: colors.textPrimary }]}>No groups yet</Text>
            <Text style={[typography.body, styles.body, { color: colors.textSecondary }]}>
              Create one and share its six-character code, or enter a friend’s code to join theirs.
            </Text>
          </View>
        </Card>
      ) : (
        <Card title="Your groups">
          {list.map((group, i) => (
            <Pressable
              key={group.id}
              onPress={() => router.push(`/group/${group.id}`)}
              accessibilityRole="button"
              style={[
                styles.row,
                {
                  borderBottomColor: colors.borderDefault,
                  borderBottomWidth: i === list.length - 1 ? 0 : 1,
                },
              ]}
            >
              <View style={styles.info}>
                <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
                  {group.emoji ? `${group.emoji}  ${group.name}` : group.name}
                </Text>
                <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
                  CODE {group.invite_code}
                </Text>
              </View>
              <Pill label="Open" />
            </Pressable>
          ))}
        </Card>
      )}

      <View style={styles.actions}>
        <Link href="/group/new" style={[typography.rowName, { color: colors.green }]}>
          + Create a group
        </Link>
        <Link href="/group/join" style={[typography.rowName, { color: colors.textMuted }]}>
          Join with a code
        </Link>
      </View>

      <Notice label="Shared habits">
        {'Open a group to see its board and add habits the whole group checks in against. A shared habit is one habit, not a copy each — everyone ticks the same one.'}
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 24 },
  empty: { gap: 6, paddingVertical: 4 },
  body: { lineHeight: 18 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, minWidth: 0, gap: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
});
