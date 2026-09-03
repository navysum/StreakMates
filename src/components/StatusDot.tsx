import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';

type Props = {
  complete: boolean;
  /** 'sm' for the read-only group grid, where the cells are tight. */
  size?: 'sm' | 'md';
};

/**
 * The check-in control.
 *
 * Complete is a filled green circle with a tick. Incomplete is a neutral ring
 * rather than a coloured one: a colour on every unfinished row makes the whole
 * list shout, and then colour stops carrying any meaning. Green is reserved
 * for the thing that actually happened.
 */
export function StatusDot({ complete, size = 'md' }: Props) {
  const { colors } = useTheme();
  const d = size === 'sm' ? 20 : 26;
  const box = { width: d, height: d, borderRadius: d / 2 };

  if (complete) {
    return (
      <View style={[styles.dot, box, { backgroundColor: colors.green }]}>
        <Text style={[styles.tick, { fontSize: size === 'sm' ? 10 : 13 }]}>✓</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.dot,
        box,
        styles.ring,
        { borderColor: colors.borderStrong, backgroundColor: colors.bgSurfaceMuted },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2 },
  tick: {
    color: '#ffffff',
    fontFamily: font.bold,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
