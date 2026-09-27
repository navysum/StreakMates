import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Hairline, Label } from './ui';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { milestoneLabel } from '@/lib/milestone';
import { duration, settle } from '@/lib/motion';
import { space, type Theme } from '@/theme';

/**
 * A run reaching a week, a month, a hundred days, a year.
 *
 * NavySum marks a milestone with one quiet line — no confetti, no badge, no
 * banner. It says what happened in a sentence, between two hairlines, and
 * goes away on its own: a celebration that has to be dismissed is a chore.
 * It can be tapped away sooner, and a screen reader hears it as it arrives.
 */
export function Milestone({
  title,
  days,
  onDone,
}: {
  title: string;
  days: number;
  /** Called when it goes on its own, or when tapped. */
  onDone: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const shown = useRef(new Animated.Value(0)).current;
  const line = `${title}, kept every day it was owed.`;

  // The parent hands over a fresh callback each render. Held in a ref, so the
  // timer and the announcement below run once per milestone rather than
  // restarting every time anything else on Today changes.
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    // A fade, which is not movement, so it stays under Reduce Motion too.
    Animated.timing(shown, {
      toValue: 1,
      duration: duration.enter,
      easing: settle,
      useNativeDriver: true,
    }).start();
    AccessibilityInfo.announceForAccessibility(`${milestoneLabel(days)}. ${line}`);
    // Keyed by the run in the parent, so a second milestone mounts afresh
    // rather than inheriting the remains of the first one's timer.
    const timer = setTimeout(() => done.current(), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity: shown }}>
      <Pressable
        onPress={() => done.current()}
        accessibilityRole="button"
        accessibilityLabel={`${milestoneLabel(days)}. ${line} Dismiss.`}
        style={({ pressed }) => [styles.line, pressed && styles.pressed]}
      >
        <Hairline />
        <Label style={styles.label}>{milestoneLabel(days)}</Label>
        <Text style={styles.text}>{line}</Text>
        <Hairline />
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    line: { gap: space.sm },
    // The one label on the screen that names what this moment is.
    label: { color: t.colors.seal, marginTop: space.sm },
    text: { ...t.type.italicTitle, color: t.colors.inkSoft, marginBottom: space.sm },
    pressed: { opacity: 0.7 },
  });
