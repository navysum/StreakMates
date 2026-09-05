import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, typography } from '@/theme/tokens';

type Props = {
  title: string;
  done: boolean;
  /** Marks the task the timer is currently running against. */
  active?: boolean;
  last?: boolean;
  onToggle: () => void;
  onPress?: () => void;
};

export function TaskRow({ title, done, active, last, onToggle, onPress }: Props) {
  const { colors, scheme } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? `Mark ${title} unfinished` : `Finish ${title}`}
        style={({ pressed }) => [styles.check, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.box,
            done
              ? { backgroundColor: colors.green, borderColor: colors.green }
              : { borderColor: colors.borderStrong },
          ]}
        >
          {done ? (
            <Text style={[styles.tick, { color: scheme === 'dark' ? colors.bgPage : '#ffffff' }]}>
              ✓
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Focus on ${title}` : undefined}
        style={({ pressed }) => [styles.text, pressed && onPress ? styles.pressed : null]}
      >
        <Text
          numberOfLines={2}
          style={[
            typography.rowName,
            {
              color: done ? colors.textMuted : colors.textPrimary,
              textDecorationLine: done ? 'line-through' : 'none',
            },
          ]}
        >
          {title}
        </Text>
      </Pressable>

      {active ? (
        <View style={[styles.badge, { backgroundColor: colors.greenSoft }]}>
          <Text style={[typography.label, { color: colors.green }]}>Now</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  check: { width: hit, height: hit, alignItems: 'center', justifyContent: 'center', marginLeft: -space.md },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontFamily: 'DMSans-Bold', fontSize: 13, includeFontPadding: false },
  text: { flex: 1, minWidth: 0, paddingVertical: space.sm },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginLeft: space.sm,
  },
  pressed: { opacity: 0.55 },
});
