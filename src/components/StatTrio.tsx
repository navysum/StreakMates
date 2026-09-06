import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, spacing, typography } from '@/theme/tokens';

export type Stat = { value: string; label: string; accent?: boolean };

/**
 * Three figures in one bordered box, divided by hairlines — not three separate
 * cards. Industry frames a group of related numbers once.
 */
export function StatTrio({ stats, labelFirst }: { stats: Stat[]; labelFirst?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderColor: colors.divider }]}>
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
              <Text numberOfLines={2} style={[typography.labelSmall, { color: ink(colors, 60) }]}>
                {stat.label}
              </Text>
              <Text style={[typography.stat, { color: stat.accent ? colors.accent : colors.text }]}>
                {stat.value}
              </Text>
            </>
          ) : (
            <>
              <Text style={[typography.stat, { color: stat.accent ? colors.accent : colors.text }]}>
                {stat.value}
              </Text>
              <Text numberOfLines={2} style={[typography.labelSmall, { color: ink(colors, 60) }]}>
                {stat.label}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.none },
  cell: { flex: 1, minWidth: 0, padding: spacing.card, gap: space.sm },
});
