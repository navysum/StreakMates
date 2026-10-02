import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { feel } from '@/lib/feel';
import type { Theme } from '@/theme';
import { Row } from './Row';

type Option<T> = { value: T; label: string; hint?: string };

/**
 * A ruled list of options, for when there are too many for a segmented control
 * or the options need a line of explanation each — a theme, a group to share
 * with. Announced as radio options.
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
  const styles = useThemedStyles(makeStyles);

  return (
    <View accessibilityRole="radiogroup">
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <Row
            key={String(opt.value)}
            last={i === options.length - 1}
            onPress={() => {
              if (on) return;
              feel('select');
              onChange(opt.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={opt.hint ? `${opt.label}, ${opt.hint}` : opt.label}
          >
            <View style={styles.text}>
              <Text numberOfLines={1} style={styles.label}>
                {opt.label}
              </Text>
              {opt.hint ? <Text style={styles.hint}>{opt.hint}</Text> : null}
            </View>
            <View style={styles.mark}>{on ? <View style={styles.dot} /> : null}</View>
          </Row>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    text: { flex: 1, minWidth: 0, gap: 2 },
    label: { ...t.type.body, color: t.colors.ink },
    hint: { ...t.type.italic, color: t.colors.inkMuted },
    // A square radio, like the seal it echoes: an edge that clears 3:1, and
    // the accent square inside it when chosen.
    mark: {
      width: 20,
      height: 20,
      borderWidth: 1.5,
      borderColor: t.colors.inkMuted,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: { width: 10, height: 10, borderRadius: 1, backgroundColor: t.colors.seal },
  });
