import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography, ink } from '@/theme/tokens';
import { WEEKDAY_LABELS } from '@/lib/date';
import type { Cell, CellState } from '@/lib/week';
import type { Palette } from '@/theme/tokens';

type Size = 12 | 16 | 20;

/**
 * Seven days, Monday first — the motif the whole app is built on.
 *
 * A kept day is violet by default; pass `tone` to colour the week by the
 * streak it belongs to, so a long run reads pink and a new one reads blue.
 *
 * A missed day is an outline, never a colour. Nothing in this system says
 * failure in colour — every hue is spent on the opposite, which is what keeps
 * a gap in the strip feeling like a gap rather than an accusation.
 */
export function WeekStrip({
  cells,
  size = 12,
  direction = 'row',
  flex,
  tone,
}: {
  cells: Cell[];
  size?: Size;
  /** Overrides the colour of a kept day — normally a streak colour. */
  tone?: string;
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
            { borderRadius: Math.max(3, Math.round(size / 3)) },
            fill(cell.state, colors, tone),
          ]}
        />
      ))}
    </View>
  );
}

function fill(state: CellState, colors: Palette, tone?: string) {
  const kept = tone ?? colors.accent;
  switch (state) {
    case 'done':
      return { backgroundColor: kept, borderColor: kept };
    case 'today':
      return { backgroundColor: 'transparent', borderColor: kept };
    case 'missed':
      return { backgroundColor: 'transparent', borderColor: colors.dividerStrong };
    case 'off':
      return { backgroundColor: colors.raised, borderColor: colors.raised };
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
            { color: ink(colors, 62) },
          ]}
        >
          {letter}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { borderWidth: 1 },
  flexCell: { flex: 1, aspectRatio: 1 },
  grow: { flex: 1 },
  labels: { flexDirection: 'row', gap: 5 },
  letter: { textAlign: 'center' },
  flexLetter: { flex: 1 },
});
