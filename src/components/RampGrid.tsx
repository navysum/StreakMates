import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Cell } from '@/lib/week';

/**
 * Weeks as columns, days as rows, shaded by how much was kept that day — a
 * season of habit as one picture.
 *
 * Five steps of the one accent ramp, no borders. A day you kept five habits
 * reads darker than a day you kept one, which is the only thing this grid is
 * trying to say.
 */
export function RampGrid({
  weeks,
  counts,
  gap = 3,
}: {
  weeks: Cell[][];
  /** Check-ins per date. Absent dates are empty days. */
  counts: Map<string, number>;
  gap?: number;
}) {
  const { colors } = useTheme();

  const ramp = [
    colors.accents[100],
    colors.accents[200],
    colors.accents[400],
    colors.accents[600],
    colors.accent,
  ];

  // Scaled to the busiest day on screen, so the darkest square always means
  // "your best day here" rather than an absolute nobody can see.
  let busiest = 0;
  for (const n of counts.values()) if (n > busiest) busiest = n;

  return (
    <View style={[styles.grid, { gap }]}>
      {weeks.map((week, i) => (
        <View key={i} style={[styles.column, { gap }]}>
          {week.map((day) => {
            const n = counts.get(day.date) ?? 0;
            const step =
              n === 0 ? 0 : busiest <= 1 ? 4 : Math.min(4, Math.max(1, Math.ceil((n / busiest) * 4)));
            return (
              <View key={day.date} style={[styles.cell, { backgroundColor: ramp[step] }]} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row' },
  column: { flex: 1 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 3 },
});
