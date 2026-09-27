import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { format } from '@/lib/pomodoro';
import { NUMERAL_MAX_SCALE } from '@/theme';

/**
 * Each character's slot, as a share of the font size. Measured from the faces
 * rather than guessed: Cormorant Light's digits run 0.33 to 0.49 em wide, and
 * DM Sans Light's 0.30 to 0.68 — its "1" is under half the width of its "0".
 */
const SLOT = { cormorant: 0.52, dmSans: 0.7, colon: 0.28 };

/**
 * The focus timer's clock: big, light, and still.
 *
 * Neither face has figures that are all one width in the version the app
 * loads — DM Sans has no tabular figures at all — so a clock set as one string
 * shuffles sideways every second as a narrow "1" comes and goes. Each
 * character gets a fixed slot instead, which keeps the clock motionless in
 * every theme.
 *
 * Read aloud as a sentence, "24 minutes, 30 seconds left", rather than as
 * five separate characters.
 */
export function Clock({ ms }: { ms: number }) {
  const t = useTheme();
  const { fontScale } = useWindowDimensions();
  const text = format(ms);

  // The glyphs grow with the OS text size up to the numeral cap, so the slots
  // have to grow with them.
  const grow = Math.min(Math.max(fontScale || 1, 1), NUMERAL_MAX_SCALE);
  const size = t.type.clock.fontSize * grow;
  const digit = Math.ceil(size * (t.family === 'lifeos' ? SLOT.dmSans : SLOT.cormorant));
  const colon = Math.ceil(size * SLOT.colon);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={spoken(ms)}
    >
      {[...text].map((ch, i) => (
        <Text
          key={i}
          maxFontSizeMultiplier={NUMERAL_MAX_SCALE}
          style={[t.type.clock, styles.char, { color: t.colors.ink, width: ch === ':' ? colon : digit }]}
        >
          {ch}
        </Text>
      ))}
    </View>
  );
}

function spoken(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const minutes = `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  const seconds = `${s} ${s === 1 ? 'second' : 'seconds'}`;
  if (m === 0) return `${seconds} left`;
  return s === 0 ? `${minutes} left` : `${minutes}, ${seconds} left`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  char: { textAlign: 'center' },
});
