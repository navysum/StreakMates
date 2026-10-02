import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * A proportion, as NavySum draws one: a 3pt track in `paperEdge` with the fill
 * laid over it, and no numbers inside — the figure beside it says the number.
 *
 * The fill is the accent. Pass `tone` where several bars share a screen and
 * only one of them should carry it — your own row on the leaderboard, say —
 * so the rest go to ink.
 */
export function Bar({ value, max, tone }: { value: number; max: number; tone?: string }) {
  const t = useTheme();
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <View
      style={{ height: 3, borderRadius: 1.5, backgroundColor: t.colors.paperEdge, overflow: 'hidden' }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          backgroundColor: tone ?? t.colors.seal,
        }}
      />
    </View>
  );
}
