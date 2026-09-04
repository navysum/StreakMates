import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';

/**
 * Initials on an accent tint. No images anywhere in the app, so nothing to
 * load, nothing to cache, and a member is recognisable the instant a row
 * renders.
 *
 * The tint is derived from the user's id, so the same person is the same
 * colour on every screen and across everyone's device.
 */
const TINTS = ['blue', 'purple', 'teal', 'green', 'amber', 'coral'] as const;

export function accentFor(id: string, colors: Palette) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const tint = TINTS[hash % TINTS.length];
  const soft = `${tint}Soft` as keyof Palette;
  return { fg: colors[tint], bg: colors[soft] };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  id: string;
  name: string;
  size?: number;
  /** Draws a ring in the card colour, for overlapping stacks. */
  ringed?: boolean;
};

export function Avatar({ id, name, size = 32, ringed }: Props) {
  const { colors } = useTheme();
  const tint = accentFor(id, colors);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor: tint.bg,
          borderWidth: ringed ? 2 : 1,
          borderColor: ringed ? colors.bgSurface : colors.borderDefault,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: Math.max(10, Math.round(size * 0.4)),
          color: tint.fg,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

/** Overlapping faces, for "who is in this group" at a glance. */
export function AvatarStack({
  people,
  size = 28,
  max = 5,
}: {
  people: { id: string; name: string }[];
  size?: number;
  max?: number;
}) {
  const { colors } = useTheme();
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <View style={styles.stack}>
      {shown.map((p) => (
        <View key={p.id} style={{ marginRight: -8 }}>
          <Avatar id={p.id} name={p.name} size={size} ringed />
        </View>
      ))}
      {rest > 0 ? (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: radius.pill,
              backgroundColor: colors.bgSurfaceMuted,
              borderWidth: 2,
              borderColor: colors.bgSurface,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: Math.max(10, Math.round(size * 0.36)),
              color: colors.textMuted,
            }}
          >
            +{rest}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
});
