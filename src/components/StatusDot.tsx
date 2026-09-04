import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';

type Props = {
  complete: boolean;
  /** 'sm' for the group grid, where the cells are tight. */
  size?: 'sm' | 'md';
};

/**
 * The check-in control.
 *
 * Done is a filled green disc. Not done is an open outline, not a coloured
 * ring: a colour on every unfinished row makes the list shout, and then colour
 * carries no meaning. Green is reserved for what actually happened.
 *
 * The tick flips to near-black in dark mode. The dark green is light enough
 * that white ink on it fails contrast.
 */
export function StatusDot({ complete, size = 'md' }: Props) {
  const { colors, scheme } = useTheme();
  const d = size === 'sm' ? 20 : 28;
  const box = { width: d, height: d, borderRadius: d / 2 };

  if (complete) {
    return (
      <View style={[styles.dot, box, { backgroundColor: colors.green }]}>
        <Text
          style={[
            styles.tick,
            { fontSize: size === 'sm' ? 11 : 14, color: scheme === 'dark' ? colors.bgPage : '#ffffff' },
          ]}
        >
          ✓
        </Text>
      </View>
    );
  }

  return <View style={[styles.dot, box, styles.ring, { borderColor: colors.borderStrong }]} />;
}

const styles = StyleSheet.create({
  dot: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 1.5, backgroundColor: 'transparent' },
  tick: {
    fontFamily: font.bold,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
