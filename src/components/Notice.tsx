import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, typography } from '@/theme/tokens';

type Props = { label?: string; children: string; tone?: 'muted' | 'good' | 'warn' | 'bad' };

export function Notice({ label, children, tone = 'muted' }: Props) {
  const { colors } = useTheme();
  const map = {
    muted: { bg: colors.bgSurfaceMuted, fg: colors.textMuted },
    good: { bg: colors.greenSoft, fg: colors.green },
    warn: { bg: colors.amberSoft, fg: colors.amber },
    bad: { bg: colors.redSoft, fg: colors.red },
  }[tone];

  return (
    <View style={[styles.box, { backgroundColor: map.bg }]}>
      {label ? <Text style={[typography.label, { color: map.fg }]}>{label}</Text> : null}
      <Text style={[typography.body, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.lg, borderRadius: radius.card, gap: space.xs + 2 },
});
