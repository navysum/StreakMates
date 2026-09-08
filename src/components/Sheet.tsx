import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, space, typography } from '@/theme/tokens';

export type SheetAction = {
  label: string;
  onPress: () => void;
  /**
   * Kept for the call sites that mark leaving or deleting. Industry has no
   * destructive colour, so this only weights the label — it never turns red.
   */
  tone?: 'default' | 'danger';
  hint?: string;
};

/**
 * A bottom sheet for actions that shouldn't sit under a thumb on the main
 * screen — changing a group's code, leaving it. Tapping outside dismisses.
 *
 * Drawn as a plate: page fill, hairline border, square corners, no shadow.
 */
export function Sheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <View style={styles.dock} pointerEvents="box-none">
        <View style={[styles.sheet, { backgroundColor: colors.bg, borderColor: colors.divider }]}>
          {title ? (
            <Text style={[typography.label, styles.title, { color: ink(colors, 62) }]}>{title}</Text>
          ) : null}

          {actions.map((action, i) => (
            <Pressable
              key={action.label}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                {
                  borderTopColor: colors.divider,
                  borderTopWidth: i === 0 && !title ? 0 : 1,
                  backgroundColor: pressed ? colors.accents[100] : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  action.tone === 'danger' ? typography.bodyStrong : typography.body,
                  { color: colors.text },
                ]}
              >
                {action.label}
              </Text>
              {action.hint ? (
                <Text style={[typography.caption, { color: ink(colors, 70) }]}>{action.hint}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cancel,
            {
              backgroundColor: pressed ? colors.accents[100] : colors.bg,
              borderColor: colors.divider,
              marginBottom: insets.bottom + space.md,
            },
          ]}
        >
          <Text style={[typography.action, { color: colors.text }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dock: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: space.md, gap: space.sm },
  sheet: { borderWidth: 1, borderRadius: radius.none, overflow: 'hidden' },
  title: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.md },
  row: { paddingHorizontal: space.xl, paddingVertical: space.lg, gap: 2, minHeight: 56, justifyContent: 'center' },
  cancel: {
    borderWidth: 1,
    borderRadius: radius.none,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
