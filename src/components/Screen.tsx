import { useCallback, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label, Paper } from './ui';
import { BackBar, TextAction } from './TextAction';
import { KeyboardSafe } from './KeyboardSafe';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { HERO_MAX_SCALE, space, type Theme } from '@/theme';

type Props = {
  title: string;
  /** The small label above the title: the context the title sits in. */
  label?: string;
  /** A "‹ Back" above everything. The label names where it goes, if not simply back. */
  back?: { label?: string; onPress?: () => void };
  /** Sits opposite the title — your monogram, on the tabs. */
  trailing?: React.ReactNode;
  /** Opens a sheet of actions that should not sit in the page body. */
  onMenu?: () => void;
  menuLabel?: string;
  /** Pinned below the scroll, for a screen with one obvious action. */
  footer?: React.ReactNode;
  /**
   * Enables pull to refresh. Awaited, so the spinner reflects the real fetch
   * rather than a fixed guess.
   */
  onRefresh?: () => Promise<unknown>;
  children?: React.ReactNode;
};

/**
 * A page: paper, a 28pt gutter, and one idea.
 *
 * The chrome is words — "‹ Back" and "Options" in label style — and the title
 * is set in the display face, sentence case, under a small label that says
 * where you are.
 */
export function Screen({
  title,
  label,
  back,
  trailing,
  onMenu,
  menuLabel = 'Options',
  footer,
  onRefresh,
  children,
}: Props) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Pull to refresh.
   *
   * The one gesture that needs no visible alternative, because it is not an
   * action: the data refetches on its own and this only asks for it sooner.
   *
   * The spinner is held for a beat past the refetch. A refresh that resolves
   * from cache in 20ms otherwise flickers, and a person who pulled and saw
   * nothing happen assumes it did not work and pulls again.
   */
  const refresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    const started = Date.now();
    try {
      await onRefresh();
    } finally {
      const held = Date.now() - started;
      if (held < 400) await new Promise((r) => setTimeout(r, 400 - held));
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <Paper>
      <KeyboardSafe>
        <ScrollView
          style={styles.fill}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                // Drawn by the platform, so it needs telling what it sits on.
                tintColor={t.colors.inkMuted}
                colors={[t.colors.seal]}
                progressBackgroundColor={t.colors.paper}
              />
            ) : undefined
          }
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, space.md) + space.sm,
              // The pinned footer clears the home indicator itself.
              paddingBottom: (footer ? 0 : insets.bottom) + space.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.head}>
            {back || onMenu ? (
              <View style={styles.chrome}>
                {back ? <BackBar label={back.label} onPress={back.onPress} /> : <View />}
                {onMenu ? <TextAction title={menuLabel} tone="muted" onPress={onMenu} /> : null}
              </View>
            ) : null}

            <View style={styles.titleRow}>
              <View style={styles.titles}>
                {label ? <Label>{label}</Label> : null}
                <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={HERO_MAX_SCALE}>
                  {title}
                </Text>
              </View>
              {trailing ?? null}
            </View>
          </View>

          {children}
        </ScrollView>

        {footer ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>{footer}</View>
        ) : null}
      </KeyboardSafe>
    </Paper>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    fill: { flex: 1 },
    content: { paddingHorizontal: space.gutter, gap: space.xl },
    head: { gap: space.md },
    chrome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
    titles: { flex: 1, minWidth: 0, gap: space.sm },
    title: { ...t.type.title, color: t.colors.ink },
    // Flat paper under a hairline, like the tab bar: a strip of its own that
    // the page scrolls beneath.
    footer: {
      backgroundColor: t.colors.paper,
      paddingHorizontal: space.gutter,
      paddingTop: space.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.paperEdge,
    },
  });
