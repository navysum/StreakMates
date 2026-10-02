import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { flushOutbox, useHabits, useRealtime } from '@/lib/queries';
import { toLocalDate } from '@/lib/date';
import { useAuth } from '@/auth/AuthProvider';
import { ensurePermission, syncReminders } from '@/lib/reminders';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { CHROME_MAX_SCALE, labelStyle, type Theme } from '@/theme';

/**
 * Three tabs, as every NavySum app has at most. You — your profile, record and
 * settings — lives behind your monogram in the corner of each tab instead.
 */
const TITLES: Record<string, string> = {
  index: 'Today',
  groups: 'Groups',
  focus: 'Focus',
};

/**
 * The NavySum tab bar: words, no icons. The active tab is ink with a small
 * accent square beneath it (LifeOS: the accent, over a short bar). A hairline
 * above, the page's own paper behind, and every tab at least 48pt tall.
 *
 * The labels stop growing at 1.5× the base size: three words side by side are
 * fixed chrome, and at 200% they would collide rather than wrap. Every screen
 * the bar leads to scales without a cap.
 */
function PaperTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const title = TITLES[route.name] ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CHROME_MAX_SCALE}
                style={[styles.title, focused && styles.titleActive]}
              >
                {title}
              </Text>
              <View style={[styles.mark, focused && styles.markActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();

  // A friend's tick — on a habit or a shared task — shows up without a refresh.
  useRealtime();

  // Anything tapped with no signal in a previous session goes now. Replaying
  // is safe: the unique key makes a check-in that lands twice a no-op.
  const { userId } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    flushOutbox(userId, toLocalDate())
      .then((result) => {
        if (result.sent > 0) qc.invalidateQueries({ queryKey: ['check-ins'] });
      })
      .catch(() => {});
  }, [userId, qc]);

  // Reminders are scheduled on the device, so they follow the habits rather
  // than needing a server or a push token. Failing to schedule is not worth
  // interrupting anyone over — the habits still work.
  const habits = useHabits();
  useEffect(() => {
    if (!habits.data) return;
    let cancelled = false;
    (async () => {
      if (!(await ensurePermission())) return;
      if (cancelled) return;
      await syncReminders(habits.data!);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [habits.data]);

  return (
    <Tabs
      tabBar={(props) => <PaperTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.colors.paper } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="focus" />
    </Tabs>
  );
}

const makeStyles = (t: Theme) => {
  const lifeos = t.family === 'lifeos';
  return StyleSheet.create({
    // Flat paper, as the NavySum tab bar is: the texture stops at the
    // hairline, which is what says the bar is its own strip.
    bar: {
      backgroundColor: t.colors.paper,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.paperEdge,
      paddingTop: 6,
    },
    tabs: { flexDirection: 'row' },
    // At least 48pt tall so each tab is an easy one-handed target.
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
    pressed: { opacity: 0.6 },
    title: lifeos
      ? { fontFamily: t.fonts.uiMedium, fontSize: 13, lineHeight: 18, color: t.colors.inkMuted }
      : { ...labelStyle(t), lineHeight: 15, color: t.colors.inkMuted },
    titleActive: { color: lifeos ? t.colors.seal : t.colors.ink },
    mark: {
      width: lifeos ? 18 : 4,
      height: lifeos ? 3 : 4,
      borderRadius: lifeos ? 2 : 1,
      marginTop: 7,
      backgroundColor: 'transparent',
    },
    markActive: { backgroundColor: t.colors.seal },
  });
};
