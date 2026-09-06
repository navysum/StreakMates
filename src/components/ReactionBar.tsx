import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';
import { REACTIONS, type ReactionEmoji } from '@/lib/types';

/**
 * Reactions as words, not pictures.
 *
 * Industry is a typographic system with no pictorial vocabulary, so an emoji
 * row reads as a different app. What is *stored* is unchanged — the same five
 * values the check constraint allows — so this is a rendering decision and
 * needs no migration. Change the word, not the column.
 */
const WORD: Record<ReactionEmoji, string> = {
  '🔥': 'FIRE',
  '👏': 'CLAP',
  '💪': 'STRONG',
  '🙌': 'NICE',
  '😂': 'HA',
};

type Props = {
  counts: Map<ReactionEmoji, { count: number; mine: boolean }> | undefined;
  onToggle: (emoji: ReactionEmoji, on: boolean) => void;
};

export function ReactionBar({ counts, onToggle }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  // A chip only appears once somebody has actually used it; the rest live
  // behind + REACT, so a feed row is not a wall of empty counters.
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
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: entry.mine }}
            accessibilityLabel={`${WORD[emoji]} ${entry.count}`}
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: entry.mine ? colors.accent : colors.divider,
                backgroundColor: entry.mine ? colors.accents[100] : 'transparent',
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                typography.labelSmall,
                { color: entry.mine ? colors.accents[700] : ink(colors, 60) },
              ]}
            >
              {WORD[emoji]}
            </Text>
            <Text
              style={[
                typography.labelSmall,
                { color: entry.mine ? colors.accents[700] : ink(colors, 60) },
              ]}
            >
              {entry.count}
            </Text>
          </Pressable>
        );
      })}

      {open ? (
        unused.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => {
              onToggle(emoji, true);
              setOpen(false);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`React ${WORD[emoji]}`}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: colors.divider },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[typography.labelSmall, { color: ink(colors, 60) }]}>{WORD[emoji]}</Text>
          </Pressable>
        ))
      ) : unused.length > 0 ? (
        <Pressable
          onPress={() => setOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add a reaction"
          style={({ pressed }) => [
            styles.chip,
            styles.dashed,
            { borderColor: colors.divider },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[typography.labelSmall, { color: ink(colors, 60) }]}>+ REACT</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  chip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.none,
  },
  dashed: { borderStyle: 'dashed' },
  pressed: { opacity: 0.6 },
});
