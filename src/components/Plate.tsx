import { Pressable, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import {
  gradient,
  gradientDirection,
  ink,
  radius,
  space,
  spacing,
  tapPadding,
  tapPaddingX,
  typography,
} from '@/theme/tokens';

type Props = {
  /** The micro-label above the content, uppercase and condensed. */
  label?: string;
  /** Sits opposite the label. Plain text unless onAction makes it a control. */
  action?: string;
  onAction?: () => void;
  /**
   * Marks this as the one object on the screen that matters — the day's
   * progress, the group board, the invite code, the focus timer — with a
   * 2px gradient rule across its top edge.
   *
   * This replaces the `+` registration marks the previous system drew in the
   * corners. Same job, same restraint: it is the brand appearing where an
   * accomplishment lives, and putting it on every card would make it mean
   * nothing. Never more than one per screen.
   */
  feature?: boolean;
  /** Drops the inner padding, for a plate that is only a list of rows. */
  flush?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * A card: a surface fill, a hairline, a soft radius. No shadow, no gloss, no
 * glass — depth is the surface step, never lighting.
 *
 * The fill is the change from the previous system, which drew cards as pure
 * line drawings on the page. The brand palette names a card colour distinct
 * from the page (white on lavender-white in light, #0F1328 on #050611 in
 * dark), and that separation is what lets a dark screen have structure
 * without anything glowing.
 */
export function Plate({ label, action, onAction, feature, flush, style, children }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.plate,
        { backgroundColor: colors.surface, borderColor: colors.divider },
        style,
      ]}
    >
      {feature ? (
        <LinearGradient
          colors={gradient}
          start={gradientDirection.start}
          end={gradientDirection.end}
          style={styles.rule}
          pointerEvents="none"
        />
      ) : null}

      <View style={[styles.inner, flush && styles.flush]}>
        {label || action ? (
          <View style={styles.header}>
            {label ? (
              <Text style={[typography.label, { color: ink(colors, 62) }]}>{label}</Text>
            ) : (
              <View />
            )}
            {action ? (
              onAction ? (
                <Pressable
                  onPress={onAction}
                  accessibilityRole="button"
                  accessibilityLabel={action}
                  // Padding, not hitSlop — see tapPadding. This control
                  // measured 42x14 in a browser before.
                  style={({ pressed }) => [
                    tapPadding(typography.label.lineHeight),
                    tapPaddingX(typography.label.lineHeight),
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[typography.label, { color: colors.meaning.action }]}>{action}</Text>
                </Pressable>
              ) : (
                <Text style={[typography.label, { color: ink(colors, 62) }]}>{action}</Text>
              )
            ) : null}
          </View>
        ) : null}

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  /** Sits inside the clipped corners, so the gradient follows the radius. */
  rule: { height: 2, width: '100%' },
  inner: { padding: spacing.card },
  flush: { paddingVertical: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    marginBottom: space.lg,
  },
  pressed: { opacity: 0.55 },
});
