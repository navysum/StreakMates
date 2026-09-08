import { Pressable, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, ink, radius, space, spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  /** The micro-label above the title: the context the title sits in. */
  label?: string;
  /** A back link above everything, e.g. "‹ GROUPS". */
  back?: { label: string; onPress: () => void };
  /** Sits opposite the title — an avatar, a close control. */
  trailing?: React.ReactNode;
  /** Opens a menu for actions that should not sit in the page body. */
  onMenu?: () => void;
  menuLabel?: string;
  /** Pinned below the scroll, for a screen with one obvious action. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

export function Screen({
  title,
  label,
  back,
  trailing,
  onMenu,
  menuLabel = 'More',
  footer,
  children,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, spacing.top - 24) + space.xxl,
            paddingBottom: insets.bottom + (footer ? 96 : spacing.bottom),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {back ? (
          <Pressable
            onPress={back.onPress}
            hitSlop={space.md}
            accessibilityRole="button"
            accessibilityLabel={back.label}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Text style={[typography.label, { color: colors.accent }]}>‹ {back.label}</Text>
          </Pressable>
        ) : null}

        <View style={styles.headRow}>
          <View style={styles.head}>
            {label ? (
              <Text style={[typography.label, { color: ink(colors, 62) }]}>{label}</Text>
            ) : null}
            <Text style={[typography.screenTitle, { color: colors.text }]}>{title}</Text>
          </View>

          {trailing ?? null}

          {onMenu ? (
            <Pressable
              onPress={onMenu}
              hitSlop={space.md}
              accessibilityRole="button"
              accessibilityLabel={menuLabel}
              style={({ pressed }) => [
                styles.menu,
                { borderColor: colors.divider },
                pressed && styles.pressed,
              ]}
            >
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.pip, { backgroundColor: ink(colors, 70) }]} />
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
              backgroundColor: colors.bg,
              borderTopColor: colors.divider,
              paddingBottom: insets.bottom + space.lg,
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
  content: { paddingHorizontal: spacing.page, gap: spacing.section },
  back: { marginBottom: -space.md },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  head: { gap: space.sm, flex: 1, minWidth: 0 },
  menu: {
    width: hit,
    height: hit,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pip: { width: 3, height: 3, borderRadius: radius.pill },
  footer: {
    paddingHorizontal: spacing.page,
    paddingTop: space.lg,
    borderTopWidth: 1,
  },
  pressed: { opacity: 0.6 },
});
