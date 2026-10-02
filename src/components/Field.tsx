import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Label } from './ui';
import { Row } from './Row';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { PALETTES, space, type Theme } from '@/theme';

type Props = TextInputProps & { label: string };

/**
 * A text field, as NavySum draws one: its label above, then a raised surface
 * with a hairline edge and the theme's corner, 16pt inside. Placeholders are
 * muted and phrased kindly.
 *
 * The edge steps up to the softer ink while the field has focus, so where the
 * typing will go is never in doubt.
 */
export function Field({ label, style, onFocus, onBlur, ...input }: Props) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        // The palette's own muted ink, even on a modal: there the muted ink is
        // stepped up for the deeper ground, and a placeholder that dark reads
        // as something already typed. On the input's own raised surface the
        // palette's value clears AA — see theme/__tests__/contrast.
        placeholderTextColor={PALETTES[t.id].colors.inkMuted}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, style]}
        {...input}
      />
    </View>
  );
}

/** A label and a value on one ruled line: something you read, not type. */
export function FieldRow({
  label,
  children,
  last,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Row last={last} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Label style={styles.rowLabel}>{label}</Label>
      <View style={styles.value}>{children}</View>
    </Row>
  );
}

/** The value half of a FieldRow, when it is plain text. */
export function FieldValue({ children }: { children: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Text numberOfLines={1} style={styles.valueText}>
      {children}
    </Text>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    field: { gap: space.sm },
    // Face and size only: a lineHeight on a single-line TextInput sets the
    // text off-centre on iOS.
    input: {
      fontFamily: t.type.body.fontFamily,
      fontSize: t.type.body.fontSize,
      color: t.colors.ink,
      minHeight: 56,
      padding: space.md,
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: t.colors.paperEdge,
      borderRadius: t.radius.input,
    },
    focused: { borderColor: t.colors.inkSoft },
    rowLabel: { flexShrink: 0 },
    value: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: space.md,
    },
    valueText: { ...t.type.body, color: t.colors.ink, flexShrink: 1, textAlign: 'right' },
  });
