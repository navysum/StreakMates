import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';

/**
 * A square label. Two variants only — accent and outline — because Industry
 * has one accent and no destructive colour. "Needs work" is an outline tag,
 * not a red one.
 *
 * No `alignSelf` here. It carried `flex-start`, which overrode the centring of
 * every row it sat in and hung the tag off the top — visible on the members
 * list, the manage rows and the "Now" badge. Every call site puts a Tag inside
 * a row, so the row's own alignment is the right one to inherit; a column
 * call site should wrap it rather than have the Tag stretch.
 */
export function Tag({
  label,
  variant = 'outline',
}: {
  label: string;
  variant?: 'accent' | 'outline';
}) {
  const { colors } = useTheme();
  const accent = variant === 'accent';

  return (
    <View
      style={[
        styles.tag,
        {
          borderColor: accent ? colors.accent : colors.divider,
          backgroundColor: accent ? colors.accents[100] : 'transparent',
        },
      ]}
    >
      <Text
        style={[typography.labelSmall, { color: accent ? colors.accents[700] : ink(colors, 62) }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radius.none,
  },
});
