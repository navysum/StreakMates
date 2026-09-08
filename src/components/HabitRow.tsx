import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, typography } from '@/theme/tokens';
import { WeekStrip } from './WeekStrip';
import { Tick } from './Tick';
import type { Cell } from '@/lib/week';

type Props = {
  name: string;
  meta?: string;
  /** This week, drawn beside the meta line. */
  week?: Cell[];
  complete: boolean;
  last?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
};

/**
 * A habit, with its week beside it and the check divided off into its own
 * column by a hairline. The rule matters: the row body opens the habit and
 * the column only toggles, so the two never fight over a tap.
 *
 * The check is a violet fill, not a violet card — a completed habit marks
 * itself, it does not repaint the row around it.
 */
export function HabitRow({ name, meta, week, complete, last, onToggle, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.divider, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.info, pressed && onPress ? styles.pressed : null]}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${name}` : undefined}
      >
        <Text numberOfLines={1} style={[typography.body, { color: colors.text }]}>
          {name}
        </Text>
        {week || meta ? (
          <View style={styles.under}>
            {week ? <WeekStrip cells={week} /> : null}
            {meta ? (
              <Text numberOfLines={1} style={[typography.caption, styles.meta, { color: ink(colors, 70) }]}>
                {meta}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      <Pressable
        onPress={onToggle}
        disabled={!onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: complete }}
        accessibilityLabel={complete ? `Undo ${name}` : `Check in ${name}`}
        style={({ pressed }) => [
          styles.check,
          { borderLeftColor: colors.divider },
          pressed && styles.pressed,
        ]}
      >
        <Tick checked={complete} size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'stretch' },
  info: { flex: 1, minWidth: 0, gap: space.sm, justifyContent: 'center', paddingVertical: space.lg },
  under: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meta: { flex: 1, minWidth: 0 },
  check: {
    width: 56,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
