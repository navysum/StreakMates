import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { duration, useReducedMotion } from '@/lib/motion';
import { radius, space, spacing } from '@/theme/tokens';

/**
 * The shape of what is coming, while it comes.
 *
 * Today used to hide its progress card entirely and put a centred spinner
 * where the list goes. Two things were wrong with that: the screen said
 * nothing about what was loading, and everything jumped a few hundred pixels
 * when the data landed. A spinner is an apology; a skeleton is a promise.
 *
 * Deliberately plain — a slow pulse between two neutral surface steps, no
 * sweeping highlight. A shimmer racing across the screen is decoration on a
 * wait, and under reduced motion it holds still and stays perfectly readable
 * as structure.
 */
function Bone({ width, height = 12, style }: { width: ViewStyle['width']; height?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  // Colour cannot run on the native driver, which is why this is one of the
  // two places in the app that animates on the JS thread. It is a placeholder
  // with nothing else happening on screen, so there is nothing to drop frames
  // against.
  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.raised, colors.neutral[400]],
  });

  return <Animated.View style={[{ width, height, backgroundColor, borderRadius: radius.sm }, style]} />;
}

/** Stands in for the day's progress card. */
export function DayProgressSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading today"
      style={[styles.plate, { backgroundColor: colors.surface, borderColor: colors.divider }]}
    >
      <View style={styles.head}>
        <Bone width={130} height={11} />
        <Bone width={54} height={22} />
      </View>
      <Bone width="100%" height={10} style={{ borderRadius: radius.pill }} />
      <Bone width="72%" height={12} />
    </View>
  );
}

/** Stands in for a list of habit rows, at the height they actually are. */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading your habits"
      style={[styles.plate, styles.flush, { backgroundColor: colors.surface, borderColor: colors.divider }]}
    >
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[
            styles.row,
            {
              borderBottomColor: colors.divider,
              borderBottomWidth: i === rows - 1 ? 0 : 1,
            },
          ]}
        >
          <View style={styles.rowText}>
            {/* Uneven widths: three identical bars read as a table, and the
                thing being waited for is a list of names. */}
            <Bone width={i === 1 ? '44%' : i === 2 ? '62%' : '54%'} height={14} />
            <Bone width={92} height={10} />
          </View>
          <Bone width={24} height={24} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.card, gap: space.lg },
  flush: { padding: 0, gap: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.card,
    paddingVertical: space.lg,
    gap: space.lg,
  },
  rowText: { flex: 1, minWidth: 0, gap: space.sm },
});
