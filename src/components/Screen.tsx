import { Pressable, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  /** Micro-caps, above the title: the context the title sits in. */
  eyebrow?: string;
  /** Sits where the menu would, for a screen that wants its own control. */
  trailing?: React.ReactNode;
  /** Opens a menu for actions that shouldn't sit in the page body. */
  onMenu?: () => void;
  menuLabel?: string;
  /** Pinned below the scroll, for a screen with one obvious action. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

export function Screen({
  title,
  eyebrow,
  trailing,
  onMenu,
  menuLabel = 'More',
  footer,
  children,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fill, { backgroundColor: colors.bgPage }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + space.sm,
            paddingBottom: insets.bottom + (footer ? 96 : space.xxxl),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <View style={styles.head}>
            {eyebrow ? (
              <Text style={[typography.label, { color: colors.textMuted }]}>{eyebrow}</Text>
            ) : null}
            <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>

          {trailing ?? null}

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

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.bgSurface,
              borderTopColor: colors.borderDefault,
              paddingBottom: insets.bottom + space.md,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.page,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
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
