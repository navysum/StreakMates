import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from '@/lib/supabase';

// Closes the in-app browser automatically once auth redirects back.
WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  userId: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  configured: false,
  loading: false,
  session: null,
  userId: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
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

      async signInWithGoogle() {
        if (!supabase) throw new Error('Supabase is not configured yet.');

        /**
         * Two genuinely different flows, not one with a branch bolted on.
         *
         * On web the page itself navigates to Google and Google navigates it
         * back, so there is no in-app browser to open and no code to exchange
         * by hand — `detectSessionInUrl` finishes the job on the way back in.
         * Trying to run the native flow here opens a popup that most browsers
         * block, and `openAuthSessionAsync` cannot return a URL to a page that
         * has already been replaced.
         */
        if (Platform.OS === 'web') {
          // Back to wherever the app is actually served from, so the same
          // build works on localhost, a Vercel preview and the real domain
          // without any of them being hard-coded.
          const redirectTo = `${window.location.origin}/`;
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
          });
          if (error) throw error;
          return; // the page is on its way to Google; nothing follows this
        }

        // In Expo Go this is an exp:// URL whose host changes per tunnel, so
        // Supabase needs a wildcard redirect entry. A development build uses
        // the streakmates:// scheme from app.json instead.
        const redirectTo = Linking.createURL('/auth-callback');

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (!data.url) throw new Error('Google did not return a sign-in URL.');

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') return; // cancelled or dismissed

        const params = new URL(result.url).searchParams;

        // Google reports a refusal by redirecting back with an error rather
        // than by failing the request, so without this it surfaces as the
        // generic "no code" below and reads like a bug in the app.
        const denied = params.get('error_description') ?? params.get('error');
        if (denied) throw new Error(denied);

        const code = params.get('code');
        if (!code) throw new Error('Sign-in finished without a code.');

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      },

      async signOut() {
        await supabase?.auth.signOut();
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
