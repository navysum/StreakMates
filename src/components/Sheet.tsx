import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

export type SheetAction = {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  hint?: string;
};

/**
 * A bottom sheet for actions that shouldn't sit under a thumb on the main
 * screen — changing a group's code, leaving it. Tapping outside dismisses.
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
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <View style={styles.dock} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
          ]}
        >
          {title ? (
            <Text style={[typography.label, styles.title, { color: colors.textMuted }]}>
              {title}
            </Text>
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
                  borderTopColor: colors.borderDefault,
                  borderTopWidth: i === 0 && !title ? 0 : 1,
                  backgroundColor: pressed ? colors.bgHover : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  typography.rowName,
                  { color: action.tone === 'danger' ? colors.red : colors.textPrimary },
                ]}
              >
                {action.label}
              </Text>
              {action.hint ? (
                <Text style={[typography.monoSmall, { color: colors.textMuted }]}>
                  {action.hint}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={[
            styles.cancel,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderDefault,
              marginBottom: insets.bottom + 10,
            },
          ]}
        >
          <Text style={[typography.rowName, styles.cancelLabel, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dock: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, gap: 8 },
  sheet: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  title: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  row: { paddingHorizontal: 16, paddingVertical: 15, gap: 3 },
  cancel: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: { fontWeight: '600' },
});
