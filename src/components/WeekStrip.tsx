import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Cell, CellState } from '@/lib/week';
import { typography, type Palette } from '@/theme/tokens';
import { WEEKDAY_LABELS } from '@/lib/date';

type Size = 11 | 16 | 20;

/**
 * Seven days, Monday first. The one motif the whole app is built on: it is a
 * strip under a habit row, a member's row on the group board, and a column of
 * the twelve-week grid. Learn it once, read it everywhere.
 *
 * A missed day is drawn as an empty outline rather than a filled colour — the
 * gaps are the information, and colouring failure makes a normal week look
 * alarming.
 */
export function WeekStrip({
  cells,
  size = 11,
  direction = 'row',
}: {
  cells: Cell[];
  size?: Size;
  /** 'column' stacks Monday to Sunday downward, for a grid of weeks. */
  direction?: 'row' | 'column';
}) {
  const { colors } = useTheme();
  const gap = size === 11 ? 3 : 4;
  const radius = size === 11 ? 3 : 4;

  return (
    <View style={{ flexDirection: direction, gap }}>
      {cells.map((cell) => (
        <View
          key={cell.date}
          style={[
            { width: size, height: size, borderRadius: radius, borderWidth: 1.5 },
            fill(cell.state, colors),
          ]}
        />
      ))}
    </View>
  );
}

function fill(state: CellState, colors: Palette) {
  switch (state) {
    case 'done':
      return { backgroundColor: colors.green, borderColor: colors.green };
    case 'today':
      return { backgroundColor: colors.bgSurface, borderColor: colors.green };
    case 'missed':
      return { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong };
    case 'off':
      return { backgroundColor: colors.neutralChart, borderColor: colors.neutralChart };
  }
}

/** The day letters that head a strip, on the same track as its cells. */
export function WeekLabels({ size = 16 }: { size?: Size }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { gap: size === 11 ? 3 : 4 }]}>
      {WEEKDAY_LABELS.map((letter, i) => (
        <Text
          key={i}
          style={[typography.label, styles.letter, { width: size, color: colors.textMuted }]}
        >
          {letter}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  letter: { textAlign: 'center' },
});
