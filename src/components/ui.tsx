// The NavySum building blocks: Paper, Seal, Label, Hairline, Button and
// HeroText, as the design system ships them. assets/seal.png is StreakMates'
// own stamp (連), drawn by scripts/make-icons.mjs.
//
// Three small additions to the template, each so it holds on every platform
// and at every text size: Button reports its disabled and busy state to screen
// readers and grows with large text rather than clipping it; Label passes
// through Text props, so a section label can be announced as a header.
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { labelStyle, space, type Theme } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const SEAL = require('../../assets/seal.png');

/** Full-bleed page background: tiled paper, or flat colour for themes without texture. */
export function Paper({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  if (!theme.texture) return <View style={[styles.paper, style]}>{children}</View>;
  return (
    <ImageBackground source={theme.texture} resizeMode="repeat" style={[styles.paper, style]} imageStyle={styles.fill}>
      {children}
    </ImageBackground>
  );
}

/** The stamp that marks something complete. */
export function Seal({ size = 40, label = 'Seal', style }: { size?: number; label?: string; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={style} accessibilityLabel={label}>
      <Image source={SEAL} style={[{ width: size, height: size }, theme.sealTint ? { tintColor: theme.sealTint } : null]} />
    </View>
  );
}

/** Small uppercase tracked label above a section. */
export function Label({ children, style, ...text }: { children: ReactNode; style?: StyleProp<TextStyle> } & TextProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Text {...text} style={[styles.label, style]}>
      {children}
    </Text>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.hairline, style]} />;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'ink' | 'outline' | 'text';
  disabled?: boolean;
  loading?: boolean;
  /** When the visible title needs more context to be read aloud. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'ink', disabled, loading, accessibilityLabel, style }: ButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isInk = variant === 'ink';
  const labelColor = isInk ? theme.colors.onButton : variant === 'text' ? theme.colors.seal : theme.colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isInk && styles.buttonInk,
        variant === 'outline' && styles.buttonOutline,
        variant === 'text' && styles.buttonText,
        // Feedback on touch-down, not release: a slight press-in, like a real button.
        pressed && !disabled && styles.pressed,
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={labelColor} /> : <Text style={[styles.buttonLabel, { color: labelColor }]}>{title}</Text>}
    </Pressable>
  );
}

/** Display size scaled for the theme's typeface. */
export function useDisplaySize(size: number) {
  return Math.round(size * useTheme().displayScale);
}

/** The screen's main text, sized to its length: short lines feel monumental, long ones stay readable. */
export function HeroText({ text, source, title }: { text: string; source?: string; title?: string }) {
  const styles = useThemedStyles(makeStyles);
  const len = text.length;
  const size = useDisplaySize(len < 50 ? 38 : len < 120 ? 30 : len < 220 ? 24 : 21);
  return (
    <View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={[styles.hero, { fontSize: size, lineHeight: size * 1.3 }]} maxFontSizeMultiplier={1.4}>
        {text}
      </Text>
      {source ? <Text style={styles.source}>— {source}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const lifeos = t.family === 'lifeos';
  return StyleSheet.create({
    paper: { flex: 1, backgroundColor: t.colors.paper },
    // Without an explicit size the tile is drawn once at 512×512 on web instead of repeating.
    fill: { width: '100%', height: '100%' },
    label: labelStyle(t),
    hairline: { height: StyleSheet.hairlineWidth, backgroundColor: t.colors.inkFaint, opacity: 0.8 },
    // minHeight rather than height, so a label at the largest text size grows the button instead of clipping.
    button: { minHeight: 52, borderRadius: 26, paddingHorizontal: space.xl, paddingVertical: space.xs, alignItems: 'center', justifyContent: 'center' },
    buttonInk: { backgroundColor: t.colors.button },
    buttonOutline: {
      borderWidth: lifeos ? 1 : StyleSheet.hairlineWidth * 2,
      borderColor: lifeos ? t.colors.paperEdge : t.colors.ink,
      backgroundColor: lifeos ? t.colors.surface : 'transparent',
    },
    buttonText: { minHeight: 44, paddingHorizontal: space.sm },
    pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
    buttonLabel: lifeos
      ? { fontFamily: t.fonts.uiMedium, fontSize: 15 }
      : { fontFamily: t.fonts.uiMedium, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase' },
    title: { fontFamily: t.fonts.displayItalic, fontSize: Math.round(20 * t.displayScale), color: t.colors.inkSoft, marginBottom: space.md },
    hero: { fontFamily: t.fonts.display, color: t.colors.ink, letterSpacing: lifeos ? -0.5 : -0.2 },
    source: { marginTop: space.lg, fontFamily: t.fonts.displayItalic, fontSize: lifeos ? 14 : 17, color: t.colors.inkMuted },
  });
};
