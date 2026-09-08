import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { duration, useReducedMotion } from '@/lib/motion';
import { radius } from '@/theme/tokens';

type Props = {
  checked: boolean;
  size?: number;
  /** Overrides the fill — a streak colour, where the row knows one. */
  tone?: string;
  style?: ViewStyle;
};

/**
 * The check box, and the one piece of motion in the app.
 *
 * Checking something off is what this app is *for*, and it was the one moment
 * with no feedback at all: the box switched fill between two frames, which on
 * a phone is easy to miss and gives no sense that the tap registered. The mark
 * now scales in from nothing, which says "this just became true" — the only
 * thing motion is here to do.
 *
 * The box itself does not animate. Only the mark inside it moves, so the row's
 * layout is untouched and the whole thing runs on the native driver.
 *
 * Under reduced motion the mark simply appears. Not a shorter animation — the
 * setting means no movement, and honouring it halfway is not honouring it.
 */
export function Tick({ checked, size = 24, tone, style }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const fill = tone ?? colors.accent;

  const scale = useRef(new Animated.Value(checked ? 1 : 0)).current;
  // Skips the animation on the first render, so a list of already-checked
  // habits does not pop on arrival — nothing changed, so nothing should move.
  const mounted = useRef(false);

  useEffect(() => {
    const to = checked ? 1 : 0;
    if (reduced || !mounted.current) {
      mounted.current = true;
      scale.setValue(to);
      return;
    }
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [checked, reduced, scale]);

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size },
        checked ? { backgroundColor: fill, borderColor: fill } : { borderColor: colors.divider },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.mark,
          {
            width: size * 0.46,
            height: size * 0.24,
            borderColor: colors.onAccent,
            transform: [{ rotate: '-45deg' }, { scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * A drawn mark rather than a "✓" glyph. The character rendered at a
   * different weight and baseline in each of the three fonts the app loads,
   * so the tick sat a pixel or two off centre depending on the row; two
   * borders on a rotated box are identical everywhere and scale cleanly.
   */
  mark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    marginTop: -2,
  },
});
