import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useGroups } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

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
        <EmptyState
          icon="👥"
          title="No groups yet"
          body="Create one and share its six-character code, or enter a friend’s code to join theirs."
          actionLabel="Create a group"
          onAction={() => router.push('/group/new')}
        />
      ) : (
        <Card title="Your groups" flush>
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
              {group.emoji ? (
                <View style={[styles.icon, { backgroundColor: colors.bgSurfaceMuted }]}>
                  <Text style={styles.glyph}>{group.emoji}</Text>
                </View>
              ) : null}
              <View style={styles.info}>
                <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
                  {group.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  Code {group.invite_code}
                </Text>
              </View>
              <Pill label="Open" />
            </Pressable>
          ))}
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          label="Create a group"
          variant="primary"
          onPress={() => router.push('/group/new')}
          style={styles.grow}
        />
        <Button label="Join" onPress={() => router.push('/group/join')} />
      </View>

      <Notice label="Shared habits">
        {'Open a group to see its board and add habits the whole group checks in against. A shared habit is one habit, not a copy each — everyone ticks the same one.'}
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, minWidth: 0, gap: 1 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 18, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12 },
  grow: { flex: 1 },
});
