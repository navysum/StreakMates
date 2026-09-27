import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Hairline, Label } from './ui';
import { TextAction } from './TextAction';
import { space } from '@/theme';

type Props = {
  /** The small uppercase label that names the section. */
  label?: string;
  /**
   * Sits opposite the label. A text button when `onAction` is given — "See
   * all", "Add" — and otherwise a plain muted word, like "This week".
   */
  action?: string;
  onAction?: () => void;
  /** Read aloud in place of `action`, when the word alone is not enough. */
  actionLabel?: string;
  /**
   * The content is a list of rows. A hairline is drawn above the first one,
   * so the label, the rule and the rows read as one ledger.
   */
  list?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * A section of a screen: a label, and what it names.
 *
 * This replaces the card the app used to draw around everything. NavySum
 * carries hierarchy in type rather than boxes — "prefer a hairline or white
 * space to a card" — so a section has no fill, no border and no corners; the
 * label and the space around it are what hold it together.
 */
export function Section({ label, action, onAction, actionLabel, list, style, children }: Props) {
  return (
    <View style={style}>
      {label || action ? (
        <View style={styles.head}>
          {label ? (
            <Label accessibilityRole="header" style={styles.grow} numberOfLines={1}>
              {label}
            </Label>
          ) : (
            <View style={styles.grow} />
          )}
          {action ? (
            onAction ? (
              <TextAction title={action} onPress={onAction} accessibilityLabel={actionLabel} />
            ) : (
              <Label>{action}</Label>
            )
          ) : null}
        </View>
      ) : null}

      {list ? <Hairline /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.md,
  },
  grow: { flex: 1, minWidth: 0 },
});
