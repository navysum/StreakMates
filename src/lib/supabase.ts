import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Null until a Supabase project exists and .env is filled in — the app is
 * expected to run without one through Phase 0. Check `isConfigured` before use.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
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
