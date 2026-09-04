import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';
import { REACTIONS, type ReactionEmoji } from '@/lib/types';

type Props = {
  counts: Map<ReactionEmoji, { count: number; mine: boolean }> | undefined;
  onToggle: (emoji: ReactionEmoji, on: boolean) => void;
};

/**
 * Reactions already given, then the rest to add. Showing the used ones first
 * keeps the common case — agreeing with a friend — to one tap.
 */
export function ReactionBar({ counts, onToggle }: Props) {
  const { colors } = useTheme();
  const used = REACTIONS.filter((e) => (counts?.get(e)?.count ?? 0) > 0);
  const unused = REACTIONS.filter((e) => !used.includes(e));

  return (
    <View style={styles.row}>
      {used.map((emoji) => {
        const entry = counts!.get(emoji)!;
        return (
          <Pressable
            key={emoji}
            onPress={() => onToggle(emoji, !entry.mine)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: entry.mine }}
            accessibilityLabel={`${emoji} ${entry.count}`}
            style={[
              styles.chip,
              {
                borderColor: entry.mine ? colors.green : colors.borderDefault,
                backgroundColor: entry.mine ? colors.greenSoft : colors.bgSurface,
              },
            ]}
          >
            <Text style={styles.glyph}>{emoji}</Text>
            <Text
              style={[typography.monoSmall, { color: entry.mine ? colors.green : colors.textMuted }]}
            >
              {entry.count}
            </Text>
          </Pressable>
        );
      })}

      {unused.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onToggle(emoji, true)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`React ${emoji}`}
          style={[styles.chip, styles.faint, { borderColor: colors.borderDefault }]}
        >
          <Text style={styles.glyph}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  faint: { opacity: 0.45 },
  glyph: { fontSize: 16, lineHeight: 20 },
});
