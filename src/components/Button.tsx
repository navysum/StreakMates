import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, typography } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'default' | 'danger' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

/**
 * The primary action is a solid fill, not another outline. When every control
 * on a screen is an outlined box, nothing looks like the thing to press.
 *
 * The accent greens differ between themes — dark on light, light on dark — so
 * the text on a filled button flips with them to stay readable.
 */
export function Button({ label, onPress, variant = 'default', disabled, busy, style }: Props) {
  const { colors, scheme } = useTheme();
  const onFill = scheme === 'dark' ? colors.bgPage : '#ffffff';

  const tone =
    variant === 'primary'
      ? { bg: colors.green, border: colors.green, text: onFill }
      : variant === 'danger'
        ? { bg: colors.redSoft, border: colors.redSoft, text: colors.red }
        : variant === 'ghost'
          ? { bg: 'transparent', border: 'transparent', text: colors.textSecondary }
          : { bg: colors.bgSurfaceMuted, border: colors.bgSurfaceMuted, text: colors.textPrimary };

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
    minHeight: hit + 4,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.button,
  },
  dim: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
