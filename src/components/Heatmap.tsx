import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { isScheduled, type Schedule } from '@/lib/streak';

type Props = {
  /** Oldest first, so the grid reads left-to-right like a calendar. */
  days: string[];
  done: Set<string>;
  schedule: Schedule;
  columns?: number;
};

/**
 * Days as small squares: filled when done, faint when it was owed and missed,
 * barely there when nothing was owed. The gaps are the information.
 */
export function Heatmap({ days, done, schedule, columns = 10 }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.grid, { gap: 3 }]}>
      {days.map((day) => {
        const complete = done.has(day);
        const owed = isScheduled(schedule, day);
        return (
          <View
            key={day}
            style={[
              styles.cell,
              { width: `${100 / columns}%` },
              {
                backgroundColor: complete
                  ? colors.green
                  : owed
                    ? colors.greenMuted
                    : colors.neutralChart,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Percentage width minus the gap, so ten fit a row without wrapping early.
  cell: { aspectRatio: 1, borderRadius: 2, maxWidth: 22 },
});
