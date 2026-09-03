import { useState } from 'react';
import { Alert, Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/auth/AuthProvider';
import { handle } from '@/lib/identity';
import { useDeleteAccount, useGroups, useHabits, useProfile } from '@/lib/queries';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

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
      eyebrow={handle(profile.data)}
      onMenu={() => setMenuOpen(true)}
      menuLabel="Account options"
    >
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
  stack: { gap: 9 },
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
