import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './tokens';

type Theme = { colors: Palette; scheme: 'light' | 'dark' };

const ThemeContext = createContext<Theme>({ colors: palettes.light, scheme: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <ThemeContext.Provider value={{ colors: palettes[scheme], scheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
