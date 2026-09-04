import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

/**
 * A curated set rather than the whole emoji keyboard: picking from forty
 * relevant icons is faster than searching, and keeps the lists looking
 * consistent. Grouped roughly by what people actually track.
 */
export const HABIT_ICONS = [
  // moving
  '🏃', '🚶', '🏋️', '🚴', '🧘', '🏊', '⚽', '🎾', '🥊', '💪',
  // mind and making
  '📖', '✍️', '🎸', '🎨', '🧠', '💻', '🗣️', '🎧', '📷', '🧩',
  // body and food
  '💧', '🥗', '🍎', '💊', '🦷', '🚿', '🧴', '🌱', '☕', '🍳',
  // rest, home, money, avoiding
  '😴', '🌙', '☀️', '🧹', '💰', '📵', '🚭', '🍺', '🙏', '📓',
] as const;

/** Icons that suit a group rather than a single habit. */
export const GROUP_ICONS = [
  '💪', '🏃', '🧘', '📚', '🎸', '🍳', '💰', '🧠', '🌱', '☕',
  '🔥', '⭐', '🏆', '🎯', '🚀', '⚡', '👑', '🥇', '🧗', '🎧',
  '🐺', '🦁', '🐝', '🦊', '🌊', '⛰️', '🌙', '☀️', '🪴', '🫡',
] as const;

export function IconPicker({
  value,
  onChange,
  icons = HABIT_ICONS,
}: {
  value: string;
  onChange: (emoji: string) => void;
  icons?: readonly string[];
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('')}
        accessibilityRole="button"
        accessibilityLabel="No icon"
        accessibilityState={{ selected: value === '' }}
        style={[
          styles.cell,
          {
            borderColor: value === '' ? colors.green : colors.borderDefault,
            backgroundColor: value === '' ? colors.greenSoft : colors.bgSurface,
          },
        ]}
      >
        <Text style={[typography.monoSmall, { color: colors.textMuted }]}>NONE</Text>
      </Pressable>

      {icons.map((icon) => {
        const on = value === icon;
        return (
          <Pressable
            key={icon}
            onPress={() => onChange(icon)}
            accessibilityRole="button"
            accessibilityLabel={`Icon ${icon}`}
            accessibilityState={{ selected: on }}
            style={[
              styles.cell,
              {
                borderColor: on ? colors.green : colors.borderDefault,
                backgroundColor: on ? colors.greenSoft : colors.bgSurface,
              },
            ]}
          >
            <Text style={styles.glyph}>{icon}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 },
  cell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 22, lineHeight: 28 },
});
