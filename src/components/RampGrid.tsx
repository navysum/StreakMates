import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Cell } from '@/lib/week';

/**
 * Weeks as columns, days as rows — a season of habit as one picture.
 *
 * A day is shaded by how much was done on it rather than merely whether
 * anything was, so a day you kept five habits reads darker than a day you
 * kept one. Same green family as the week strip, one zoom level out.
 */
export function RampGrid({
  weeks,
  counts,
  cell = 14,
}: {
  weeks: Cell[][];
  /** Check-ins per date. Absent dates are empty days. */
  counts: Map<string, number>;
  cell?: number;
}) {
  const { colors } = useTheme();

  const ramp = [
    colors.neutralChart,
    colors.greenFaint,
    colors.greenMuted,
    colors.greenMid,
    colors.green,
  ];

  // Scaled to the busiest day on screen, so the darkest square always means
  // "your best day here" rather than an arbitrary absolute.
  let busiest = 0;
  for (const n of counts.values()) if (n > busiest) busiest = n;

  return (
    <View style={styles.grid}>
      {weeks.map((week, i) => (
        <View key={i} style={styles.column}>
          {week.map((day) => {
            const n = counts.get(day.date) ?? 0;
            const bucket =
              n === 0 ? 0 : busiest <= 1 ? 4 : Math.min(4, Math.max(1, Math.ceil((n / busiest) * 4)));
            return (
              <View
                key={day.date}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 3,
                  backgroundColor: ramp[bucket],
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 3, justifyContent: 'space-between' },
  column: { gap: 3 },
});
