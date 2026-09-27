/**
 * What each moment in the app is allowed to feel like.
 *
 * The NavySum rule: haptics only for meaningful moments, and nothing else
 * vibrates. A haptic fired on every tap stops carrying information and becomes
 * a buzz the person learns to ignore. So there are three, as in every NavySum
 * app:
 *
 *   select    choosing: a theme, a filter, a segment, a chip — and taking a
 *             check-in back, so undoing is distinguishable by feel
 *   success   completing the main action: a habit checked in, a task done
 *   warning   just before something destructive: the confirmation for
 *             deleting or leaving
 *
 * Not here on purpose: navigation, opening a sheet, typing, scrolling,
 * pressing an ordinary button. Those are things you did, not things that
 * happened.
 *
 * The person's own setting is the control. iOS silences all of this when
 * System Haptics is off, and Android routes it through the system haptic
 * feedback preference, so there is no in-app toggle duplicating a switch the
 * phone already has.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type Feel = 'select' | 'success' | 'warning';

/**
 * Web has no haptics API worth using — the Vibration API is a blunt buzz that
 * most browsers ignore and desktop cannot do at all — so this is a no-op
 * there rather than a degraded imitation.
 */
export const CAN_VIBRATE = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Never throws. A haptic failing is not worth interrupting a check-in for: the
 * write has already happened optimistically by the time this runs, and an
 * unhandled rejection here would surface as a crash over a completed action.
 */
export function feel(kind: Feel): void {
  if (!CAN_VIBRATE) return;

  const run =
    kind === 'select'
      ? () => Haptics.selectionAsync()
      : kind === 'success'
        ? () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

  try {
    void run().catch(() => {});
  } catch {
    // A device without a taptic engine, or a permission the OS withdrew.
  }
}
