import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import { initials } from '@/lib/identity';

/**
 * Initials in a ring: a monogram, in the display face.
 *
 * One treatment for everyone rather than a colour per member — identity is
 * carried by the letters, and a colour per person would spend the one accent
 * on decoration. No images anywhere, so nothing to load or cache.
 */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Text
        style={[
          styles.letters,
          // Cormorant sits small on its body; DM Sans runs larger.
          { fontSize: Math.max(11, Math.round(size * (t.family === 'lifeos' ? 0.36 : 0.44))) },
        ]}
        maxFontSizeMultiplier={1}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

/**
 * Your own monogram, as the way to You: your profile, your record and the
 * app's settings. It sits in the corner of each tab, where the tab called You
 * used to be — NavySum apps keep to three tabs.
 */
export function YouButton({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="You: your profile, record and settings"
      style={({ pressed }) => [local.you, pressed && local.pressed]}
    >
      <Avatar name={name} size={40} />
    </Pressable>
  );
}

/** A row of faces. Discs sit side by side rather than overlapping. */
export function AvatarRow({
  people,
  size = 28,
  max = 6,
}: {
  people: { id: string; name: string }[];
  size?: number;
  max?: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <View style={local.row}>
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} size={size} />
      ))}
      {rest > 0 ? <Text style={styles.more}>+{rest}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    disc: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: t.colors.inkFaint,
      backgroundColor: t.colors.surface,
    },
    letters: { fontFamily: t.fonts.display, color: t.colors.inkSoft, letterSpacing: 0.5 },
    more: { ...t.type.label, alignSelf: 'center' },
  });

const local = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.xs, alignItems: 'center' },
  // A 44pt target around a 40pt disc.
  you: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});

/**
 * Re-exported so a call site that already has the Avatar does not need a
 * second import. The function itself lives in lib/identity, beside `handle`,
 * which is what produces most of its input — and, unlike a .tsx file, can be
 * loaded by the test runner.
 */
export { initials };
