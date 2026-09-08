import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, ink, space, typography } from '@/theme/tokens';
import { Tag } from './Tag';
import { Tick } from './Tick';

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
        <Tick checked={done} size={22} />
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
  row: { minHeight: hit + 8, flexDirection: 'row', alignItems: 'stretch' },
  check: { width: 52, alignItems: 'center', justifyContent: 'center' },
  // `alignItems: 'stretch'` on the row plus `justifyContent: 'center'` here
  // makes both halves fill the row's full height. With `center` and a fixed
  // padding the label's own pressable came out 40pt tall — under the minimum,
  // and with dead space either side of it inside a row that looked tappable.
  text: { flex: 1, minWidth: 0, justifyContent: 'center', paddingVertical: space.md, gap: 2 },
  badge: { paddingRight: space.lg, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
