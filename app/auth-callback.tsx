import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { passwordProblem } from '@/lib/credentials';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, spacing, typography } from '@/theme/tokens';

/**
 * Where a link from an email lands: confirming an address, or resetting a
 * password. Both arrive as a code to swap for a session; only the reset then
 * needs anything from the person.
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { exchangeCode, updatePassword, recovering, session } = useAuth();

  const [state, setState] = useState<'working' | 'ready' | 'failed'>('working');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // A code can only be spent once. Exchanging it changes the session, which
  // recreates exchangeCode and would re-run this effect — spending it a second
  // time and reporting the resulting "invalid code" as a broken link. The ref
  // is what makes this run once per code rather than once per render.
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (attempted.current === (code ?? '')) return;
    attempted.current = code ?? '';

    let cancelled = false;
    (async () => {
      if (!code) {
        // No code and already signed in: the link was just a confirmation and
        // the session came through the listener. Nothing left to do here.
        if (!cancelled) setState(session ? 'ready' : 'failed');
        if (!code && !session && !cancelled) setError('That link is missing its code.');
        return;
      }
      try {
        await exchangeCode(code);
        if (!cancelled) setState('ready');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'That link did not work.');
        setState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, exchangeCode, session]);

  // A confirmed email needs no further input, so it goes straight in.
  useEffect(() => {
    if (state === 'ready' && !recovering) router.replace('/');
  }, [state, recovering, router]);

  async function save() {
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await updatePassword(password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set the password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgPage }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.xxxl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {state === 'working' ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.textMuted} />
          <Text style={[typography.body, { color: colors.textSecondary }]}>Checking the link…</Text>
        </View>
      ) : state === 'failed' ? (
        <>
          <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>
            That link did not work
          </Text>
          <Notice label="Try again" tone="warn">
            {error ?? 'Ask for a new link and open it on this device.'}
          </Notice>
          <Button label="Back to sign in" variant="primary" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <>
          <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>
            Choose a new password
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            At least 8 characters. This signs you in on this device once it is saved.
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={save}
            returnKeyType="go"
            style={[
              styles.input,
              typography.rowName,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderDefault,
                color: colors.textPrimary,
              },
            ]}
            accessibilityLabel="New password"
          />

          {error ? (
            <Notice label="Could not save" tone="bad">
              {error}
            </Notice>
          ) : null}

          <Button label="Save password" variant="primary" onPress={save} busy={busy} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.page, gap: spacing.section, justifyContent: 'center' },
  centre: { alignItems: 'center', gap: space.md },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: space.lg,
  },
});
