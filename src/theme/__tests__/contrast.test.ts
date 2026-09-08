import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  gradient,
  gradientAction,
  ink,
  palettes,
  streakColor,
  type Palette,
} from '../tokens.ts';

/**
 * The palette's accessibility claims, as tests rather than as comments.
 *
 * Every number asserted here was measured before it was written down, and one
 * of them caught a real bug: the sign-in button was originally filled with the
 * brand gradient, which ends in soft pink, where white is 1.85:1. It looked
 * correct at the left edge of the button and was unreadable at the right.
 *
 * WCAG AA is 4.5:1 for normal text and 3:1 for a large one or a graphical
 * object. Anything a person must read is held to 4.5 here.
 */

const AA = 4.5;
const AA_LARGE = 3;

function luminance(hex: string): number {
  const c = [0, 2, 4]
    .map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `ink()` returns rgba(), so flatten it onto its ground before measuring. */
function flatten(rgba: string, ground: string): string {
  const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number);
  const base = [0, 2, 4].map((i) => parseInt(ground.slice(1 + i, 3 + i), 16));
  const out = [r, g, b].map((v, i) => Math.round(v * a + base[i] * (1 - a)));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

const themes: [string, Palette][] = [
  ['light', palettes.light],
  ['dark', palettes.dark],
];

for (const [name, colors] of themes) {
  const grounds = { page: colors.bg, card: colors.surface, raised: colors.raised };

  test(`${name}: body text clears AA on every ground`, () => {
    for (const [where, ground] of Object.entries(grounds)) {
      const got = ratio(colors.text, ground);
      assert.ok(got >= AA, `text on ${where} is ${got.toFixed(2)}:1`);
    }
  });

  test(`${name}: the ink floor of 62 clears AA`, () => {
    for (const [where, ground] of Object.entries(grounds)) {
      const at62 = ratio(flatten(ink(colors, 62), ground), ground);
      assert.ok(at62 >= AA, `ink 62 on ${where} is ${at62.toFixed(2)}:1`);
    }
  });

  test(`${name}: every meaning is readable as ink on every ground`, () => {
    for (const [role, hex] of Object.entries(colors.meaning)) {
      for (const [where, ground] of Object.entries(grounds)) {
        const got = ratio(hex, ground);
        assert.ok(got >= AA, `${role} on ${where} is ${got.toFixed(2)}:1`);
      }
      // And on its own soft chip, which is where tags actually draw it.
      const chip = ratio(hex, colors.meaningSoft[role as keyof typeof colors.meaning]);
      assert.ok(chip >= AA, `${role} on its own chip is ${chip.toFixed(2)}:1`);
    }
  });

  test(`${name}: the accent tag and the highlighted row stay readable`, () => {
    // Tag variant="accent" writes meaning.action on accents[100].
    const tag = ratio(colors.meaning.action, colors.accents[100]);
    assert.ok(tag >= AA, `an accent tag is ${tag.toFixed(2)}:1`);

    // The leaderboard fills your own row with meaningSoft.action and keeps
    // ordinary text on it, so body text has to survive that fill too.
    for (const soft of Object.values(colors.meaningSoft)) {
      const body = ratio(colors.text, soft);
      assert.ok(body >= AA, `body text on a soft fill is ${body.toFixed(2)}:1`);
      const label = ratio(flatten(ink(colors, 62), soft), soft);
      assert.ok(label >= AA, `a micro-label on a soft fill is ${label.toFixed(2)}:1`);
    }
  });

  test(`${name}: onAccent is readable on the accent fill`, () => {
    const got = ratio(colors.onAccent, colors.accent);
    assert.ok(got >= AA, `onAccent on accent is ${got.toFixed(2)}:1`);
  });

  test(`${name}: every streak stop is visible as a fill`, () => {
    for (const stop of colors.streak) {
      const got = ratio(stop, colors.surface);
      assert.ok(got >= AA_LARGE, `streak stop ${stop} on a card is ${got.toFixed(2)}:1`);
    }
  });

  test(`${name}: streakColor bands on the milestones the app celebrates`, () => {
    assert.equal(streakColor(colors, 0), null);
    assert.equal(streakColor(colors, 1), colors.streak[0]);
    assert.equal(streakColor(colors, 2), colors.streak[0]);
    assert.equal(streakColor(colors, 3), colors.streak[1]);
    assert.equal(streakColor(colors, 6), colors.streak[1]);
    assert.equal(streakColor(colors, 7), colors.streak[2]);
    assert.equal(streakColor(colors, 13), colors.streak[2]);
    assert.equal(streakColor(colors, 14), colors.streak[3]);
    assert.equal(streakColor(colors, 29), colors.streak[3]);
    assert.equal(streakColor(colors, 30), colors.streak[4]);
    assert.equal(streakColor(colors, 4000), colors.streak[4]);
    // A negative streak is not a thing, but it must not return a colour.
    assert.equal(streakColor(colors, -1), null);
  });
}

test('light mode is what pins the ink floor at 62 rather than lower', () => {
  // Only light is near the line — dark measures 6.20 at 58 — so this is
  // asserted once, about light, rather than once per theme.
  const ground = palettes.light.raised;
  const at58 = ratio(flatten(ink(palettes.light, 58), ground), ground);
  assert.ok(at58 < AA, `ink 58 measured ${at58.toFixed(2)}:1 — the floor could drop`);
});

test('the action gradient carries white at every stop', () => {
  for (const stop of gradientAction) {
    const got = ratio('#ffffff', stop);
    assert.ok(got >= AA, `white on ${stop} is ${got.toFixed(2)}:1`);
  }
});

test('the brand gradient does NOT carry text, which is why the other exists', () => {
  // Guards against someone "simplifying" Button back onto `gradient`.
  const worst = Math.min(...gradient.map((stop) => ratio('#ffffff', stop)));
  assert.ok(worst < AA, `the brand gradient now passes at ${worst.toFixed(2)}:1 — check Button`);
});
