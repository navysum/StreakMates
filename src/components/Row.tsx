import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

type Props = {
  children: React.ReactNode;
  /** The last row in its list draws no rule beneath it. */
  last?: boolean;
  onPress?: () => void;
  /**
   * A shortcut to the row's options. Every one of them must also be reachable
   * by tapping through — that is the rule for gestures in this app.
   */
  onLongPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  style?: StyleProp<ViewStyle>;
};

/**
 * One row of a ruled list: 16pt of space above and below, a hairline under it,
 * no chevron. A pressed row shifts to `paperDeep`, edge to edge — the row
 * reaches out through the page gutter so the pressed wash does too, while its
 * content and its rule stay on the gutter.
 */
export function Row({
  children,
  last,
  onPress,
  onLongPress,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  style,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const rule = last ? null : <View style={styles.rule} />;

  if (!onPress && !onLongPress) {
    return (
      <View
        style={[styles.row, style]}
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
        {rule}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      // The default 500ms reads as a lag before anything happens. 350 is past
      // an accidental press and short enough to feel deliberate.
      delayLongPress={350}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={
        accessibilityHint ?? (onLongPress ? 'Double tap and hold for options' : undefined)
      }
      accessibilityState={accessibilityState}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {children}
      {rule}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 56,
      paddingVertical: space.md,
      marginHorizontal: -space.gutter,
      paddingHorizontal: space.gutter,
    },
    pressed: { backgroundColor: t.colors.paperDeep },
    rule: {
      position: 'absolute',
      left: space.gutter,
      right: space.gutter,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.inkFaint,
      opacity: 0.8,
    },
  });
