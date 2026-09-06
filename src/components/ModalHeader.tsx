import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, ink, radius, space, spacing, typography } from '@/theme/tokens';

/**
 * The header on a pushed modal: micro-label above a condensed title, with a
 * 44px square close control — the same square-outline control the app uses for
 * the avatar and overflow buttons, so it reads as one family.
 */
export function ModalHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.md }]}>
      <View style={styles.text}>
        {eyebrow ? (
          <Text style={[typography.label, { color: ink(colors, 60) }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[typography.screenTitle, { color: colors.text }]}>{title}</Text>
      </View>

      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={({ pressed }) => [
          styles.close,
          { borderColor: colors.divider },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[typography.action, { color: ink(colors, 70) }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.page,
    paddingBottom: space.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  text: { gap: space.sm, flex: 1, minWidth: 0 },
  close: {
    width: hit,
    height: hit,
    borderWidth: 1,
    borderRadius: radius.none,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
