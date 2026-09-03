import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden — nothing to do */
});

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
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
