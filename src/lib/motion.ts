import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Durations, in ms. Short enough that nothing waits on an animation.
 *
 * Motion in this app exists to say what changed — a control became active, a
 * day was cleared — and never to decorate. If a transition cannot be described
 * in those terms it should not be added.
 */
export const duration = {
  /** A control responding to a tap. */
  tap: 160,
  /** Something appearing or leaving. */
  enter: 220,
} as const;

/**
 * Does this person want motion reduced?
 *
 * Both platforms expose it and both are checked, because a setting that is
 * only honoured on one is worse than none — someone who turns it on and still
 * sees things move learns the app ignores them.
 *
 * On native this is a real accessibility setting with a change event. On web
 * it is the `prefers-reduced-motion` media query, which react-native's
 * AccessibilityInfo does not read, so the query is used directly.
 *
 * Defaults to false, so a platform that cannot answer still animates rather
 * than shipping a frozen interface.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;

    if (Platform.OS === 'web') {
      // Guard the whole thing: matchMedia is missing in some embedded
      // webviews, and older Safari has no addEventListener on MediaQueryList.
      const query =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-reduced-motion: reduce)')
          : null;
      if (!query) return;

      setReduced(query.matches);
      const onChange = (e: MediaQueryListEvent) => alive && setReduced(e.matches);
      if (query.addEventListener) {
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
      }
      query.addListener(onChange);
      return () => query.removeListener(onChange);
    }

    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (alive) setReduced(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => {
      if (alive) setReduced(on);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
