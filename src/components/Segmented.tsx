import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { borderColor: colors.borderDefault }]}>
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(opt.value)}
            style={[
              styles.seg,
              i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.borderDefault },
              { backgroundColor: on ? colors.greenSoft : colors.bgSurface },
            ]}
          >
            <Text
              style={[styles.label, { color: on ? colors.green : colors.textMuted }]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.button, overflow: 'hidden' },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  label: { ...typography.rowName, fontWeight: '600', fontSize: 11 },
});
