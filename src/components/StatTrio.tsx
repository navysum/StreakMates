import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, spacing, typography, type Palette } from '@/theme/tokens';

export type Stat = {
  value: string;
  label: string;
  /** Violet, for the app's own emphasis. */
  accent?: boolean;
  /** An explicit colour, which wins over `accent` — normally a streak colour. */
  tone?: string;
};

/**
 * Three figures in one card, divided by hairlines — not three separate cards.
 * Related numbers are framed once.
 */
export function StatTrio({ stats, labelFirst }: { stats: Stat[]; labelFirst?: boolean }) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.divider }]}
    >
      {stats.map((stat, i) => (
        <View
          key={stat.label}
          style={[
            styles.cell,
            i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.divider },
          ]}
        >
          {labelFirst ? (
            <>
              <Text numberOfLines={2} style={[typography.labelSmall, { color: ink(colors, 62) }]}>
                {stat.label}
              </Text>
              <Text style={[typography.stat, { color: toneOf(stat, colors) }]}>{stat.value}</Text>
            </>
          ) : (
            <>
              <Text style={[typography.stat, { color: toneOf(stat, colors) }]}>{stat.value}</Text>
              <Text numberOfLines={2} style={[typography.labelSmall, { color: ink(colors, 62) }]}>
                {stat.label}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

function toneOf(stat: Stat, colors: Palette): string {
  return stat.tone ?? (stat.accent ? colors.accent : colors.text);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  cell: { flex: 1, minWidth: 0, padding: spacing.card, gap: space.sm },
});
