import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { useProfile } from '@/lib/queries';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden — nothing to do */
});

/**
 * What to do with a notification that arrives while the app is open.
 *
 * Without a handler, the default is to show nothing at all — the alert is
 * swallowed on both platforms. That matters most for the focus timer: you can
 * be looking at another tab when a stretch ends, and silence is exactly what
 * the timer exists to prevent. Banner and sound, no badge — a habit tracker
 * has nothing to count on its icon.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/** Sends people to sign-in when signed out, and away from it once signed in. */
function AuthGate() {
  const { colors, scheme } = useTheme();
  const { loading, session, configured, userId } = useAuth();
  const profile = useProfile(userId);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onSignIn = segments[0] === 'sign-in';
    const onUsername = segments[0] === 'username';

    // With no Supabase project yet, sign-in doubles as the setup screen.
    if ((!session || !configured) && !onSignIn) {
      router.replace('/sign-in');
      return;
    }
    if (!session || !configured) return;

    if (onSignIn) {
      router.replace('/');
      return;
    }

    // Everyone needs a handle before anyone else can see them in a group.
    // Wait for the profile so a slow first load doesn't bounce people here.
    if (!profile.isSuccess) return;
    if (!profile.data?.username && !onUsername) router.replace('/username');
    else if (profile.data?.username && onUsername && !router.canGoBack()) router.replace('/');
  }, [
    loading,
    session,
    configured,
    segments,
    router,
    profile.isSuccess,
    profile.data?.username,
  ]);

  // Nothing until the session is known. Rendering the tabs first mounts Today
  // against no session: a flash of an empty "No habits yet" before the redirect
  // to sign-in, and a round of queries that can only come back empty.
  if (loading) return <View style={[styles.blank, { backgroundColor: colors.bg }]} />;

  return (
    <>
      {/* Follows the chosen theme, not the device's, so a forced light or dark
          mode doesn't leave unreadable status-bar text. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="username" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit/[id]" />
        <Stack.Screen name="habit/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="manage" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group/join" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group/settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="group/leaderboard" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({ blank: { flex: 1 } });

export default function RootLayout() {
  // Barlow Condensed carries everything structural; Barlow carries prose.
  // Figures are condensed with tabular numerals rather than a separate mono
  // face, which is why Cascadia Code is gone.
  const [loaded, error] = useFonts({
    'BarlowCondensed-SemiBold': require('../assets/fonts/BarlowCondensed-SemiBold.ttf'),
    'Barlow-Regular': require('../assets/fonts/Barlow-Regular.ttf'),
    'Barlow-SemiBold': require('../assets/fonts/Barlow-SemiBold.ttf'),
  });

  useEffect(() => {
    // Show the app even if a font fails, rather than holding the splash forever.
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
