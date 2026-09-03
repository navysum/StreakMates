import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

export function Screen({ title, eyebrow, children }: Props) {
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
      <View style={styles.head}>
        <Text style={[typography.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        {eyebrow ? (
          <Text style={[typography.label, styles.eyebrow, { color: colors.textMuted }]}>{eyebrow}</Text>
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
  head: { gap: 3 },
  eyebrow: { marginTop: 1 },
});
