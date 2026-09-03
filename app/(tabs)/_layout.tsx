import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon, type TabName } from '@/components/TabIcon';
import { flushOutbox, useHabits, useRealtimeCheckIns } from '@/lib/queries';
import { toLocalDate } from '@/lib/date';
import { useAuth } from '@/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { ensurePermission, syncReminders } from '@/lib/reminders';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

const TABS: { name: string; title: string; icon: TabName }[] = [
  { name: 'index', title: 'Today', icon: 'today' },
  { name: 'groups', title: 'Groups', icon: 'groups' },
  { name: 'activity', title: 'Activity', icon: 'activity' },
  { name: 'you', title: 'You', icon: 'you' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // A friend's tick shows up without a refresh.
  useRealtimeCheckIns();

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
        // MobileNav.css: 72px, 9px labels, active green, hairline top border.
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 7,
          paddingBottom: insets.bottom + 7,
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarLabelStyle: { ...typography.tabLabel, marginTop: 4 },
        tabBarItemStyle: { gap: 0 },
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
