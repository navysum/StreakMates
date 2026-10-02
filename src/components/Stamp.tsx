import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Seal } from './ui';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { duration, settle, useReducedMotion } from '@/lib/motion';
import type { Theme } from '@/theme';

/**
 * The check box, and the one moment of motion in the app.
 *
 * Checking something off is what StreakMates is for, so completing it is the
 * NavySum completion: the seal stamps down — from 1.3 to its own size while it
 * fades in, over 260ms, easing out — and the empty box it lands on goes. Taking
 * it back lifts the seal away quickly, with no flourish.
 *
 * The two states differ in shape as well as colour — an empty square against a
 * filled stamp with 連 cut into it — so the state never rests on colour alone.
 *
 * Under Reduce Motion the seal fades in without the scale: movement becomes a
 * fade, as the design system asks. A list that arrives already stamped does
 * not animate at all, because nothing changed.
 */
export function Stamp({
  checked,
  size = 28,
  outline = true,
}: {
  checked: boolean;
  size?: number;
  /** Draw the empty box it lands on. Off where only the seal means anything. */
  outline?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const reduced = useReducedMotion();
  const shown = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const mounted = useRef(false);

  useEffect(() => {
    const to = checked ? 1 : 0;
    if (!mounted.current) {
      mounted.current = true;
      shown.setValue(to);
      return;
    }
    Animated.timing(shown, {
      toValue: to,
      duration: checked ? duration.stamp : duration.tap,
      easing: settle,
      useNativeDriver: true,
    }).start();
  }, [checked, shown]);

  const scale =
    reduced || !checked ? 1 : shown.interpolate({ inputRange: [0, 1], outputRange: [1.3, 1] });
  const empty = shown.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const corner = Math.round(size * 0.12);

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {outline ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.box, { borderRadius: corner, opacity: empty }]}
        />
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown, transform: [{ scale }] }]}>
        {/* The row around this carries the label; the stamp itself is silent. */}
        <Seal size={size} label="" />
      </Animated.View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    // inkMuted, not a hairline colour: the empty box is the control, and its
    // edge has to clear 3:1 to be found — inkFaint would be 1.9:1.
    box: { borderWidth: 1.5, borderColor: t.colors.inkMuted },
  });
