import { Alert, Platform } from 'react-native';

/**
 * "Are you sure?", on every platform.
 *
 * `Alert.alert` is not implemented by react-native-web — it is an empty
 * function, so on the web build the dialog never appears and, because the work
 * lives in a button's `onPress`, nothing happens at all. Deleting an account,
 * leaving a group, deleting a habit and making a habit shared were all dead
 * controls on web for exactly that reason.
 *
 * Returning a promise rather than taking callbacks also puts the consequence
 * next to the question at the call site, instead of buried in an array of
 * buttons.
 */
export function confirm({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web') {
    // The browser's own dialog: one line for the question, the rest beneath.
    // It cannot be styled and it cannot be missed, which for a destructive
    // action is the right trade.
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(text)
        : false,
    );
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
