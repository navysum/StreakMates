import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Plate } from './Plate';
import { ink, space, typography } from '@/theme/tokens';

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * One shape for every "nothing here yet". No illustration and no icon — this
 * system says it in words.
 */
export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  const { colors } = useTheme();

  return (
    <Plate>
      <View style={styles.wrap}>
        <Text style={[typography.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.prose, { color: ink(colors, 78) }]}>{body}</Text>
        {actionLabel && onAction ? (
          <Button label={actionLabel} variant="primary" onPress={onAction} style={styles.action} />
        ) : null}
      </View>
    </Plate>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, paddingVertical: space.sm },
  action: { marginTop: space.md, alignSelf: 'stretch' },
});
