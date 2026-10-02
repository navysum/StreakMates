import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label, Paper } from './ui';
import { BackBar } from './TextAction';
import { KeyboardSafe } from './KeyboardSafe';
import { DeepTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { HERO_MAX_SCALE, space, type Theme } from '@/theme';

type Props = {
  title: string;
  /** The small label above the title: what this is for. */
  eyebrow?: string;
  children?: React.ReactNode;
};

/**
 * A modal: a habit to add, a group to join.
 *
 * NavySum modals are opaque `paperDeep` — the whole subtree is drawn in the
 * deep theme — with the same gutter as a page and a "‹ Back" in label style in
 * place of an icon close button. The header scrolls with the form, so on a
 * small phone the form gets the room.
 */
export function ModalScreen(props: Props) {
  return (
    <DeepTheme>
      <ModalBody {...props} />
    </DeepTheme>
  );
}

function ModalBody({ title, eyebrow, children }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <Paper>
      <KeyboardSafe>
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          // Dragging the form down puts the keyboard away.
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.head}>
            <BackBar />
            <View style={styles.titles}>
              {eyebrow ? <Label>{eyebrow}</Label> : null}
              <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={HERO_MAX_SCALE}>
                {title}
              </Text>
            </View>
          </View>
          {children}
        </ScrollView>
      </KeyboardSafe>
    </Paper>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    body: { paddingHorizontal: space.gutter, gap: space.xl },
    head: { gap: space.md },
    titles: { gap: space.sm },
    title: { ...t.type.title, color: t.colors.ink },
  });
