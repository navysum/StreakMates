import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/**
 * A proportion. Blue by default, because a bar is always progress toward
 * something — pass `tone` to say otherwise (a streak's own colour, a group
 * member's rank).
 *
 * The track is a soft fill rather than an outline: on a dark card an outlined
 * empty bar reads as a stray box, while a filled track reads as a thing with
 * nothing in it yet.
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
        backgroundColor: colors.raised,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radius.pill,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: tone ?? colors.meaning.progress,
        }}
      />
    </View>
  );
}
