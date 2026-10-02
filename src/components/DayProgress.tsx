import { StyleSheet, Text, View } from 'react-native';
import { Label } from './ui';
import { Bar } from './Bar';
import { Stamp } from './Stamp';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { NUMERAL_MAX_SCALE, space, type Theme } from '@/theme';

type Props = {
  done: number;
  total: number;
  /** What is being counted, e.g. "Private · owed today". */
  label: string;
  /** The one italic sentence beneath. */
  note?: string;
};

/**
 * The one thing the Today screen is about: what is owed today, and how much of
 * it is in. Everything else on the screen is detail.
 *
 * A big light numeral and an italic "of five", a 3pt line beneath, and one
 * sentence. When the last habit owed today is checked in, the day itself is
 * sealed — the stamp comes down beside the count, as it does on each habit.
 *
 * Nothing owed is said in words, never as a large zero.
 */
export function DayProgress({ done, total, label, note }: Props) {
  const styles = useThemedStyles(makeStyles);
  const cleared = total > 0 && done >= total;
  const spoken =
    total === 0
      ? `${label}. ${note ?? 'Nothing is owed today.'}`
      : `${done} of ${total} in. ${note ?? ''}`;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={spoken}>
      <Label>{label}</Label>

      {total > 0 ? (
        <>
          <View style={styles.count}>
            <View style={styles.figures}>
              <Text style={styles.numeral} maxFontSizeMultiplier={NUMERAL_MAX_SCALE}>
                {done}
              </Text>
              <Text style={styles.of}>of {total}</Text>
            </View>
            <Stamp checked={cleared} size={48} outline={false} />
          </View>
          <Bar value={done} max={total} />
        </>
      ) : null}

      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.md },
    count: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    figures: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
    numeral: { ...t.type.numeral, color: t.colors.ink },
    of: { ...t.type.italicTitle, color: t.colors.inkSoft },
    note: { ...t.type.italic, color: t.colors.inkMuted },
  });
