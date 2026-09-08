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
  /**
   * Opens the row's actions — rename and delete.
   *
   * Reachable two ways on purpose. Long press is the shortcut, and the "⋯"
   * button is the visible route: unlike a habit, a task has no detail screen,
   * so if this were gesture-only then deleting one would be a capability you
   * could only find by accident.
   */
  onMore?: () => void;
};

export function TaskRow({
  title,
  done,
  active,
  meta,
  last,
  onToggle,
  onPress,
  onMore,
}: Props) {
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
        onLongPress={onMore}
        delayLongPress={350}
        disabled={!onPress && !onMore}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Focus on ${title}` : undefined}
        accessibilityHint={onMore ? 'Double tap and hold for options' : undefined}
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

      {onMore ? (
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${title}`}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
        >
          {/* Three dots drawn rather than typed: the character renders at a
              different weight in each of the app's fonts, and "..." is read
              aloud as "dot dot dot". */}
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, { backgroundColor: ink(colors, 62) }]} />
            ))}
          </View>
        </Pressable>
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
  badge: { paddingRight: space.sm, justifyContent: 'center' },
  more: { width: hit, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  pressed: { opacity: 0.6 },
});
