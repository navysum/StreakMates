import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { configError } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { configured, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgPage }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.mark, { borderColor: colors.green, borderRightColor: colors.greenFaint }]} />
        <Text style={[typography.screenTitle, styles.title, { color: colors.textPrimary }]}>
          Habits
        </Text>
        <Text style={[typography.body, styles.tagline, { color: colors.textSecondary }]}>
          Streaks are easier with witnesses.
        </Text>
      </View>

      {configured ? (
        <>
          <Button label="Continue with Google" variant="primary" onPress={onGoogle} busy={busy} />
          {error ? <Notice label="Could not sign in" tone="bad">{error}</Notice> : null}
          <Text style={[typography.monoSmall, styles.fine, { color: colors.textMuted }]}>
            We store your name, avatar and email. Nothing else.
          </Text>
        </>
      ) : (
        <Notice label={configError ? 'Check your .env' : 'Setup needed'} tone="warn">
          {configError ??
            'No Supabase project is connected yet. Create one, run supabase/migrations/0001_init.sql in its SQL editor, then copy .env.example to .env with your project URL and anon key and restart the dev server. Full steps are in supabase/README.md.'}
        </Notice>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.page, gap: spacing.card, justifyContent: 'center' },
  head: { alignItems: 'center', gap: 8, marginBottom: 12 },
  mark: { width: 44, height: 44, borderRadius: 22, borderWidth: 3 },
  title: { fontSize: 26, marginTop: 6 },
  tagline: { textAlign: 'center' },
  fine: { textAlign: 'center', lineHeight: 14 },
});
