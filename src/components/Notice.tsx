import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, typography } from '@/theme/tokens';

/**
 * An aside, on a 2px accent left rule.
 *
 * A rule rather than a tinted panel. A filled callout would compete with the
 * card it sits inside, and a colour spent on "notice" is a colour not
 * available to say "you kept a streak". The rule carries the same "read this"
 * weight with none of the fill.
 */
export function Notice({ label, children }: { label?: string; children: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.box, { borderLeftColor: colors.accent }]}>
      {label ? (
        <Text style={[typography.label, { color: ink(colors, 62) }]}>{label}</Text>
      ) : null}
      <Text style={[typography.prose, { color: ink(colors, 78) }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderLeftWidth: 2, paddingLeft: space.xl, gap: space.sm },
});
