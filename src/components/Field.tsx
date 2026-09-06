import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, typography } from '@/theme/tokens';

type Props = TextInputProps & { label: string; last?: boolean };

/** A micro-label on the left, the value on the right, a hairline beneath. */
export function Field({ label, last, style, ...input }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.row, { borderBottomColor: colors.divider, borderBottomWidth: last ? 0 : 1 }]}
    >
      <Text style={[typography.label, { color: ink(colors, 60) }]}>{label}</Text>
      <TextInput
        placeholderTextColor={ink(colors, 45)}
        style={[styles.input, typography.body, { color: colors.text }, style]}
        {...input}
      />
    </View>
  );
}

/** A row that shows a value and reacts to a tap, rather than taking typing. */
export function FieldRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.row, { borderBottomColor: colors.divider, borderBottomWidth: last ? 0 : 1 }]}
    >
      <Text style={[typography.label, { color: ink(colors, 60) }]}>{label}</Text>
      <View style={styles.value}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xl,
  },
  input: { flex: 1, textAlign: 'right', paddingVertical: space.md },
  value: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
});
