import { Pressable, Text, StyleSheet, ActivityIndicator, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { gradientAction, gradientDirection, ink, radius, space, typography } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'gradient' | 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

/**
 * Four weights, and the gap between the first two is the point.
 *
 *   gradient   The brand moment. Sign in, create the first habit, claim a
 *              milestone. One per flow at most — the gradient stops meaning
 *              "this is the thing" the moment a second one appears beside it.
 *   primary    A flat violet fill. The ordinary "do it" button.
 *   secondary  A hairline. Everything that is a real choice but not the one
 *              being recommended.
 *   ghost      Text only. Cancel, back, dismiss.
 *
 * Ink on a solid fill is `onAccent`, never a literal '#fff': light mode's
 * violet takes white at 4.67:1, but dark mode's is light enough that white
 * would fall to 3.92:1, so dark writes midnight on it instead at 5.15:1.
 *
 * The gradient variant draws `gradientAction`, not the brand gradient. The
 * brand sweep ends in soft pink, where white is 1.85:1 — legible at the left
 * of the button and not at the right. `gradientAction` is the same hues held
 * to the darker half of the ramp, where white clears AA at every point.
 */
export function Button({ label, onPress, variant = 'secondary', disabled, busy, style }: Props) {
  const { colors } = useTheme();
  const brandFill = variant === 'gradient';

  const tone = brandFill
    ? { bg: 'transparent', border: 'transparent', text: '#ffffff' }
    : variant === 'primary'
      ? { bg: colors.accent, border: colors.accent, text: colors.onAccent }
      : variant === 'ghost'
        ? { bg: 'transparent', border: 'transparent', text: ink(colors, 70) }
        : { bg: 'transparent', border: colors.dividerStrong, text: colors.text };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy) }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: tone.bg, borderColor: tone.border },
        (disabled || busy) && styles.dim,
        pressed && styles.pressed,
        style,
      ]}
    >
      {brandFill ? (
        <LinearGradient
          colors={gradientAction}
          start={gradientDirection.start}
          end={gradientDirection.end}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

      {/* The fill is absolutely positioned, so the label needs its own layer. */}
      <View style={styles.content} pointerEvents="none">
        {busy ? (
          <ActivityIndicator size="small" color={tone.text} />
        ) : (
          <Text numberOfLines={1} style={[typography.action, { color: tone.text }]}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  content: { alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
