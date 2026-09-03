import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, space, typography } from '@/theme/tokens';

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
  const { colors, scheme } = useTheme();
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
            elevation[scheme],
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
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {action.hint}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cancel,
            elevation[scheme],
            {
              backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
              borderColor: colors.borderDefault,
              marginBottom: insets.bottom + space.md,
            },
          ]}
        >
          <Text style={[typography.action, { color: colors.textPrimary }]}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dock: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: space.md, gap: space.sm },
  sheet: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  title: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.md },
  row: { paddingHorizontal: space.xl, paddingVertical: space.lg, gap: 2, minHeight: 56 },
  cancel: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.lg + 2,
    alignItems: 'center',
  },
});
