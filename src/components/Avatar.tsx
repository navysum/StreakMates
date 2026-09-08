import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font, ink, space, typography } from '@/theme/tokens';

/**
 * Initials on a tinted disc.
 *
 * Orchid, because a face is the most social object in the app and orchid is
 * what social means here. One tint for everyone rather than a colour per
 * member: identity is carried by the letters, and a colour per person would
 * spend the vocabulary on decoration. No images anywhere, so nothing to load
 * or cache.
 */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.meaningSoft.social,
          borderColor: colors.divider,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: font.heading,
          fontSize: Math.max(11, Math.round(size * 0.4)),
          letterSpacing: 0.4,
          color: colors.meaning.social,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A row of faces. Discs sit side by side rather than overlapping. */
export function AvatarRow({
  people,
  size = 30,
  max = 6,
}: {
  people: { id: string; name: string }[];
  size?: number;
  max?: number;
}) {
  const { colors } = useTheme();
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <View style={styles.row}>
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} size={size} />
      ))}
      {rest > 0 ? (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: 'transparent',
              borderColor: colors.divider,
            },
          ]}
        >
          <Text style={[typography.labelSmall, { color: ink(colors, 62) }]}>+{rest}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: space.sm },
});
