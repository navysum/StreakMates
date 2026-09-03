import { Pressable, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

type Props = {
  title?: string;
  action?: string;
  /** Makes the action a real control. Without it the label is plain text. */
  onAction?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/** The portal's flat panel: 1px border, 8px radius, no shadow. */
export function Card({ title, action, onAction, style, children }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
        style,
      ]}
    >
      {title ? (
        <View style={styles.header}>
          <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
          {action ? (
            onAction ? (
              <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
                <Text style={[typography.tabLabel, { color: colors.green }]}>{action}</Text>
              </Pressable>
            ) : (
              <Text style={[typography.tabLabel, { color: colors.textMuted }]}>{action}</Text>
            )
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.card,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  header: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
