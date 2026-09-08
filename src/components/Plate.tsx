import { Pressable, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, ink, radius, space, spacing, typography } from '@/theme/tokens';

type Props = {
  /** The micro-label above the content, uppercase and condensed. */
  label?: string;
  /** Sits opposite the label. Plain text unless onAction makes it a control. */
  action?: string;
  onAction?: () => void;
  /**
   * The four `+` registration marks. Used sparingly — day progress, the group
   * board, the invite code, most improved, the heatmaps, the focus timer.
   * Everything else is a plain bordered box. Never half-apply them.
   */
  marks?: boolean;
  /** Drops the inner padding, for a plate that is only a list of rows. */
  flush?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * A framed object: 1px divider border, no fill, no shadow, no radius.
 *
 * This replaces the old Card wholesale. Industry draws containers as line
 * drawings — the only solid thing on a screen is the primary button — so a
 * background or a shadow here would read as a different system.
 */
export function Plate({ label, action, onAction, marks, flush, style, children }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.plate, { borderColor: colors.divider }, style]}>
      {marks ? <Marks /> : null}

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
                  hitSlop={hit / 3}
                  accessibilityRole="button"
                  accessibilityLabel={action}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={[typography.label, { color: colors.accent }]}>{action}</Text>
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

/**
 * The `+` at each corner, drawn as two crossing hairlines. Sits outside the
 * padding and does not take part in layout, so it cannot push content around.
 */
function Marks() {
  const { colors } = useTheme();
  const tint = { backgroundColor: ink(colors, 40) };
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <View key={corner} pointerEvents="none" style={[styles.mark, styles[corner]]}>
          <View style={[styles.markH, tint]} />
          <View style={[styles.markV, tint]} />
        </View>
      ))}
    </>
  );
}

const MARK = 9;

const styles = StyleSheet.create({
  plate: { borderWidth: 1, borderRadius: radius.none },
  inner: { padding: spacing.card },
  flush: { paddingVertical: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    marginBottom: space.lg,
  },
  mark: {
    position: 'absolute',
    width: MARK,
    height: MARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markH: { position: 'absolute', width: MARK, height: 1 },
  markV: { position: 'absolute', width: 1, height: MARK },
  tl: { top: -1, left: -1 },
  tr: { top: -1, right: -1 },
  bl: { bottom: -1, left: -1 },
  br: { bottom: -1, right: -1 },
  pressed: { opacity: 0.55 },
});
