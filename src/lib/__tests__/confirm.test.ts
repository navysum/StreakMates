import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

/**
 * `confirm` itself imports react-native, which a node test cannot load, so this
 * asserts the thing that actually caught us out: that react-native-web's Alert
 * is a stub — `static alert() {}` — which is why every confirmation on the web
 * build silently did nothing.
 *
 * If a future version of RNW implements it, this fails and the platform branch
 * in lib/confirm.ts can be reconsidered rather than carried forever.
 */
test('react-native-web Alert.alert is still a no-op, so the web branch is needed', () => {
  const require = createRequire(import.meta.url);
  // The CJS build exports the class itself; its statics are non-enumerable,
  // so `Object.keys` is empty while `alert` is very much there.
  const Alert = require('react-native-web/dist/cjs/exports/Alert/index.js') as {
    alert: (...args: unknown[]) => void;
  };

  let ran = false;
  Alert.alert('Delete?', 'Gone for good', [{ text: 'Delete', onPress: () => (ran = true) }]);

  assert.equal(ran, false, 'RNW now runs the button callback — revisit lib/confirm.ts');
  assert.equal(Alert.alert.length, 0, 'RNW Alert.alert takes no arguments: it is a stub');
});
