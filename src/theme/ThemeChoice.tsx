import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { ThemeProvider } from './ThemeProvider';
import { FONTS } from './fonts';
import { isFamily, isMode, type ThemeFamily, type ThemeMode } from './index';

/**
 * Kept from before the redesign, so someone who had forced Light or Dark keeps
 * it through the update. The family is new, and defaults to Washi & Seal —
 * the house default across NavySum apps.
 */
const MODE_KEY = 'habits.theme-mode';
const FAMILY_KEY = 'habits.theme-family';

type Choice = {
  /** What the person picked. Drawn a beat later if its faces are loading. */
  family: ThemeFamily;
  mode: ThemeMode;
  setFamily: (family: ThemeFamily) => void;
  setMode: (mode: ThemeMode) => void;
};

const ChoiceContext = createContext<Choice>({
  family: 'washi',
  mode: 'system',
  setFamily: () => {},
  setMode: () => {},
});

/**
 * A face that fails to load falls back to the system font. The app still
 * works, so that is not worth holding anything up for.
 */
function loadFaces(family: ThemeFamily): Promise<void> {
  return Font.loadAsync(FONTS[family]).catch(() => {});
}

/**
 * The person's theme: a family and Light, Dark or Automatic. Saved on the
 * device, and handed to the NavySum ThemeProvider.
 *
 * Nothing renders until the saved choice is read and its faces are loaded —
 * both local and quick, and the alternative is a frame of Washi before
 * someone's Aizome Night, or a frame of the system font before Cormorant.
 */
export function ThemeChoiceProvider({ children }: { children: ReactNode }) {
  const [family, setFamilyState] = useState<ThemeFamily>('washi');
  // The family being drawn, which trails `family` while a new one's faces load.
  const [drawn, setDrawn] = useState<ThemeFamily>('washi');
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);
  // The most recent pick, so a slow load cannot land after a quicker one.
  const latest = useRef<ThemeFamily>('washi');

  useEffect(() => {
    let alive = true;
    (async () => {
      let saved: ThemeFamily = 'washi';
      let savedMode: ThemeMode = 'system';
      try {
        const [[, f], [, m]] = await AsyncStorage.multiGet([FAMILY_KEY, MODE_KEY]);
        if (isFamily(f)) saved = f;
        if (isMode(m)) savedMode = m;
      } catch {
        // Failing to read it just leaves the defaults.
      }
      await loadFaces(saved);
      if (!alive) return;
      latest.current = saved;
      setFamilyState(saved);
      setDrawn(saved);
      setModeState(savedMode);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setFamily = useCallback((next: ThemeFamily) => {
    latest.current = next;
    setFamilyState(next);
    AsyncStorage.setItem(FAMILY_KEY, next).catch(() => {});
    // Switch once its faces are in, so the new theme never draws a frame in
    // the system font.
    void loadFaces(next).then(() => {
      if (latest.current === next) setDrawn(next);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ family, mode, setFamily, setMode }),
    [family, mode, setFamily, setMode],
  );

  if (!ready) return null;

  return (
    <ChoiceContext.Provider value={value}>
      <ThemeProvider family={drawn} mode={mode}>
        {children}
      </ThemeProvider>
    </ChoiceContext.Provider>
  );
}

export function useThemeChoice(): Choice {
  return useContext(ChoiceContext);
}
