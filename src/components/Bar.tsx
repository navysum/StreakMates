import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/**
 * A proportion, as an outlined track with an accent fill. Outlined rather than
 * filled-grey, so an empty bar is still a drawn object and not a smudge.
 */
export function Bar({
  value,
  max,
  height = 8,
  tone,
}: {
  value: number;
  max: number;
  height?: number;
  tone?: string;
}) {
  const { colors } = useTheme();
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <View
      style={{
        height,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radius.none,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          backgroundColor: tone ?? colors.accent,
        }}
      />
    </View>
  );
}
