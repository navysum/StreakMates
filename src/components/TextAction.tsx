import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, tapPadding, type Theme } from '@/theme';

/**
 * A text button that takes no more room in the layout than its words.
 *
 *   accent   the NavySum text button: the accent, in the button's type. For a
 *            secondary action beside a section's label — "See all", "Add".
 *   muted    chrome: a label-style word in muted ink. For getting around
 *            rather than doing something — "‹ Back", "Options".
 *
 * The 44pt target comes from padding cancelled by an equal negative margin,
 * not from hitSlop, which react-native-web does not implement: in a browser
 * every text control used to measure exactly the height of its own glyphs.
 */
export function TextAction({
  title,
  onPress,
  tone = 'accent',
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  tone?: 'accent' | 'muted';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(makeStyles);
  const text = tone === 'accent' ? styles.accent : styles.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.target,
        tapPadding(text.lineHeight),
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={text}>{title}</Text>
    </Pressable>
  );
}

/**
 * The NavySum BackBar: "‹ Back" in label style, instead of an icon. Leaves the
 * way it came, or goes home when there is nowhere to go back to — a deep link
 * opened straight onto a pushed screen.
 */
export function BackBar({ label = 'Back', onPress }: { label?: string; onPress?: () => void }) {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  return (
    <TextAction
      title={`‹ ${label}`}
      tone="muted"
      accessibilityLabel={label === 'Back' ? 'Back' : `Back to ${label}`}
      style={styles.start}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
    />
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    target: {
      paddingHorizontal: space.sm,
      marginHorizontal: -space.sm,
      minWidth: 44,
    },
    start: { alignSelf: 'flex-start' },
    accent: { ...t.type.button, color: t.colors.seal },
    muted: t.type.label,
    pressed: { opacity: 0.6 },
  });
