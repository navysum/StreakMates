import { KeyboardAvoidingView, Platform, StyleSheet, type ViewStyle } from 'react-native';

/**
 * Keeps the keyboard off whatever the person is typing into.
 *
 * There was nothing doing this job anywhere in the app. Every form set
 * `keyboardShouldPersistTaps` — which only stops the first tap being eaten by
 * the dismiss — and then let the keyboard cover the field and the button
 * beneath it. On a small phone that means typing a habit name and not being
 * able to see or reach "Save".
 *
 * The behaviour differs by platform on purpose, and both halves matter:
 *
 *   iOS      needs `padding`. There is no automatic resize, so without this
 *            the keyboard simply overlaps the app.
 *   Android  needs *nothing*. Expo sets the window to resize the app when the
 *            keyboard opens, so the layout has already shrunk by the time
 *            KeyboardAvoidingView would act — setting `height` here makes it
 *            adjust a second time and the content jumps.
 *   Web      react-native-web renders this as a plain View; browsers scroll
 *            the focused input into view themselves.
 *
 * `offset` is the height of anything drawn above this that the keyboard must
 * also clear — a modal header, most often.
 */
export function KeyboardSafe({
  children,
  offset = 0,
  style,
}: {
  children: React.ReactNode;
  offset?: number;
  style?: ViewStyle;
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
