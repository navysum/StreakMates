import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

export function ModalHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 12, borderBottomColor: colors.borderDefault },
      ]}
    >
      <View style={styles.text}>
        <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        {eyebrow ? (
          <Text style={[typography.label, { color: colors.textMuted }]}>{eyebrow}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Text style={[typography.rowName, { color: colors.textMuted }]}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.page,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
  },
  text: { gap: 3, flex: 1 },
});
