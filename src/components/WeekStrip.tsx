import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography, ink } from '@/theme/tokens';
import { WEEKDAY_LABELS } from '@/lib/date';
import type { Cell, CellState } from '@/lib/week';
import type { Palette } from '@/theme/tokens';

type Size = 12 | 16 | 20;

/**
 * Seven days, Monday first — the motif the whole app is built on. A square
 * cell, 1px border, no radius.
 *
 * A missed day is an outline rather than a colour: there is one accent in this
 * system, and spending it on failure would leave nothing to say "kept".
 */
export function WeekStrip({
  cells,
  size = 12,
  direction = 'row',
  flex,
}: {
  cells: Cell[];
  size?: Size;
  /** 'column' stacks Monday to Sunday downward, for a grid of weeks. */
  direction?: 'row' | 'column';
  /** Cells share the width instead of taking a fixed size, for the board. */
  flex?: boolean;
}) {
  const { colors } = useTheme();
  const gap = size === 12 ? 3 : size === 16 ? 5 : 4;

  return (
    <View style={[{ flexDirection: direction, gap }, flex && styles.grow]}>
      {cells.map((cell) => (
        <View
          key={cell.date}
          style={[
            flex ? styles.flexCell : { width: size, height: size },
            styles.cell,
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
      return { backgroundColor: colors.accent, borderColor: colors.accent };
    case 'today':
      return { backgroundColor: 'transparent', borderColor: colors.accent };
    case 'missed':
      return { backgroundColor: 'transparent', borderColor: colors.neutral[400] };
    case 'off':
      return { backgroundColor: colors.accents[100], borderColor: colors.accents[100] };
  }
}

/** The day letters that head a strip, on the same track as its cells. */
export function WeekLabels({ flex }: { flex?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.labels, flex && styles.grow]}>
      {WEEKDAY_LABELS.map((letter, i) => (
        <Text
          key={i}
          style={[
            typography.labelSmall,
            styles.letter,
            flex ? styles.flexLetter : { width: 16 },
            { color: ink(colors, 60) },
          ]}
        >
          {letter}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { borderWidth: 1, borderRadius: radius.none },
  flexCell: { flex: 1, aspectRatio: 1 },
  grow: { flex: 1 },
  labels: { flexDirection: 'row', gap: 5 },
  letter: { textAlign: 'center' },
  flexLetter: { flex: 1 },
});
