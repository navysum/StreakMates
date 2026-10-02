import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { NUMERAL_MAX_SCALE, space, type Theme } from '@/theme';

export type Stat = {
  value: string;
  /** The one short italic line beneath: "days in a row". */
  label: string;
  /**
   * The accent, for the one figure that is the point of the screen — a
   * current streak. At most one per trio.
   */
  accent?: boolean;
};

/**
 * Three figures side by side, NavySum style: big light numerals in lining
 * figures, each with one short italic line beneath, and no box around them.
 * Each reads as a single sentence to a screen reader: "41, best run".
 */
export function StatTrio({ stats }: { stats: Stat[] }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={styles.cell}
          accessible
          accessibilityLabel={`${stat.value}, ${stat.label}`}
        >
          <Text
            style={[styles.figure, stat.accent && styles.accent]}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={NUMERAL_MAX_SCALE}
          >
            {stat.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: space.md },
    cell: { flex: 1, minWidth: 0, gap: space.xs },
    figure: { ...t.type.figure, color: t.colors.ink },
    accent: { color: t.colors.seal },
    label: { ...t.type.italic, color: t.colors.inkMuted },
  });
