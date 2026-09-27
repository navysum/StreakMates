import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { useProfile } from '@/lib/queries';
import { ThemeChoiceProvider } from '@/theme/ThemeChoice';
import { useTheme } from '@/theme/ThemeProvider';
import { WebShell } from '@/components/WebShell';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden — nothing to do */
});

/**
 * What to do with a notification that arrives while the app is open.
 *
 * Without a handler, the default is to show nothing at all — the alert is
 * swallowed on both platforms. That matters most for the focus timer: you can
 * be looking at another tab when a stretch ends, and silence is exactly what
 * the timer exists to prevent. Banner and sound, no badge — NavySum apps have
 * nothing to count on their icon.
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

/**
 * On the web, the page behind the app takes the theme's paper, so an
 * overscroll bounce or the strip under a phone browser's toolbar shows the
 * same ground as the app rather than the default in public/index.html.
 */
function usePageColour(paper: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.style.backgroundColor = paper;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paper);
  }, [paper]);
}

/** Sends people to sign-in when signed out, and away from it once signed in. */
function AuthGate() {
  const t = useTheme();
  const { loading, session, configured, userId } = useAuth();
  const profile = useProfile(userId);
  const segments = useSegments();
  const router = useRouter();

  usePageColour(t.colors.paper);

  // The theme and its faces are in by the time this mounts, so the first
  // frame after the splash is the real one.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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
  if (loading) return <View style={[styles.blank, { backgroundColor: t.colors.paper }]} />;

  return (
    <>
      {/* Follows the chosen theme, not the device's, so a forced light or dark
          theme doesn't leave unreadable status-bar text. */}
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.colors.paper },
          /**
           * Swipe back.
           *
           * Enabled by default on iOS, but only from the very edge of the
           * screen — a target most people never find. `fullScreenGestureEnabled`
           * lets the swipe start anywhere, which is what every native app does.
           *
           * Safe here because nothing in the app scrolls horizontally: the
           * week strips and the group board are grids, not carousels, so
           * there is no sideways gesture for this to fight with. If a
           * horizontal list is ever added, that screen will need to opt out.
           *
           * Android is not covered by this. It has the system back gesture,
           * which already works; `predictiveBackGestureEnabled` stays off in
           * app.json because the predictive animation needs testing on a real
           * device before it is worth the risk of the gesture closing the app.
           *
           * "‹ Back" stays on every screen. The gesture is a shortcut, never
           * the only way out.
           */
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="username" />
        <Stack.Screen name="you" />
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
  // The theme provider restores the chosen theme and loads that family's
  // faces before it renders anything; the splash stays up until then.
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeChoiceProvider>
          <AuthProvider>
            <WebShell>
              <AuthGate />
            </WebShell>
          </AuthProvider>
        </ThemeChoiceProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
