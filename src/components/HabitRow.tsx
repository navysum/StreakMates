import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';
import { StatusDot } from './StatusDot';

type Props = {
  name: string;
  meta?: string;
  metaTone?: 'muted' | 'warn';
  complete: boolean;
  last?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
};

export function HabitRow({ name, meta, metaTone = 'muted', complete, last, onToggle, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.borderDefault, borderBottomWidth: last ? 0 : 1 },
      ]}
    >
      <Pressable
        style={styles.info}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${name}` : undefined}
      >
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
      </Pressable>

      <Pressable
        onPress={onToggle}
        disabled={!onToggle}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: complete }}
        accessibilityLabel={complete ? `Undo ${name}` : `Check in ${name}`}
      >
        <StatusDot complete={complete} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  info: { flex: 1, minWidth: 0, gap: 1, paddingVertical: 6 },
});
