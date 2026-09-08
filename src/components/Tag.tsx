import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';

export type TagTone = 'outline' | 'accent' | 'progress' | 'social' | 'celebrate';

/**
 * A small label. The tones are the brand's vocabulary, not a palette to pick
 * from by taste — `social` on a shared habit, `celebrate` on a milestone,
 * `progress` on something counting up, `accent` on the app's own state.
 *
 * There is still no destructive tone. "Needs work" is an outline tag, not a
 * red one: nothing in this system says failure in colour, because the colours
 * are all spent saying the opposite.
 *
 * No `alignSelf` here. It carried `flex-start`, which overrode the centring of
 * every row it sat in and hung the tag off the top — visible on the members
 * list, the manage rows and the "Now" badge. Every call site puts a Tag inside
 * a row, so the row's own alignment is the right one to inherit; a column
 * call site should wrap it rather than have the Tag stretch.
 */
export function Tag({ label, variant = 'outline' }: { label: string; variant?: TagTone }) {
  const { colors } = useTheme();

  const tone =
    variant === 'outline'
      ? { fill: 'transparent', line: colors.divider, text: ink(colors, 62) }
      : variant === 'accent'
        ? { fill: colors.accents[100], line: colors.accents[100], text: colors.meaning.action }
        : {
            fill: colors.meaningSoft[variant],
            line: colors.meaningSoft[variant],
            text: colors.meaning[variant],
          };

  return (
    <View style={[styles.tag, { borderColor: tone.line, backgroundColor: tone.fill }]}>
      <Text style={[typography.labelSmall, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
