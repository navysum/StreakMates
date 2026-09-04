import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, spacing, typography } from '@/theme/tokens';

export function ModalHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.md }]}>
      <View style={styles.text}>
        <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        {eyebrow ? (
          <Text style={[typography.body, { color: colors.textSecondary }]}>{eyebrow}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={({ pressed }) => [
          styles.close,
          { backgroundColor: pressed ? colors.bgHover : colors.bgSurfaceMuted },
        ]}
      >
        <Text style={[styles.glyph, { color: colors.textSecondary }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.page,
    paddingBottom: space.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  text: { gap: space.xs, flex: 1, minWidth: 0, paddingTop: space.xs },
  close: {
    width: hit,
    height: hit,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 16, lineHeight: 20 },
});
