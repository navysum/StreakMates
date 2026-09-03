import { Pressable, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  eyebrow?: string;
  /** Opens a menu for actions that shouldn't sit in the page body. */
  onMenu?: () => void;
  menuLabel?: string;
  children?: React.ReactNode;
};

export function Screen({ title, eyebrow, onMenu, menuLabel = 'More', children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgPage }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.headRow}>
        <View style={styles.head}>
          <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
          {eyebrow ? (
            <Text style={[typography.label, styles.eyebrow, { color: colors.textMuted }]}>
              {eyebrow}
            </Text>
          ) : null}
        </View>

        {onMenu ? (
          <Pressable
            onPress={onMenu}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel={menuLabel}
            style={({ pressed }) => [
              styles.menu,
              { borderColor: colors.borderStrong },
              pressed && { backgroundColor: colors.bgHover },
            ]}
          >
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.pip, { backgroundColor: colors.textSecondary }]} />
            ))}
          </Pressable>
        ) : null}
      </View>

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.page,
    gap: spacing.card,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  head: { gap: 3, flex: 1, minWidth: 0 },
  eyebrow: { marginTop: 1 },
  menu: {
    width: 38,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    marginTop: 2,
  },
  pip: { width: 3.5, height: 3.5, borderRadius: 2 },
});
