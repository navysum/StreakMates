import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, HeroText, Label, Paper, Seal } from '@/components/ui';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { configError } from '@/lib/supabase';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

export default function SignInScreen() {
  const styles = useThemedStyles(makeStyles);
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
      setError(e instanceof Error ? e.message : 'Signing in did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        {/* The seal is StreakMates' mark: 連, "in a row" and "a companion". */}
        <View style={styles.head}>
          <Seal size={64} label="StreakMates" />
          <Label accessibilityRole="header">StreakMates</Label>
          <HeroText text="Better together." />
          <Text style={styles.lead}>
            A habit tracker built around the people you are doing it with.
          </Text>
        </View>

        {configured ? (
          <View style={styles.actions}>
            <Button title="Continue with Google" onPress={onGoogle} loading={busy} />
            {error ? <Notice label="Could not sign in">{error}</Notice> : null}
            <Text style={styles.fine}>
              We keep your name, picture and email address. Nothing else.
            </Text>
          </View>
        ) : (
          <Notice label={configError ? 'Check your .env' : 'Setup needed'}>
            {configError ??
              'No Supabase project is connected yet. Create one, run supabase/migrations/0001_init.sql in its SQL editor, then copy .env.example to .env with your project URL and anon key and restart the dev server. Full steps are in supabase/README.md.'}
          </Notice>
        )}
      </ScrollView>
    </Paper>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.gutter, gap: space.xxl },
    head: { gap: space.md },
    lead: { ...t.type.body, color: t.colors.inkSoft },
    actions: { gap: space.md },
    fine: { ...t.type.italic, color: t.colors.inkMuted },
  });
