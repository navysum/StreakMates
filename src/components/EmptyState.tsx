import { StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { useThemedStyles } from '@/theme/ThemeProvider';
import { space, type Theme } from '@/theme';

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * One shape for every "nothing here yet": say what will appear, and offer the
 * one action that fills it. No illustration, no icon and never a large zero —
 * this system says it in words.
 */
export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.sm },
    title: { ...t.type.heading, color: t.colors.ink },
    body: { ...t.type.body, color: t.colors.inkSoft },
    action: { marginTop: space.md },
  });
