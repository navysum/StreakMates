import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, typography } from '@/theme/tokens';
import { StatusDot } from './StatusDot';
import { WeekStrip } from './WeekStrip';
import type { Cell } from '@/lib/week';

type Props = {
  name: string;
  /** Rendered in its own column so names stay aligned down the list. */
  icon?: string | null;
  meta?: string;
  metaTone?: 'muted' | 'warn';
  /** This week, drawn under the name. The motif that repeats app-wide. */
  week?: Cell[];
  complete: boolean;
  last?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
};

export function HabitRow({
  name,
  icon,
  meta,
  metaTone = 'muted',
  week,
  complete,
  last,
  onToggle,
  onPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.info, pressed && onPress ? styles.pressed : null]}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${name}` : undefined}
      >
        {icon ? (
          <View style={[styles.icon, { backgroundColor: colors.bgSurfaceMuted }]}>
            <Text style={styles.iconGlyph}>{icon}</Text>
          </View>
        ) : null}

        <View style={styles.text}>
          <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
            {name}
          </Text>
          {week || meta ? (
            <View style={styles.under}>
              {week ? <WeekStrip cells={week} /> : null}
              {meta ? (
                <Text
                  numberOfLines={1}
                  style={[
                    typography.caption,
                    styles.meta,
                    { color: metaTone === 'warn' ? colors.amber : colors.textMuted },
                  ]}
                >
                  {meta}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onToggle}
        disabled={!onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: complete }}
        accessibilityLabel={complete ? `Undo ${name}` : `Check in ${name}`}
        style={({ pressed }) => [styles.check, pressed && styles.pressed]}
      >
        <StatusDot complete={complete} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 56 rather than 48: with a two-line row (name plus its meta line) this is
  // what keeps the list from feeling cramped.
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  text: { flex: 1, minWidth: 0, gap: 4 },
  under: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { flex: 1, minWidth: 0 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 18, lineHeight: 22 },
  // A 44pt target around a 26pt dot, so it is comfortably tappable.
  check: {
    width: hit,
    height: hit,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space.sm,
  },
  pressed: { opacity: 0.55 },
});
