import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, space, typography } from '@/theme/tokens';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * A track with a raised thumb, rather than a row of outlined boxes. The
 * selected option is the one that looks like it is sitting on top.
 */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors, scheme } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.bgSurfaceMuted }]}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.seg,
              on && [{ backgroundColor: colors.bgSurface }, elevation[scheme]],
              pressed && !on && styles.pressed,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[typography.action, { color: on ? colors.textPrimary : colors.textMuted }]}
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
  track: {
    flexDirection: 'row',
    borderRadius: radius.button,
    padding: space.xs,
    gap: space.xs,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm + 2,
    borderRadius: radius.chip,
  },
  pressed: { opacity: 0.6 },
});
