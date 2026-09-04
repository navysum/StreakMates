import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { radius, space, typography } from '@/theme/tokens';

type Props = {
  done: number;
  total: number;
  /** What is being counted, e.g. "Private habits". The date sits in the header. */
  label: string;
  /** Optional extra fact, e.g. a streak. */
  note?: string;
};

/**
 * The one thing the Today screen is about, at a size you can read at a glance
 * from across a table. Everything else on the screen is detail.
 *
 * The bar is one segment per habit while that stays legible, and a single
 * filled track once there are too many for segments to mean anything.
 */
export function DayProgress({ done, total, label, note }: Props) {
  const { colors } = useTheme();
  const complete = total > 0 && done === total;
  const segmented = total > 0 && total <= 10;
  const fraction = total > 0 ? done / total : 0;

  const remaining =
    total === 0
      ? 'Nothing to do yet'
      : complete
        ? 'All done'
        : `${total - done} to go`;

  return (
    <Card>
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>

      <View style={styles.figure}>
        <Text style={[typography.display, { color: colors.textPrimary }]}>{done}</Text>
        <Text style={[typography.sectionTitle, styles.of, { color: colors.textMuted }]}>
          / {total}
        </Text>
        <Text style={[typography.caption, styles.of, { color: colors.textSecondary }]}>
          done today
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.bgSurfaceMuted }]}>
        {segmented ? (
          Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < done ? colors.green : colors.neutralChart },
              ]}
            />
          ))
        ) : (
          <View
            style={[
              styles.fill,
              { width: `${Math.round(fraction * 100)}%`, backgroundColor: colors.green },
            ]}
          />
        )}
      </View>

      <Text style={[typography.caption, { color: complete ? colors.green : colors.textSecondary }]}>
        {note ? `${remaining} · ${note}` : remaining}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  figure: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    marginTop: space.xs,
  },
  of: { marginBottom: 2 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 3,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  segment: { flex: 1, borderRadius: radius.pill },
  fill: { height: '100%', borderRadius: radius.pill },
});
