import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { feel } from '@/lib/feel';
import { space, type Theme } from '@/theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for a screen reader: "Schedule", "Theme". */
  accessibilityLabel?: string;
};

/**
 * The NavySum segmented control: a pill track in `paperDeep`, and the chosen
 * segment filled like the primary button — the same statement, "this is the
 * live one". Announced as a set of radio options.
 *
 * Unchosen labels are `inkSoft`, not muted: on the deeper track muted ink
 * measures 4.22:1 on Washi, under AA.
 */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={opt.label}
            onPress={() => {
              if (on) return;
              feel('select');
              onChange(opt.value);
            }}
            style={({ pressed }) => [styles.segment, on && styles.on, pressed && !on && styles.pressed]}
          >
            <Text numberOfLines={1} style={[styles.label, on && styles.labelOn]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: t.colors.paperDeep,
      borderRadius: 999,
      padding: space.xs,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
    },
    on: { backgroundColor: t.colors.button },
    pressed: { opacity: 0.6 },
    label: { ...t.type.button, color: t.colors.inkSoft },
    labelOn: { color: t.colors.onButton },
  });
