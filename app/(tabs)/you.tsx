import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/auth/AuthProvider';
import { handle } from '@/lib/identity';
import { useProfile } from '@/lib/queries';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

export default function YouScreen() {
  const { colors, mode, setMode, scheme } = useTheme();
  const { userId, session, signOut } = useAuth();
  const profile = useProfile(userId);
  const router = useRouter();

  return (
    <Screen title="You" eyebrow={handle(profile.data)}>
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

      <Notice label="Coming later">
        {'Reminder times land in Phase 5, and account deletion ships before the app does.'}
      </Notice>
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
