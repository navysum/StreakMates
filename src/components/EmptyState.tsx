import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Card } from './Card';
import { radius, space, typography } from '@/theme/tokens';

type Props = {
  icon: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** One shape for every "there is nothing here yet", so they all look alike. */
export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.wrap}>
        <View style={[styles.badge, { backgroundColor: colors.bgSurfaceMuted }]}>
          <Text style={styles.glyph}>{icon}</Text>
        </View>

        <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[typography.body, styles.body, { color: colors.textSecondary }]}>{body}</Text>

        {actionLabel && onAction ? (
          <Button label={actionLabel} variant="primary" onPress={onAction} style={styles.action} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  glyph: { fontSize: 26, lineHeight: 32 },
  body: { textAlign: 'center', maxWidth: 280 },
  action: { marginTop: space.sm, alignSelf: 'stretch' },
});
