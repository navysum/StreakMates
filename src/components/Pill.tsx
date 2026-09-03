import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, typography } from '@/theme/tokens';

export function Pill({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'good' | 'warn' | 'bad' }) {
  const { colors } = useTheme();
  const map = {
    muted: { bg: colors.bgSurfaceMuted, fg: colors.textSecondary },
    good: { bg: colors.greenSoft, fg: colors.green },
    warn: { bg: colors.amberSoft, fg: colors.amber },
    bad: { bg: colors.redSoft, fg: colors.red },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={[typography.label, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
