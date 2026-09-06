import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Plate } from './Plate';
import { ink, radius, space, tnum, typography } from '@/theme/tokens';

type Props = {
  done: number;
  total: number;
  /** What is being counted, e.g. `PRIVATE · OWED TODAY`. */
  label: string;
  /** The sentence beneath the ticks. */
  note?: string;
};

/**
 * The one thing the Today screen is about: what is owed today and how much of
 * it is in. Everything else on the screen is detail.
 *
 * The ticks are one per habit owed today while that stays legible, and a
 * single filled track once there are too many for individual ticks to mean
 * anything.
 */
export function DayProgress({ done, total, label, note }: Props) {
  const { colors } = useTheme();
  const ticked = total > 0 && total <= 14;
  const fraction = total > 0 ? done / total : 0;

  return (
    <Plate marks>
      <View style={styles.head}>
        <Text style={[typography.label, { color: ink(colors, 65) }]}>{label}</Text>
        <Text style={[typography.stat, tnum, { color: colors.text }]}>
          {done} / {total}
        </Text>
      </View>

      <View style={styles.ticks}>
        {ticked ? (
          Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                {
                  borderColor: colors.accent,
                  backgroundColor: i < done ? colors.accent : 'transparent',
                },
              ]}
            />
          ))
        ) : (
          <View style={[styles.track, { borderColor: colors.accent }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.round(fraction * 100)}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        )}
      </View>

      {note ? <Text style={[typography.prose, { color: ink(colors, 78) }]}>{note}</Text> : null}
    </Plate>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  ticks: { flexDirection: 'row', gap: 4, marginTop: space.lg, marginBottom: space.lg },
  tick: { flex: 1, height: 10, borderWidth: 1, borderRadius: radius.none },
  track: { flex: 1, height: 10, borderWidth: 1, borderRadius: radius.none },
  fill: { height: '100%' },
});
