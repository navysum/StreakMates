import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Plate } from './Plate';
import { LinearGradient } from 'expo-linear-gradient';
import {
  gradient,
  gradientDirection,
  ink,
  radius,
  sampleGradient,
  space,
  tnum,
  typography,
} from '@/theme/tokens';

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
 *
 * Blue while it is in progress, and the full brand gradient the moment the
 * day is clear — the one place on the Today screen where finishing is worth a
 * brand moment rather than another tick.
 */
export function DayProgress({ done, total, label, note }: Props) {
  const { colors } = useTheme();
  const ticked = total > 0 && total <= 14;
  const fraction = total > 0 ? done / total : 0;
  const cleared = total > 0 && done >= total;
  const tone = colors.meaning.progress;

  return (
    <Plate feature>
      <View style={styles.head}>
        <Text style={[typography.label, { color: ink(colors, 65) }]}>{label}</Text>
        <Text style={[typography.stat, tnum, { color: colors.text }]}>
          {done} / {total}
        </Text>
      </View>

      <View style={styles.ticks}>
        {ticked ? (
          Array.from({ length: total }, (_, i) =>
            cleared ? (
              // Each tick takes its colour from its own position along the
              // gradient, so the row reads as one sweep. Drawing the whole
              // gradient into every tick gave a line of identical little
              // rainbows.
              <View
                key={i}
                style={[
                  styles.tick,
                  styles.tickBrand,
                  {
                    backgroundColor: sampleGradient(
                      gradient,
                      total > 1 ? i / (total - 1) : 1,
                    ),
                  },
                ]}
              />
            ) : (
              <View
                key={i}
                style={[
                  styles.tick,
                  {
                    borderColor: i < done ? tone : colors.dividerStrong,
                    backgroundColor: i < done ? tone : 'transparent',
                  },
                ]}
              />
            )
          )
        ) : (
          <View style={[styles.track, { backgroundColor: colors.raised }]}>
            {cleared ? (
              <LinearGradient
                colors={gradient}
                start={gradientDirection.start}
                end={gradientDirection.end}
                style={styles.fill}
              />
            ) : (
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round(fraction * 100)}%`, backgroundColor: tone },
                ]}
              />
            )}
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
  tick: { flex: 1, height: 10, borderWidth: 1, borderRadius: radius.sm },
  tickBrand: { borderColor: 'transparent' },
  track: { flex: 1, height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', width: '100%', borderRadius: radius.pill },
});
