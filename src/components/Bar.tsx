import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/**
 * A proportion, as a filled track. Used for a group's week and for a standings
 * row, where the bar's length compares people at a glance and the figure beside
 * it gives the exact number.
 */
export function Bar({
  value,
  max,
  height = 6,
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
        borderRadius: radius.pill,
        backgroundColor: colors.neutralChart,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: tone ?? colors.greenMid,
        }}
      />
    </View>
  );
}
