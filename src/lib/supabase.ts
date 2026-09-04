import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sessionStorage } from './secure-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * The API host, which is not the dashboard address people naturally copy out
 * of the browser. Getting this wrong otherwise surfaces as an opaque network
 * failure at sign-in, so it is caught here instead.
 */
const PROJECT_URL = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i;

function describeProblem(): string | null {
  if (!url && !anonKey) return null; // not set up yet — not an error
  if (!url) return 'EXPO_PUBLIC_SUPABASE_URL is missing from .env.';
  if (!anonKey) return 'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing from .env.';

  if (url.includes('supabase.com/dashboard')) {
    return `EXPO_PUBLIC_SUPABASE_URL is the dashboard address, not the API one. It should look like https://<project-ref>.supabase.co — take the reference out of the dashboard URL you copied.`;
  }
  if (!PROJECT_URL.test(url)) {
    return `EXPO_PUBLIC_SUPABASE_URL should look like https://<project-ref>.supabase.co, but is "${url}".`;
  }
  if (!anonKey.startsWith('eyJ')) {
    return 'EXPO_PUBLIC_SUPABASE_ANON_KEY does not look like a Supabase key — it should be a long string beginning "eyJ".';
  }
  return null;
}

/** Non-null when .env is filled in but wrong. Shown on the sign-in screen. */
export const configError = describeProblem();

/**
 * Null until a Supabase project exists and .env is filled in correctly — the
 * app is expected to run without one. Check `isConfigured` before use.
 */
export const supabase: SupabaseClient | null =
  url && anonKey && !configError
    ? createClient(url, anonKey, {
        auth: {
          storage: sessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          // There is no URL to read a session back from on native.
          detectSessionInUrl: false,
          // The OAuth code is exchanged by hand in AuthProvider after the
          // in-app browser redirects back, which needs PKCE rather than the
          // implicit flow.
          flowType: 'pkce',
        },
      })
    : null;

export const isConfigured = supabase !== null;
