import { Pressable, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { elevation, hit, radius, space, spacing, typography } from '@/theme/tokens';

type Props = {
  title?: string;
  /** Sits under the title, for the one line that explains it. */
  subtitle?: string;
  action?: string;
  /** Makes the action a real control. Without it the label is plain text. */
  onAction?: () => void;
  /** Tightens the gap under the header, for a card that is only a list of rows. */
  flush?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * A raised surface. In light mode a soft shadow separates it from the page; in
 * dark mode a shadow would be invisible, so the surface is lifted above the
 * page colour and outlined instead.
 */
export function Card({ title, subtitle, action, onAction, flush, style, children }: Props) {
  const { colors, scheme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        elevation[scheme],
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderDefault,
          borderWidth: scheme === 'dark' ? 1 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      {title ? (
        <View style={[styles.header, flush && styles.headerFlush]}>
          <View style={styles.headText}>
            <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
            {subtitle ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>

          {action ? (
            onAction ? (
              <Pressable
                onPress={onAction}
                hitSlop={hit / 3}
                accessibilityRole="button"
                accessibilityLabel={action}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={[typography.action, { color: colors.green }]}>{action}</Text>
              </Pressable>
            ) : (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{action}</Text>
            )
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.card,
    borderRadius: radius.card,
  },
  header: {
    marginBottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  headerFlush: { marginBottom: space.sm },
  headText: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.55 },
});
