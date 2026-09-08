import { View, StyleSheet, type ColorValue } from 'react-native';

export type TabName = 'today' | 'groups' | 'focus' | 'you';

/**
 * Lucide-style line icons at 1.5 stroke, drawn from views rather than pulled
 * from a package — four shapes is less than a dependency, and square corners
 * mean nothing here needs a curve the platform would have to approximate.
 */
export function TabIcon({ name, color }: { name: TabName; color: ColorValue }) {
  const stroke = { borderColor: color, borderWidth: 1.5 };

  switch (name) {
    case 'today':
      // A square with a check: the check-in box, which is what Today is for.
      return (
        <View style={[styles.box, styles.square, stroke]}>
          <View style={[styles.tickShort, { backgroundColor: color }]} />
          <View style={[styles.tickLong, { backgroundColor: color }]} />
        </View>
      );

    case 'groups':
      return (
        <View style={styles.box}>
          <View style={[styles.head, styles.headLeft, stroke]} />
          <View style={[styles.head, styles.headRight, stroke]} />
          <View style={[styles.shoulders, stroke]} />
        </View>
      );

    case 'focus':
      return (
        <View style={[styles.box, styles.clock, stroke]}>
          <View style={[styles.hand, { backgroundColor: color }]} />
        </View>
      );

    case 'you':
      return (
        <View style={styles.box}>
          <View style={[styles.soloHead, stroke]} />
          <View style={[styles.soloBody, stroke]} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  box: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

  square: { width: 18, height: 18, borderRadius: 5 },
  tickShort: {
    position: 'absolute',
    width: 1.5,
    height: 5,
    transform: [{ rotate: '-45deg' }, { translateX: -1 }, { translateY: 2 }],
  },
  tickLong: {
    position: 'absolute',
    width: 1.5,
    height: 9,
    transform: [{ rotate: '45deg' }, { translateX: 1 }],
  },

  head: { position: 'absolute', width: 6, height: 6, borderRadius: 3, top: 2 },
  headLeft: { left: 2 },
  headRight: { right: 2 },
  shoulders: {
    position: 'absolute',
    bottom: 2,
    left: 1,
    right: 1,
    height: 7,
    borderBottomWidth: 0,
    // Rounded at the top only, so the pair reads as the two figures in the
    // mark rather than as two boxes.
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  clock: { width: 17, height: 17, borderRadius: 8.5 },
  hand: { width: 1.5, height: 5, marginBottom: 4 },

  soloHead: { width: 7, height: 7, borderRadius: 3.5, marginBottom: 1.5 },
  soloBody: {
    width: 14,
    height: 7,
    borderBottomWidth: 0,
    // Rounded at the top only, so the pair reads as the two figures in the
    // mark rather than as two boxes.
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});
