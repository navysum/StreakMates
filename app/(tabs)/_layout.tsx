import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon, type TabName } from '@/components/TabIcon';
import { flushOutbox, useHabits, useRealtime } from '@/lib/queries';
import { toLocalDate } from '@/lib/date';
import { useAuth } from '@/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { ensurePermission, syncReminders } from '@/lib/reminders';
import { useTheme } from '@/theme/ThemeProvider';
import { border, ink, typography } from '@/theme/tokens';

/**
 * What the bar needs above the safe area: the icon, the gap, the label and the
 * item's own padding, plus slack so the label is never the thing that gives.
 */
const CONTENT = 56;

/**
 * A phone browser reports no bottom inset even with `viewport-fit=cover`, since
 * its address bar is chrome rather than a safe area — `100svh` in
 * public/index.html is what keeps the bar above that. This floor is only so the
 * labels do not sit flush against the very bottom edge.
 */
const BOTTOM = (inset: number) => Math.max(inset, Platform.OS === 'web' ? 10 : 6);

const TABS: { name: string; title: string; icon: TabName }[] = [
  { name: 'index', title: 'Today', icon: 'today' },
  { name: 'groups', title: 'Groups', icon: 'groups' },
  // Activity moved to a card on Today: it is something you read now and then,
  // and a tab slot should be something you use daily.
  { name: 'focus', title: 'Focus', icon: 'focus' },
  { name: 'you', title: 'You', icon: 'you' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
      screenOptions={{
        headerShown: false,
        // Hairline top, page fill, no shadow — the bar is a drawn line, not a
        // raised surface. Active is the accent; inactive is 70% ink.
        tabBarActiveTintColor: colors.meaning.action,
        tabBarInactiveTintColor: ink(colors, 70),
        tabBarStyle: {
          /**
           * The label is a flex child with `flex-shrink: 1` and
           * `overflow: hidden`, so when the bar is even a pixel short of what
           * its contents need, the label — not the icon — absorbs it and
           * silently clips its own text. Measured in a browser: a 13px line
           * squeezed into a 5px box, which is why the words were sliced through
           * the middle.
           *
           * So the bar is sized from its parts with room to spare rather than
           * from a round number: 20 icon + 3 gap + 13 label + 8 item padding is
           * 44, and CONTENT is 56. The slack is the point.
           */
          height: CONTENT + BOTTOM(insets.bottom) + 6,
          paddingTop: 6,
          paddingBottom: BOTTOM(insets.bottom),
          backgroundColor: colors.bg,
          borderTopColor: colors.divider,
          borderTopWidth: border.hairline,
          elevation: 0,
        },
        // flexShrink: 0 is the actual guard. The height above gives it room;
        // this stops it being compressed again by any future change.
        tabBarLabelStyle: {
          ...typography.tabLabel,
          marginTop: 3,
          flexShrink: 0,
          includeFontPadding: false,
        },
        tabBarItemStyle: { gap: 0, paddingVertical: 4 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <TabIcon name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
