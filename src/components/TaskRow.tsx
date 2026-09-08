import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';
import { Tag } from './Tag';

type Props = {
  title: string;
  done: boolean;
  /** Marks the task the timer is currently running against. */
  active?: boolean;
  /** "Done by Priya", or "3 of 5 done". */
  meta?: string;
  last?: boolean;
  onToggle: () => void;
  onPress?: () => void;
};

export function TaskRow({ title, done, active, meta, last, onToggle, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        active && { backgroundColor: colors.accents[100] },
        { borderBottomColor: colors.divider, borderBottomWidth: last ? 0 : 1 },
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
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : { borderColor: colors.divider },
          ]}
        >
          {done ? <Text style={[styles.tick, { color: colors.onAccent }]}>✓</Text> : null}
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
            typography.body,
            {
              color: done ? ink(colors, 62) : colors.text,
              textDecorationLine: done ? 'line-through' : 'none',
            },
          ]}
        >
          {title}
        </Text>
        {meta ? (
          <Text numberOfLines={1} style={[typography.caption, { color: ink(colors, 70) }]}>
            {meta}
          </Text>
        ) : null}
      </Pressable>

      {active ? (
        <View style={styles.badge}>
          <Tag label="Now" variant="accent" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  check: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: radius.none,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontFamily: 'BarlowCondensed-SemiBold', fontSize: 14, includeFontPadding: false },
  text: { flex: 1, minWidth: 0, paddingVertical: space.md, gap: 2 },
  badge: { paddingRight: space.lg },
  pressed: { opacity: 0.6 },
});
