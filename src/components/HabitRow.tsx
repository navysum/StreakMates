import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';
import { WeekStrip } from './WeekStrip';
import { Stamp } from './Stamp';
import type { Cell } from '@/lib/week';

type Props = {
  name: string;
  /** One short italic line: "12 days in a row", "3 of 4 in today". */
  meta?: string;
  /** This week, drawn beside the meta line. */
  week?: Cell[];
  complete: boolean;
  last?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  /**
   * Long press opens the row's contextual actions. Every one of them is also
   * reachable by tapping through, so this is a shortcut and never the only
   * way — which is the rule for gestures in this app.
   */
  onLongPress?: () => void;
};

/**
 * A habit: its name in the display face, its week and one italic line beneath,
 * and the stamp at the end of the row.
 *
 * The row body opens the habit and the stamp only checks in, so the two never
 * fight over a tap. Completing it stamps the seal down; see Stamp.
 */
export function HabitRow({ name, meta, week, complete, last, onToggle, onPress, onLongPress }: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.body, pressed && (onPress || onLongPress) && styles.pressed]}
        onPress={onPress}
        onLongPress={onLongPress}
        // The default 500ms reads as a lag before anything happens. 350 is
        // past an accidental press and short enough to feel deliberate.
        delayLongPress={350}
        disabled={!onPress && !onLongPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${name}${meta ? `, ${meta}` : ''}` : undefined}
        // Announced by a screen reader, so the shortcut is not sighted-only.
        accessibilityHint={onLongPress ? 'Double tap and hold for options' : undefined}
      >
        <Text numberOfLines={2} style={styles.name}>
          {name}
        </Text>
        {week || meta ? (
          <View style={styles.under}>
            {week ? <WeekStrip cells={week} /> : null}
            {meta ? (
              <Text numberOfLines={1} style={styles.meta}>
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
        accessibilityState={{ checked: complete, disabled: !onToggle }}
        accessibilityLabel={complete ? `${name}, checked in today. Undo` : `Check in ${name}`}
        style={({ pressed }) => [styles.check, pressed && styles.pressedStamp]}
      >
        <Stamp checked={complete} />
      </Pressable>

      {last ? null : <View style={styles.rule} />}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    // Reaches through the page gutter so a pressed row washes edge to edge,
    // while the content and the rule stay on the gutter.
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minHeight: 72,
      marginHorizontal: -space.gutter,
    },
    body: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: space.xs,
      paddingVertical: space.md,
      paddingLeft: space.gutter,
      paddingRight: space.sm,
    },
    name: { ...t.type.row, color: t.colors.ink },
    under: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    meta: { ...t.type.italic, color: t.colors.inkMuted, flex: 1, minWidth: 0 },
    // The stamp's edge lands on the gutter; the target runs out to the screen
    // edge, where a thumb actually is.
    check: {
      width: 72,
      paddingRight: space.gutter,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    pressed: { backgroundColor: t.colors.paperDeep },
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
