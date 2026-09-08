import { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { configError } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, ink, space, spacing, typography } from '@/theme/tokens';

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
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* The lockup carries the name and the tagline itself, so the screen
          does not set them again underneath in a different typeface. */}
      <View style={styles.head}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={`${brand.name} — ${brand.tagline}`}
          accessibilityIgnoresInvertColors
        />
      </View>

      {configured ? (
        <>
          <Button label="Continue with Google" variant="gradient" onPress={onGoogle} busy={busy} />
          {error ? <Notice label="Could not sign in">{error}</Notice> : null}
          <Text style={[typography.caption, styles.fine, { color: ink(colors, 65) }]}>
            We store your name, avatar and email. Nothing else.
          </Text>
        </>
      ) : (
        <Notice label={configError ? 'Check your .env' : 'Setup needed'}>
          {configError ??
            'No Supabase project is connected yet. Create one, run supabase/migrations/0001_init.sql in its SQL editor, then copy .env.example to .env with your project URL and anon key and restart the dev server. Full steps are in supabase/README.md.'}
        </Notice>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.page, gap: spacing.section, justifyContent: 'center' },
  head: { alignItems: 'center', marginBottom: space.lg },
  // Square, cut from the master by scripts/make-icons.py.
  mark: { width: 188, height: 188 },
  fine: { textAlign: 'center' },
});
