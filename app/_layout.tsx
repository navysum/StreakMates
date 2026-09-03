import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden — nothing to do */
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
  const { colors } = useTheme();
  const { loading, session, configured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onSignIn = segments[0] === 'sign-in';

    // With no Supabase project yet, sign-in doubles as the setup screen.
    if ((!session || !configured) && !onSignIn) router.replace('/sign-in');
    else if (session && configured && onSignIn) router.replace('/');
  }, [loading, session, configured, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPage },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="habit/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="manage" options={{ presentation: 'modal' }} />
      <Stack.Screen name="group/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="group/join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="group/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    'CascadiaCode-Regular': require('../assets/fonts/CascadiaCode-Regular.ttf'),
    'CascadiaCode-SemiBold': require('../assets/fonts/CascadiaCode-SemiBold.ttf'),
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
            <StatusBar style="auto" />
            <AuthGate />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
