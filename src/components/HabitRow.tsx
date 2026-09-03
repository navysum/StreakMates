import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';
import { StatusDot } from './StatusDot';

type Props = {
  name: string;
  meta?: string;
  metaTone?: 'muted' | 'warn';
  complete: boolean;
  last?: boolean;
};

export function HabitRow({ name, meta, metaTone = 'muted', complete, last }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <View style={styles.info}>
        <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
          {name}
        </Text>
        {meta ? (
          <Text
            style={[
              typography.monoSmall,
              { color: metaTone === 'warn' ? colors.amber : colors.textMuted },
            ]}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      <StatusDot complete={complete} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  info: { flex: 1, minWidth: 0, gap: 1 },
});
