import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';

/**
 * The check-in control, from the portal's HabitsCard.css:
 * 18px, filled green when complete, a 2px amber ring when not.
 */
export function StatusDot({ complete }: { complete: boolean }) {
  const { colors } = useTheme();

  if (complete) {
    return (
      <View style={[styles.dot, { backgroundColor: colors.green }]}>
        <Text style={styles.tick}>✓</Text>
      </View>
    );
  }
  return <View style={[styles.dot, styles.ring, { borderColor: colors.amber }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 2, backgroundColor: 'transparent' },
  tick: {
    color: '#ffffff',
    fontFamily: font.monoSemibold,
    fontSize: 10,
    lineHeight: 13,
  },
});
