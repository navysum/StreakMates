import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { HabitRow } from '@/components/HabitRow';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import { isConfigured } from '@/lib/supabase';
import { radius, typography } from '@/theme/tokens';

/**
 * Placeholder rows so Phase 0 can be checked on a real device: they prove the
 * fonts, palette, dark mode and the check-in control all render correctly.
 * Phase 1 replaces them with habits from Supabase.
 */
const SAMPLE = [
  { name: 'Morning run', meta: '5.2 KM · 12 DAY STREAK', complete: true },
  { name: '2 litres of water', meta: '31 DAY STREAK', complete: true },
  { name: 'Read 20 pages', meta: '4 DAY STREAK', complete: false },
  { name: 'No phone after 10pm', meta: 'MISSED YESTERDAY', complete: false, warn: true },
];

const TODAY = new Date().toLocaleDateString('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export default function TodayScreen() {
  const { colors } = useTheme();
  const done = SAMPLE.filter((h) => h.complete).length;

  return (
    <Screen title="Today" eyebrow={`${TODAY} · ${done} of ${SAMPLE.length} done`}>
      <View
        style={[
          styles.banner,
          { backgroundColor: colors.amberSoft, borderColor: colors.amberSoft },
        ]}
      >
        <Text style={[typography.label, { color: colors.amber }]}>Sample data</Text>
        <Text style={[typography.body, styles.bannerBody, { color: colors.textSecondary }]}>
          These habits are placeholders for checking the design on a device. Phase 1 replaces
          them with real ones. Supabase is {isConfigured ? 'connected' : 'not connected yet'}.
        </Text>
      </View>

      <Card title="Private" action="+ Add habit">
        {SAMPLE.map((habit, i) => (
          <HabitRow
            key={habit.name}
            name={habit.name}
            meta={habit.meta}
            metaTone={habit.warn ? 'warn' : 'muted'}
            complete={habit.complete}
            last={i === SAMPLE.length - 1}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 14, borderWidth: 1, borderRadius: radius.card, gap: 6 },
  bannerBody: { lineHeight: 17 },
});
