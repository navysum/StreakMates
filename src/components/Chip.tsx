import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { feel } from '@/lib/feel';
import { chipSelected, space, type Theme } from '@/theme';

/**
 * A pill with a hairline edge: a day of the week, a group to share with, a
 * reaction.
 *
 * Selected, it takes the accent's wash and edge with a small accent square
 * before the word; LifeOS fills it with the accent instead. The label is ink,
 * not the accent the design system suggests, because the accent on its own
 * wash measures 4.02:1 on Sumi — see `chipSelected`. The square also means
 * the state is never carried by colour alone.
 *
 *   radio      one of several; choosing it is a selection
 *   checkbox   any number of them, like the days of a week
 *   button     a toggle that acts, like a reaction
 */
export function Chip({
  label,
  selected,
  onPress,
  role = 'radio',
  accessibilityLabel,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: 'radio' | 'checkbox' | 'button';
  accessibilityLabel?: string;
  /** For a row of chips that share the width, like the days of a week. */
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const chosen = chipSelected(t);
  const lifeos = t.family === 'lifeos';

  return (
    <Pressable
      onPress={() => {
        if (role !== 'button') feel('select');
        onPress();
      }}
      accessibilityRole={role}
      accessibilityState={role === 'button' ? { selected } : { checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: chosen.fill, borderColor: chosen.edge },
        pressed && styles.pressed,
        style,
      ]}
    >
      {selected && !lifeos ? <View style={styles.mark} /> : null}
      <Text numberOfLines={1} style={[styles.label, selected && { color: chosen.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    chip: {
      minHeight: 44,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      paddingHorizontal: space.md,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: t.colors.paperEdge,
    },
    // The same 4pt square that marks the active tab.
    mark: { width: 4, height: 4, backgroundColor: t.colors.seal },
    label: { fontFamily: t.fonts.uiMedium, fontSize: 14, lineHeight: 20, color: t.colors.inkSoft },
    pressed: { opacity: 0.6 },
  });
