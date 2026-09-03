import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

type Option<T> = { value: T; label: string; hint?: string };

/**
 * A vertical list of options. Used instead of a segmented control where the
 * number of choices grows — someone can be in any number of groups.
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
            style={[
              styles.row,
              {
                borderBottomColor: colors.borderDefault,
                borderBottomWidth: i === options.length - 1 ? 0 : 1,
              },
            ]}
          >
            <View style={styles.text}>
              <Text numberOfLines={1} style={[typography.rowName, { color: colors.textPrimary }]}>
                {opt.label}
              </Text>
              {opt.hint ? (
                <Text style={[typography.monoSmall, { color: colors.textMuted }]}>{opt.hint}</Text>
              ) : null}
            </View>
            <View
              style={[
                styles.dot,
                on
                  ? { backgroundColor: colors.green, borderColor: colors.green }
                  : { borderColor: colors.borderStrong },
              ]}
            >
              {on ? <Text style={styles.tick}>✓</Text> : null}
            </View>
          </Pressable>
        );
      })}
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
  text: { flex: 1, minWidth: 0, gap: 1 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: '#fff', fontFamily: 'CascadiaCode-SemiBold', fontSize: 10, lineHeight: 13 },
});
