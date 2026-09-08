import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, radius, typography } from '@/theme/tokens';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * A row of options inside one bordered track, divided by hairlines. The
 * selected one is a solid accent fill — the same treatment as the primary
 * button, because it is the same statement: this is the live one.
 */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { borderColor: colors.divider }]}>
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.opt,
              i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.divider },
              on && { backgroundColor: colors.accent },
              pressed && !on && styles.pressed,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[typography.action, { color: on ? colors.onAccent : ink(colors, 70) }]}
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
  track: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  opt: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
