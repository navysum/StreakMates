import { View, StyleSheet, type ColorValue } from 'react-native';

export type TabName = 'today' | 'groups' | 'focus' | 'you';

/**
 * Drawn rather than imported: the portal uses 19px flat glyphs, and four
 * simple shapes cost less than an icon dependency.
 */
export function TabIcon({ name, color }: { name: TabName; color: ColorValue }) {
  switch (name) {
    case 'today':
      return <View style={[styles.box, styles.ring, { borderColor: color }]} />;
    case 'groups':
      return (
        <View style={styles.box}>
          <View style={[styles.small, styles.left, { borderColor: color }]} />
          <View style={[styles.small, styles.right, { borderColor: color }]} />
        </View>
      );
    case 'focus':
      // A clock: a ring with a hand, which reads at 19px where a tomato does not.
      return (
        <View style={[styles.box, styles.ring, { borderColor: color }]}>
          <View style={[styles.hand, { backgroundColor: color }]} />
        </View>
      );
    case 'you':
      return (
        <View style={[styles.box, styles.person]}>
          <View style={[styles.head, { borderColor: color }]} />
          <View style={[styles.body, { borderColor: color }]} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  box: { width: 19, height: 19, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 1.6, borderRadius: 9.5, width: 17, height: 17 },
  hand: { width: 1.6, height: 5, borderRadius: 1, marginBottom: 4 },
  small: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 1.6 },
  left: { left: 0 },
  right: { right: 0 },
  person: { gap: 1.5 },
  head: { width: 7.5, height: 7.5, borderRadius: 4, borderWidth: 1.6 },
  body: {
    width: 14,
    height: 8,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.6,
    borderBottomWidth: 0,
  },
});
