import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export type ShareResult = 'shared' | 'copied' | 'dismissed';

/**
 * Hand some text to whatever the platform has.
 *
 * Phones have a share sheet. Most desktop browsers do not — `navigator.share`
 * is a mobile-and-Safari affair — and react-native-web's Share *rejects* when
 * it is missing, which surfaced as an unhandled rejection and no feedback at
 * all. Falling back to the clipboard gets the invite code to the friend either
 * way; the caller says so in the UI, which is why the result is returned
 * rather than swallowed.
 */
export async function shareText(message: string): Promise<ShareResult> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator === 'undefined' ? undefined : navigator;
    if (nav && typeof nav.share === 'function') {
      try {
        await nav.share({ text: message });
        return 'shared';
      } catch {
        // A rejection here is nearly always the person closing the sheet.
        return 'dismissed';
      }
    }
    await Clipboard.setStringAsync(message);
    return 'copied';
  }

  const result = await Share.share({ message });
  return result.action === Share.sharedAction ? 'shared' : 'dismissed';
}
