import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

export function Placeholder({ phase, what }: { phase: string; what: string }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.wrap}>
        <View style={[styles.pill, { backgroundColor: colors.greenSoft }]}>
          <Text style={[typography.label, { color: colors.green }]}>{phase}</Text>
        </View>
        <Text style={[typography.body, styles.body, { color: colors.textSecondary }]}>{what}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', gap: 9, paddingVertical: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  body: { lineHeight: 18 },
});
