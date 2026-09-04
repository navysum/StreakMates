import { Pressable, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  /** The one line under the title that says what you are looking at. */
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
        { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headRow}>
        <View style={styles.head}>
          <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
          {eyebrow ? (
            <Text style={[typography.body, { color: colors.textSecondary }]}>{eyebrow}</Text>
          ) : null}
        </View>

        {onMenu ? (
          <Pressable
            onPress={onMenu}
            hitSlop={space.sm}
            accessibilityRole="button"
            accessibilityLabel={menuLabel}
            style={({ pressed }) => [
              styles.menu,
              { backgroundColor: pressed ? colors.bgHover : colors.bgSurfaceMuted },
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
    gap: spacing.section,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: -space.xs,
  },
  head: { gap: space.xs, flex: 1, minWidth: 0, paddingTop: space.xs },
  menu: {
    width: hit,
    height: hit,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pip: { width: 4, height: 4, borderRadius: 2 },
});
