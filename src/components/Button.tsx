import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

/**
 * The primary button is the one solid object on a screen — everything else in
 * this system is a line drawing, which is what makes it read as the thing to
 * press without needing a colour of its own.
 *
 * Ink on the accent fill is the page colour, never white: dark mode's accent
 * is light, and a literal '#fff' would be unreadable there.
 */
export function Button({ label, onPress, variant = 'secondary', disabled, busy, style }: Props) {
  const { colors } = useTheme();

  const tone =
    variant === 'primary'
      ? { bg: colors.accent, border: colors.accent, text: colors.onAccent }
      : variant === 'ghost'
        ? { bg: 'transparent', border: 'transparent', text: ink(colors, 70) }
        : { bg: 'transparent', border: colors.divider, text: colors.text };

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
      {busy ? (
        <ActivityIndicator size="small" color={tone.text} />
      ) : (
        <Text numberOfLines={1} style={[typography.action, { color: tone.text }]}>
          {label}
        </Text>
      )}
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
    borderRadius: radius.none,
  },
  dim: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
