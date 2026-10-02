// The NavySum ThemeProvider. Pass the person's saved choice (family + mode) —
// ThemeChoice.tsx keeps it — and "system" follows the phone's light/dark
// setting.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  DEEP_THEMES,
  resolveTheme,
  THEMES,
  type Theme,
  type ThemeFamily,
  type ThemeMode,
} from './index';

const ThemeContext = createContext<Theme>(THEMES['washi-light']);

export function ThemeProvider({
  family = 'washi',
  mode = 'system',
  children,
}: {
  family?: ThemeFamily;
  mode?: ThemeMode;
  children: ReactNode;
}) {
  const systemDark = useColorScheme() === 'dark';
  const theme = resolveTheme(family, mode, systemDark);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Builds a component's StyleSheet from the active theme, once per theme. */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

/**
 * Everything inside sits on `paperDeep`: a modal, a sheet.
 *
 * An addition to the NavySum template. The deeper ground takes Washi's muted
 * ink under AA, so rather than every component on a modal remembering to pick
 * a different grey, the whole subtree is handed the deep theme — see `deepen`
 * in ./palette. Nesting it is harmless: the deep theme of a deep theme is
 * itself.
 */
export function DeepTheme({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <ThemeContext.Provider value={DEEP_THEMES[theme.id]}>{children}</ThemeContext.Provider>;
}
