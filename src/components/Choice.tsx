import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ink, space, typography } from '@/theme/tokens';
import { Tick } from './Tick';

type Option<T> = { value: T; label: string; hint?: string };

/**
 * A vertical list of options, for when the number of them grows — someone can
 * be in any number of groups. The mark is the same square check used
 * everywhere else.
 */
export function Choice<T extends string | null>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View>
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomColor: colors.divider,
                borderBottomWidth: i === options.length - 1 ? 0 : 1,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.text}>
              <Text numberOfLines={1} style={[typography.body, { color: colors.text }]}>
                {opt.label}
              </Text>
              {opt.hint ? (
                <Text style={[typography.caption, { color: ink(colors, 70) }]}>{opt.hint}</Text>
              ) : null}
            </View>
            <Tick checked={on} size={22} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xl,
    paddingVertical: space.md,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.6 },
});
