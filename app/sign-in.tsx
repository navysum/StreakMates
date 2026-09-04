import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { useAuth } from '@/auth/AuthProvider';
import { configError } from '@/lib/supabase';
import { emailProblem, nameProblem, normaliseEmail, passwordProblem } from '@/lib/credentials';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, spacing, typography } from '@/theme/tokens';

/**
 * Sign in with Apple has to be offered on iOS once any other social login is,
 * or Apple rejects the build. It cannot be switched on until there is an Apple
 * Developer account to create the Services ID and key with, so it stays behind
 * a flag rather than shipping as a button that always fails.
 */
const APPLE_ENABLED = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === '1';

type Mode = 'in' | 'up';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { configured, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, sendPasswordReset } =
    useAuth();

  const [mode, setMode] = useState<Mode>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<null | 'email' | 'google' | 'apple' | 'reset'>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function clear() {
    setError(null);
    setNotice(null);
  }

  async function run(kind: 'google' | 'apple', fn: () => Promise<void>) {
    clear();
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    clear();

    const problem =
      (mode === 'up' ? nameProblem(name) : null) ??
      emailProblem(email) ??
      passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy('email');
    try {
      if (mode === 'in') {
        await signInWithEmail(normaliseEmail(email), password);
      } else {
        const { needsConfirmation } = await signUpWithEmail(
          normaliseEmail(email),
          password,
          name.trim(),
        );
        if (needsConfirmation) {
          setNotice(
            `Account created. Open the link we sent to ${normaliseEmail(email)} to confirm it, then sign in.`,
          );
          setMode('in');
          setPassword('');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue.');
    } finally {
      setBusy(null);
    }
  }

  async function forgot() {
    clear();
    const problem = emailProblem(email);
    if (problem) {
      setError(`${problem} We need it to send the reset link.`);
      return;
    }
    setBusy('reset');
    try {
      await sendPasswordReset(normaliseEmail(email));
      // Says the same thing whether or not the address has an account, so the
      // form cannot be used to find out who is signed up.
      setNotice(`If ${normaliseEmail(email)} has an account, a reset link is on its way.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset link.');
    } finally {
      setBusy(null);
    }
  }

  const field = {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    color: colors.textPrimary,
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgPage }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.xxxl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text style={[typography.display, styles.title, { color: colors.textPrimary }]}>
          StreakMates
        </Text>
        <Text style={[typography.body, styles.tagline, { color: colors.textSecondary }]}>
          Building better habits, together.
        </Text>
      </View>

      {!configured ? (
        <Notice label={configError ? 'Check your .env' : 'Setup needed'} tone="warn">
          {configError ??
            'No Supabase project is connected yet. Create one, run the migrations in supabase/migrations in its SQL editor, then copy .env.example to .env with your project URL and anon key and restart the dev server. Full steps are in supabase/README.md.'}
        </Notice>
      ) : (
        <>
          <View style={styles.form}>
            {mode === 'up' ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                style={[styles.input, typography.rowName, field]}
                accessibilityLabel="Your name"
              />
            ) : null}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              style={[styles.input, typography.rowName, field]}
              accessibilityLabel="Email"
            />

            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!show}
                autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
                textContentType={mode === 'up' ? 'newPassword' : 'password'}
                style={[styles.input, styles.grow, typography.rowName, field]}
                accessibilityLabel="Password"
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              <Pressable
                onPress={() => setShow((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={show ? 'Hide password' : 'Show password'}
                style={({ pressed }) => [
                  styles.reveal,
                  { backgroundColor: pressed ? colors.bgHover : colors.bgSurfaceMuted },
                ]}
              >
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {show ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>

            <Button
              label={mode === 'in' ? 'Sign in' : 'Create account'}
              variant="primary"
              onPress={submit}
              busy={busy === 'email'}
              disabled={busy !== null && busy !== 'email'}
            />

            <View style={styles.switchRow}>
              <Pressable
                onPress={() => {
                  clear();
                  setMode(mode === 'in' ? 'up' : 'in');
                }}
                accessibilityRole="button"
                hitSlop={space.sm}
              >
                <Text style={[typography.action, { color: colors.green }]}>
                  {mode === 'in' ? 'Create an account' : 'I already have an account'}
                </Text>
              </Pressable>

              {mode === 'in' ? (
                <Pressable
                  onPress={forgot}
                  accessibilityRole="button"
                  hitSlop={space.sm}
                  disabled={busy !== null}
                >
                  <Text style={[typography.action, { color: colors.textMuted }]}>
                    Forgot password?
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.divider}>
            <View style={[styles.rule, { backgroundColor: colors.borderDefault }]} />
            <Text style={[typography.label, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.rule, { backgroundColor: colors.borderDefault }]} />
          </View>

          <View style={styles.providers}>
            <Button
              label="Continue with Google"
              onPress={() => run('google', signInWithGoogle)}
              busy={busy === 'google'}
              disabled={busy !== null && busy !== 'google'}
            />
            {Platform.OS === 'ios' && APPLE_ENABLED ? (
              <Button
                label="Continue with Apple"
                onPress={() => run('apple', signInWithApple)}
                busy={busy === 'apple'}
                disabled={busy !== null && busy !== 'apple'}
              />
            ) : null}
          </View>

          {error ? (
            <Notice label="Could not continue" tone="bad">
              {error}
            </Notice>
          ) : null}
          {notice ? (
            <Notice label="Check your email" tone="good">
              {notice}
            </Notice>
          ) : null}

          <Text style={[typography.caption, styles.fine, { color: colors.textMuted }]}>
            We store your name, avatar and email. Nothing else.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.page, gap: spacing.section, justifyContent: 'center' },
  head: { alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  // The mark is 365x482, so the box matches it rather than letterboxing a
  // square down to 72pt wide.
  mark: { width: 100, height: 132 },
  title: { marginTop: space.sm },
  tagline: { textAlign: 'center' },
  form: { gap: space.md },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: space.lg,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'stretch', gap: space.sm },
  grow: { flex: 1 },
  reveal: {
    paddingHorizontal: space.lg,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
    flexWrap: 'wrap',
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  providers: { gap: space.md },
  fine: { textAlign: 'center' },
});
