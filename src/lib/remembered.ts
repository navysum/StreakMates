import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A small choice the app remembers for you.
 *
 * Today and Focus both have a Mine/Shared switch, and both forgot it the
 * moment you left the screen. Someone whose habits are mostly shared had to
 * re-select Shared on every single visit — a correction the product could
 * simply not require, which is the cheapest kind of friction to remove.
 *
 * Deliberately for *view* preferences only: which tab, which filter. Not for
 * anything a wrong value could damage, because this restores without asking
 * and a bad restore would be silent.
 *
 * Starts on `fallback` and swaps once storage answers, rather than blocking
 * the first render on a disk read. That means one frame on the default tab
 * before it corrects — invisible in practice, and the alternative is holding
 * the whole screen back for a preference.
 */
export function useRemembered<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(fallback);
  // A restore must never overwrite a choice the person made while it was in
  // flight — they are faster than the disk more often than you would think.
  const touched = useRef(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(`pref.${key}`)
      .then((stored) => {
        if (!alive || touched.current || stored === null) return;
        // Validated against the current options, so a value left behind by an
        // older version of the app cannot select a tab that no longer exists.
        if ((allowed as readonly string[]).includes(stored)) setValue(stored as T);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // `allowed` is a literal at every call site; listing it would re-run this
    // on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const choose = useCallback(
    (next: T) => {
      touched.current = true;
      setValue(next);
      // Not awaited: the switch has already happened on screen, and a failed
      // write should cost the preference, never the interaction.
      void AsyncStorage.setItem(`pref.${key}`, next).catch(() => {});
    },
    [key],
  );

  return [value, choose];
}
