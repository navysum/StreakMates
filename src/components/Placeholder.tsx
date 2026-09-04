import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, typography } from '@/theme/tokens';

export function Placeholder({ phase, what }: { phase: string; what: string }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.wrap}>
        <View style={[styles.pill, { backgroundColor: colors.greenSoft }]}>
          <Text style={[typography.label, { color: colors.green }]}>{phase}</Text>
        </View>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{what}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', gap: space.md },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
  },
});
