import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

type Props = TextInputProps & { label: string; last?: boolean };

export function Field({ label, last, style, ...input }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.textPrimary }, style]}
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
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
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
    gap: 12,
  },
  input: { ...typography.rowName, flex: 1, textAlign: 'right', paddingVertical: 10 },
  value: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
});
