import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from '@/lib/supabase';

// Closes the in-app browser automatically once auth redirects back.
WebBrowser.maybeCompleteAuthSession();

/** What a sign-up returned, so the screen can say the right thing next. */
export type SignUpResult = { needsConfirmation: boolean };

type AuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  userId: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<SignUpResult>;
  sendPasswordReset: (email: string) => Promise<void>;
  /** True between following a reset link and choosing the new password. */
  recovering: boolean;
  exchangeCode: (code: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  configured: false,
  loading: false,
  session: null,
  userId: null,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => ({ needsConfirmation: false }),
  sendPasswordReset: async () => {},
  recovering: false,
  exchangeCode: async () => {},
  updatePassword: async () => {},
  signOut: async () => {},
});

/**
 * Both social providers are the same dance: open Supabase's authorize URL in
 * an in-app browser, catch the redirect, swap the code for a session. Only the
 * provider name differs, so it lives in one place.
 */
async function oauth(provider: 'google' | 'apple') {
  if (!supabase) throw new Error('Supabase is not configured yet.');

  // In Expo Go this is an exp:// URL whose host changes per tunnel, so
  // Supabase needs a wildcard redirect entry. A build uses streakmates://.
  const redirectTo = Linking.createURL('/auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw providerError(provider, error.message);
  if (!data.url) throw new Error('That provider did not return a sign-in URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return; // cancelled or dismissed

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('Sign-in finished without a code.');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

/**
 * "Unsupported provider" is what Supabase says when a provider exists but has
 * not been switched on, which is not a sentence that helps anyone.
 */
function providerError(provider: string, message: string) {
  if (/unsupported provider|provider is not enabled/i.test(message)) {
    const name = provider === 'apple' ? 'Apple' : 'Google';
    return new Error(
      `${name} sign-in is not switched on for this project yet. Enable it under Authentication -> Providers in Supabase.`,
    );
  }
  return new Error(message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isConfigured);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Following a reset link signs you in, but only so you can set a new
      // password. The flag is what keeps the app on that screen until you have.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Record the device timezone on the profile so reminders can be scheduled
  // correctly later. Best effort — never blocks sign-in.
  useEffect(() => {
    if (!supabase || !session) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    supabase.from('profiles').update({ timezone: tz }).eq('id', session.user.id).then(
      () => {},
      () => {},
    );
  }, [session]);

  const value = useMemo<AuthState>(
    () => ({
      configured: isConfigured,
      loading,
      session,
      userId: session?.user.id ?? null,

      signInWithGoogle: () => oauth('google'),
      signInWithApple: () => oauth('apple'),

      async signInWithEmail(email, password) {
        if (!supabase) throw new Error('Supabase is not configured yet.');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return;

        // Supabase deliberately says the same thing for a wrong password and
        // an address that has never signed up, so an attacker cannot use the
        // form to find out who has an account. Keep that property.
        if (/invalid login credentials/i.test(error.message)) {
          throw new Error('That email and password do not match an account.');
        }
        if (/email not confirmed/i.test(error.message)) {
          throw new Error('Confirm your email first — check your inbox for the link.');
        }
        throw new Error(error.message);
      },

      async signUpWithEmail(email, password, name) {
        if (!supabase) throw new Error('Supabase is not configured yet.');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          // handle_new_user reads this, so the profile has a name from the
          // first moment rather than the front of the email address.
          options: { data: { name }, emailRedirectTo: Linking.createURL('/auth-callback') },
        });
        if (error) {
          if (/already registered|already been registered/i.test(error.message)) {
            throw new Error('There is already an account with that email. Try signing in.');
          }
          throw new Error(error.message);
        }

        // With confirmation on, Supabase returns a user but no session.
        return { needsConfirmation: !data.session };
      },

      async sendPasswordReset(email) {
        if (!supabase) throw new Error('Supabase is not configured yet.');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: Linking.createURL('/auth-callback'),
        });
        // Never reveal whether the address exists — the screen says the same
        // thing either way, so this only surfaces real failures.
        if (error && !/user not found/i.test(error.message)) throw new Error(error.message);
      },

      recovering,

      async exchangeCode(code) {
        if (!supabase) throw new Error('Supabase is not configured yet.');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw new Error(
            /expired|invalid/i.test(error.message)
              ? 'That link has expired. Ask for a new one.'
              : error.message,
          );
        }
      },

      async updatePassword(password) {
        if (!supabase) throw new Error('Supabase is not configured yet.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
        setRecovering(false);
      },

      async signOut() {
        setRecovering(false);
        await supabase?.auth.signOut();
      },
    }),
    [loading, session, recovering],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
