import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';

/**
 * A square label. Two variants only — accent and outline — because Industry
 * has one accent and no destructive colour. "Needs work" is an outline tag,
 * not a red one.
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
        style={[typography.labelSmall, { color: accent ? colors.accents[700] : ink(colors, 60) }]}
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
    alignSelf: 'flex-start',
  },
});
