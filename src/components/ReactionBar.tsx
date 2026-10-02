import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from './Chip';
import { space } from '@/theme';
import { REACTIONS, type ReactionEmoji } from '@/lib/types';

/**
 * Reactions as words, not pictures.
 *
 * NavySum has no emoji in its interface, so an emoji row would read as a
 * different app. What is *stored* is unchanged — the same five values the
 * check constraint allows — so this is a rendering decision and needs no
 * migration. Change the word, not the column.
 */
const WORD: Record<ReactionEmoji, string> = {
  '🔥': 'Fire',
  '👏': 'Clap',
  '💪': 'Strong',
  '🙌': 'Nice',
  '😂': 'Ha',
};

type Props = {
  counts: Map<ReactionEmoji, { count: number; mine: boolean }> | undefined;
  onToggle: (emoji: ReactionEmoji, on: boolean) => void;
};

export function ReactionBar({ counts, onToggle }: Props) {
  const [open, setOpen] = useState(false);

  // A chip only appears once somebody has actually used it; the rest live
  // behind "React", so a feed row is not a wall of empty counters.
  const used = REACTIONS.filter((e) => (counts?.get(e)?.count ?? 0) > 0);
  const unused = REACTIONS.filter((e) => !used.includes(e));

  return (
    <View style={styles.row}>
      {used.map((emoji) => {
        const entry = counts!.get(emoji)!;
        return (
          <Chip
            key={emoji}
            role="button"
            label={`${WORD[emoji]} · ${entry.count}`}
            selected={entry.mine}
            accessibilityLabel={`${WORD[emoji]}, ${entry.count}${entry.mine ? ', including yours' : ''}`}
            onPress={() => onToggle(emoji, !entry.mine)}
          />
        );
      })}

      {open
        ? unused.map((emoji) => (
            <Chip
              key={emoji}
              role="button"
              label={WORD[emoji]}
              selected={false}
              accessibilityLabel={`React ${WORD[emoji]}`}
              onPress={() => {
                onToggle(emoji, true);
                setOpen(false);
              }}
            />
          ))
        : unused.length > 0
          ? (
              <Chip
                role="button"
                label="React"
                selected={false}
                accessibilityLabel="Add a reaction"
                onPress={() => setOpen(true)}
              />
            )
          : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
