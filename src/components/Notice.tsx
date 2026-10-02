import { StyleSheet, Text, View } from 'react-native';
import { Label } from './ui';
import { TextAction } from './TextAction';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

/**
 * An aside: a label, then a few plain sentences in the softer ink.
 *
 * No panel and no coloured rule — the accent is kept for what matters most on
 * the screen, and an explanation is not that. An error uses the same shape:
 * plain words for what happened and what to do, and, when there is something
 * to do, the action to do it.
 */
export function Notice({
  label,
  children,
  action,
}: {
  label?: string;
  children: string;
  /** One way forward, like "Try again". */
  action?: { title: string; onPress: () => void };
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.box}>
      {label ? <Label accessibilityRole="header">{label}</Label> : null}
      <Text style={styles.text}>{children}</Text>
      {action ? <TextAction title={action.title} onPress={action.onPress} style={styles.action} /> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    box: { gap: space.sm },
    text: { ...t.type.body, color: t.colors.inkSoft },
    action: { alignSelf: 'flex-start' },
  });
