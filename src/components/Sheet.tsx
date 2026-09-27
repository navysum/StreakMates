import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label } from './ui';
import { DeepTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/motion';
import { space, withAlpha, type Theme } from '@/theme';

export type SheetAction = {
  label: string;
  onPress: () => void;
  /**
   * Marks leaving or deleting. There is no destructive colour in this system,
   * so this weights the label and nothing more — the confirmation that follows
   * carries the warning.
   */
  tone?: 'default' | 'danger';
  hint?: string;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
};

/**
 * A sheet of actions that should not sit under a thumb on the main screen —
 * changing a group's code, leaving it. Tapping outside dismisses it.
 *
 * NavySum sheets are opaque `paperDeep` with hairlines: no shadow, no blur,
 * and square-ish corners from the theme. The whole sheet is drawn in the deep
 * theme, which keeps its muted ink readable on the deeper ground.
 */
export function Sheet(props: Props) {
  const reduced = useReducedMotion();
  return (
    <Modal
      visible={props.visible}
      transparent
      // Under Reduce Motion the sheet fades in rather than sliding.
      animationType={reduced ? 'fade' : 'slide'}
      onRequestClose={props.onClose}
    >
      <DeepTheme>
        <SheetBody {...props} />
      </DeepTheme>
    </Modal>
  );
}

function SheetBody({ title, actions, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fill}>
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.sm }]}>
        {title ? (
          <Label accessibilityRole="header" numberOfLines={1} style={styles.title}>
            {title}
          </Label>
        ) : null}

        {actions.map((action, i) => (
          <Pressable
            key={action.label}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={action.hint ? `${action.label}, ${action.hint}` : action.label}
            style={({ pressed }) => [styles.row, (i > 0 || !!title) && styles.ruled, pressed && styles.pressed]}
          >
            <Text style={action.tone === 'danger' ? styles.danger : styles.label}>{action.label}</Text>
            {action.hint ? <Text style={styles.hint}>{action.hint}</Text> : null}
          </Pressable>
        ))}

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cancel, styles.ruled, pressed && styles.pressed]}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    fill: { flex: 1, justifyContent: 'flex-end' },
    // A dimmed page, not a blurred one: the scrim is the one translucent
    // thing, and only because it is not a surface.
    scrim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.dark ? 'rgba(0, 0, 0, 0.55)' : withAlpha(t.colors.ink, 0.32),
    },
    sheet: {
      backgroundColor: t.colors.paper,
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderColor: t.colors.paperEdge,
      borderTopLeftRadius: t.radius.card,
      borderTopRightRadius: t.radius.card,
    },
    title: { paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.md },
    row: {
      minHeight: 56,
      justifyContent: 'center',
      gap: 2,
      paddingHorizontal: space.gutter,
      paddingVertical: space.md,
    },
    ruled: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.paperEdge },
    pressed: { backgroundColor: t.colors.paperDeep },
    label: { ...t.type.body, color: t.colors.ink },
    danger: { ...t.type.bodyMedium, color: t.colors.ink },
    hint: { ...t.type.italic, color: t.colors.inkMuted },
    cancel: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
    cancelLabel: { ...t.type.button, color: t.colors.inkSoft },
  });
