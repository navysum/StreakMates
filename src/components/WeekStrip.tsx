import { StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { WEEKDAY_LABELS } from '@/lib/date';
import type { Cell, CellState } from '@/lib/week';
import type { Theme } from '@/theme';

type Size = 12 | 16 | 20;

/**
 * Seven days, Monday first — the motif the whole app is built on.
 *
 * Two voices, one shape:
 *
 *   ink        the small strip beside a habit, and the group board. Kept days
 *              are ink on the paper, so on a screen of ten habits the only
 *              colour is the seals — NavySum's one accent, where it counts.
 *   calendar   one habit's own history. A kept day is stamped in the accent
 *              and today carries an accent ring, as a NavySum calendar does.
 *
 * In both, a missed day is only an outline and a day that owed nothing — not
 * scheduled, or not yet come — is a small dot. The states differ in shape,
 * not just colour: filled, ringed, outlined, dotted.
 */
export function WeekStrip({
  cells,
  size = 12,
  direction = 'row',
  flex,
  calendar,
}: {
  cells: Cell[];
  size?: Size;
  /** 'column' stacks Monday to Sunday downward, for a grid of weeks. */
  direction?: 'row' | 'column';
  /** Cells share the width instead of taking a fixed size, for the board. */
  flex?: boolean;
  /** Stamp kept days in the accent. */
  calendar?: boolean;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const gap = size === 12 ? 3 : 4;
  const corner = Math.max(2, Math.round(size / 6));

  return (
    <View
      style={[{ flexDirection: direction, gap }, flex && styles.grow]}
      // Decorative beside a row that already says the same in words.
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {cells.map((cell) => (
        <View
          key={cell.date}
          style={[
            flex ? styles.flexCell : { width: size, height: size },
            styles.center,
            { borderRadius: corner },
            fill(cell.state, theme, !!calendar),
          ]}
        >
          {cell.state === 'off' ? <View style={styles.dot} /> : null}
        </View>
      ))}
    </View>
  );
}

function fill(state: CellState, t: Theme, calendar: boolean) {
  const c = t.colors;
  const kept = calendar ? c.seal : c.inkSoft;
  switch (state) {
    case 'done':
      return { backgroundColor: kept, borderColor: kept, borderWidth: 1 };
    case 'today':
      return { borderColor: calendar ? c.seal : c.ink, borderWidth: 1.5 };
    case 'missed':
      return { borderColor: c.inkFaint, borderWidth: 1 };
    case 'off':
      return null;
  }
}

/** The day letters that head a strip, on the same track as its cells. */
export function WeekLabels({ flex, size = 16 }: { flex?: boolean; size?: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[styles.labels, flex && styles.grow]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {WEEKDAY_LABELS.map((letter, i) => (
        <Text key={i} style={[styles.letter, flex ? styles.grow : { width: size }]}>
          {letter}
        </Text>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    grow: { flex: 1 },
    flexCell: { flex: 1, aspectRatio: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: t.colors.inkFaint },
    labels: { flexDirection: 'row', gap: 4 },
    // Tracking hangs off the end of a word, which pushes a single letter off
    // centre; a day letter is centred without it.
    letter: { ...t.type.label, letterSpacing: 0, textAlign: 'center' },
  });
