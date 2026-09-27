import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import { Stamp } from './Stamp';
import { Tag } from './Tag';
import { TextAction } from './TextAction';

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
   * Reachable two ways on purpose. Long press is the shortcut, and "Edit" is
   * the visible route: unlike a habit, a task has no detail screen, so if this
   * were gesture-only then deleting one would be a capability you could only
   * find by accident.
   */
  onMore?: () => void;
};

/**
 * A task: the stamp first, as on any list of things to do, then the task.
 * Done tasks stay on the list, struck through, until cleared.
 */
export function TaskRow({ title, done, active, meta, last, onToggle, onPress, onMore }: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.row, active && styles.active]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? `${title}, done. Mark it unfinished` : `Finish ${title}`}
        style={({ pressed }) => [styles.check, pressed && styles.pressedStamp]}
      >
        <Stamp checked={done} size={24} />
      </Pressable>

      <Pressable
        onPress={onPress}
        onLongPress={onMore}
        delayLongPress={350}
        disabled={!onPress && !onMore}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={
          onPress ? (active ? `${title}, the timer is on this. Clear it` : `Focus on ${title}`) : undefined
        }
        accessibilityHint={onMore ? 'Double tap and hold for options' : undefined}
        style={({ pressed }) => [styles.text, pressed && (onPress || onMore) && styles.pressed]}
      >
        <Text numberOfLines={2} style={[styles.title, done && styles.done]}>
          {title}
        </Text>
        {meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        ) : null}
      </Pressable>

      {active ? (
        <View style={styles.now}>
          <Tag label="Now" variant="accent" />
        </View>
      ) : null}

      {onMore ? (
        <View style={styles.more}>
          <TextAction
            title="Edit"
            tone="muted"
            onPress={onMore}
            accessibilityLabel={`Options for ${title}`}
          />
        </View>
      ) : null}

      {last ? null : <View style={styles.rule} />}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minHeight: 60,
      marginHorizontal: -space.gutter,
      paddingRight: space.gutter,
    },
    active: { backgroundColor: t.colors.paperDeep },
    check: {
      width: space.gutter + 24 + space.md,
      paddingLeft: space.gutter,
      justifyContent: 'center',
    },
    // `alignItems: 'stretch'` on the row and `justifyContent: 'center'` here
    // make the label's own target fill the row's height, so it never comes
    // out under 44pt with dead space around it.
    text: { flex: 1, minWidth: 0, justifyContent: 'center', paddingVertical: space.md, gap: 2 },
    title: { ...t.type.row, color: t.colors.ink },
    done: { color: t.colors.inkMuted, textDecorationLine: 'line-through' },
    meta: { ...t.type.italic, color: t.colors.inkMuted },
    now: { justifyContent: 'center', paddingLeft: space.sm },
    more: { justifyContent: 'center', paddingLeft: space.md },
    pressed: { opacity: 0.6 },
    pressedStamp: { opacity: 0.7 },
    rule: {
      position: 'absolute',
      left: space.gutter,
      right: space.gutter,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.inkFaint,
      opacity: 0.8,
    },
  });
