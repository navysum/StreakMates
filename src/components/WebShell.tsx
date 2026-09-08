import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Keeps the app phone-shaped in a desktop browser.
 *
 * Every screen here is drawn for a 402pt phone: a 20pt gutter, rows that read
 * as a list, seven week cells across. Given a 1440px window react-native-web
 * happily stretches all of it, and the explainer prose runs the full width of a
 * monitor at 13px — the app still works and is unpleasant to read.
 *
 * So on web, past the width of a large phone, the app sits in a centred column
 * of that width against the page colour, with a hairline down each side to say
 * the edge is deliberate rather than a broken layout. Below that it is exactly
 * the app, edge to edge, and on a real device this component is not there at
 * all.
 */
const MAX = 460;

export function WebShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web' || width <= MAX) return <>{children}</>;

  return (
    <View style={[styles.page, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.column,
          { backgroundColor: colors.bg, borderColor: colors.divider },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center' },
  column: {
    flex: 1,
    width: MAX,
    maxWidth: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
});
