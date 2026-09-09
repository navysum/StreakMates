import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { milestoneLabel } from '@/lib/milestone';
import {
  gradient,
  gradientDirection,
  hit,
  ink,
  radius,
  space,
  spacing,
  tnum,
  typography,
} from '@/theme/tokens';

/**
 * A run reaching a week, a month, a year.
 *
 * The brand reserves the full gradient for major accomplishments, and this is
 * the only place in the app that produces one. Everything else that changes
 * colour with a streak does it quietly, through the spectrum; this is the loud
 * version, and it appears a handful of times a year per habit.
 *
 * It goes away on its own. A celebration that has to be dismissed is a task,
 * and handing someone a chore as a reward for a month of consistency is the
 * wrong trade — but it is tappable too, because something that vanishes on a
 * timer must also yield to someone who wants it gone now.
 */
export function Milestone({
  title,
  days,
  onDone,
}: {
  title: string;
  days: number;
  /** Called when it dismisses itself, or when tapped. */
  onDone: () => void;
}) {
  const { colors } = useTheme();

  useEffect(() => {
    // Keyed by the run in the parent, so a second milestone restarts this
    // rather than inheriting the remains of the first one's timer.
    const timer = setTimeout(onDone, 6000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Pressable
      onPress={onDone}
      accessibilityRole="button"
      accessibilityLabel={`${days}-day streak on ${title}. Dismiss.`}
      // The whole thing is the target, and it is far past 44 in both
      // directions, so no extra padding is needed to make it hittable.
      style={({ pressed }) => [
        styles.plate,
        { backgroundColor: colors.surface, borderColor: colors.divider },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={gradientDirection.start}
        end={gradientDirection.end}
        style={styles.rule}
        pointerEvents="none"
      />
      <View style={styles.inner}>
        <Text style={[typography.label, { color: colors.meaning.celebrate }]}>
          {milestoneLabel(days)}
        </Text>
        <View style={styles.row}>
          <Text style={[typography.stat, tnum, { color: colors.meaning.celebrate }]}>{days}</Text>
          <Text numberOfLines={2} style={[typography.body, styles.name, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        <Text style={[typography.caption, { color: ink(colors, 65) }]}>
          Kept every day it was owed.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plate: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', minHeight: hit },
  rule: { height: 2, width: '100%' },
  inner: { padding: spacing.card, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  name: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
});
