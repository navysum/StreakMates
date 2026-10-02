import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Hairline } from './ui';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/motion';
import { space, type Theme } from '@/theme';

/**
 * The shape of what is coming, while it comes.
 *
 * A spinner is an apology; a skeleton is a promise. These are drawn at the
 * size of the real content, so nothing jumps when the data lands — first-load
 * layout shift on Today measures 0px.
 *
 * Deliberately plain: a slow pulse between two paper tones, no sweeping
 * highlight. Under Reduce Motion it holds still and stays readable as
 * structure.
 */
function Bone({ width, height = 12, style }: { width: ViewStyle['width']; height?: number; style?: ViewStyle }) {
  const t = useTheme();
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

  // Colour cannot run on the native driver, which is why this animates on the
  // JS thread. It is a placeholder with nothing else happening on screen, so
  // there is nothing to drop frames against.
  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [t.colors.paperDeep, t.colors.paperEdge],
  });

  return <Animated.View style={[{ width, height, backgroundColor, borderRadius: 2 }, style]} />;
}

/** Stands in for the day's progress. */
export function DayProgressSkeleton() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading today" style={styles.day}>
      <Bone width={140} height={11} />
      <Bone width={96} height={56} style={styles.numeral} />
      <Bone width="100%" height={3} />
      <Bone width="68%" height={14} />
    </View>
  );
}

/** Stands in for a list of habit rows, at the height they actually are. */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading your habits">
      <Bone width={80} height={11} style={styles.label} />
      <Hairline />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              {/* Uneven widths: three identical bars read as a table, and the
                  thing being waited for is a list of names. */}
              <Bone width={i === 1 ? '44%' : i === 2 ? '62%' : '54%'} height={18} />
              <Bone width={140} height={12} />
            </View>
            <Bone width={28} height={28} />
          </View>
          {i === rows - 1 ? null : <Hairline />}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (_: Theme) =>
  StyleSheet.create({
    day: { gap: space.md },
    numeral: { marginVertical: space.sm },
    label: { marginBottom: space.md },
    row: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: space.md,
      gap: space.md,
    },
    rowText: { flex: 1, minWidth: 0, gap: space.sm },
  });
