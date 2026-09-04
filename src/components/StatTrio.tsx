import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, space, typography } from '@/theme/tokens';

export type Stat = { value: string; label: string };

/** Three figures across, each a card of its own. Mono keeps them aligned. */
export function StatTrio({ stats }: { stats: Stat[] }) {
  const { colors, scheme } = useTheme();

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[
            styles.tile,
            elevation[scheme],
            { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
          ]}
        >
          <Text style={[typography.stat, { color: colors.textPrimary }]}>{stat.value}</Text>
          <Text numberOfLines={1} style={[typography.label, { color: colors.textMuted }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  tile: {
    flex: 1,
    minWidth: 0,
    padding: space.md,
    gap: space.xs,
    borderRadius: radius.card,
    borderWidth: 1,
  },
});
