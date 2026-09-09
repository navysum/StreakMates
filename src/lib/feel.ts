/**
 * What each moment in the app is allowed to feel like.
 *
 * The app had no haptics at all, which on a habit tracker is a strange gap:
 * ticking something off is the entire product, and it landed with no more
 * physical acknowledgement than scrolling past it.
 *
 * The rule here is that a haptic must mean something. Firing one on every tap
 * is worse than firing none — it stops carrying information and becomes a
 * buzz the person learns to ignore, which is why the audit lists
 * "haptics fire indiscriminately" as a failure on its own. So there are three
 * events, no more:
 *
 *   kept        you checked something off          a light tap
 *   milestone   that check-in reached 7, 14, 30…   the success pattern
 *   undone      you unchecked something            a softer tap, so undo is
 *                                                  distinguishable by feel
 *
 * Not here on purpose: navigation, opening a sheet, typing, scrolling,
 * pressing an ordinary button. Those are things you did, not things that
 * happened.
 *
 * The user's own setting is the control. iOS silences all of this when System
 * Haptics is off, and Android routes it through the system haptic feedback
 * preference, so there is no in-app toggle duplicating a switch the phone
 * already has.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Semantic names, so a call site never picks an intensity for itself. */
export type Feel = 'kept' | 'milestone' | 'undone';

/**
 * Web has no haptics API worth using — the Vibration API is a blunt buzz that
 * most browsers ignore and desktop cannot do at all — so this is a no-op
 * there rather than a degraded imitation.
 */
export const CAN_VIBRATE = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Never throws. A haptic failing is not worth interrupting a check-in for:
 * the write has already happened optimistically by the time this runs, and an
 * unhandled rejection here would surface as a crash over a completed action.
 */
export function feel(kind: Feel): void {
  if (!CAN_VIBRATE) return;

  const run =
    kind === 'milestone'
      ? () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : kind === 'kept'
        ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  try {
    void run().catch(() => {});
  } catch {
    // A device without a taptic engine, or a permission the OS withdrew.
  }
}
