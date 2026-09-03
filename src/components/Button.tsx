import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'default' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'default', disabled, busy, style }: Props) {
  const { colors } = useTheme();

  const tone =
    variant === 'primary'
      ? { bg: colors.greenSoft, border: colors.green, text: colors.green }
      : variant === 'danger'
        ? { bg: colors.redSoft, border: colors.red, text: colors.red }
        : { bg: colors.bgSurface, border: colors.borderDefault, text: colors.textSecondary };

  return (
    <Pressable
      accessibilityRole="button"
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
        <Text style={[styles.label, { color: tone.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.button,
  },
  label: { ...typography.rowName, fontWeight: '600' },
  dim: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
