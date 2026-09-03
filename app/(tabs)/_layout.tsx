import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon, type TabName } from '@/components/TabIcon';
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
