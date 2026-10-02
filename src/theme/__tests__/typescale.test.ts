import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PALETTES } from '../palette.ts';
import { buildType } from '../type-scale.ts';

/**
 * The type scale, in all six themes.
 *
 * A line box shorter than its face clips the tops and tails of letters on
 * Android, so every text style is checked against the height its face
 * actually needs — measured from each font's hhea table, as
 * (ascender − descender) / unitsPerEm, rather than assumed.
 */
const FACE_HEIGHT: [RegExp, number][] = [
  [/^CormorantGaramond/, 1.211],
  [/^Inter/, 1.21],
  [/^DMSans/, 1.302],
  [/^ShipporiMincho/, 1.448],
];

function faceHeight(fontFamily: string): number {
  const found = FACE_HEIGHT.find(([pattern]) => pattern.test(fontFamily));
  assert.ok(found, `no measured height for ${fontFamily}`);
  return found[1];
}

type Style = { fontFamily: string; fontSize: number; lineHeight: number; fontVariant?: readonly string[] };

function styles(id: keyof typeof PALETTES): [string, Style][] {
  return Object.entries(buildType(PALETTES[id])) as [string, Style][];
}

const ids = Object.keys(PALETTES) as (keyof typeof PALETTES)[];

test('typescale: every line box clears the height of its face', () => {
  for (const id of ids) {
    for (const [name, s] of styles(id)) {
      // A style that only ever holds lining figures never reaches the
      // ascender or descender, so it may sit tighter — but never under its
      // own size. Named, because every display style has lining figures.
      const figure = ['numeral', 'clock', 'figure', 'figureSmall', 'code'].includes(name);
      const need = figure ? s.fontSize : s.fontSize * faceHeight(s.fontFamily);
      assert.ok(
        s.lineHeight >= need - 0.5,
        `${id} ${name}: line box ${s.lineHeight} under ${need.toFixed(1)}`,
      );
    }
  }
});

test('typescale: every display style is set in lining figures', () => {
  // Cormorant's default figures are old-style, where "11" reads as "II" — a
  // habit called "No phone after 10" came out as "after IO".
  for (const id of ids) {
    for (const [name, s] of styles(id)) {
      if (!/^(CormorantGaramond|DMSans_500|DMSans_300|DMSans_400Regular_Italic)/.test(s.fontFamily)) continue;
      assert.ok(s.fontVariant?.includes('lining-nums'), `${id} ${name} has old-style figures`);
    }
  }
});

test('typescale: LifeOS is the same scale, with display sizes at 0.84', () => {
  const washi = buildType(PALETTES['washi-light']);
  const lifeos = buildType(PALETTES['lifeos-light']);
  assert.equal(lifeos.title.fontSize, Math.round(washi.title.fontSize * 0.84));
  assert.equal(lifeos.numeral.fontSize, Math.round(washi.numeral.fontSize * 0.84));
  // Interface sizes are shared: a label is a label in every app.
  assert.equal(lifeos.body.fontSize, washi.body.fontSize);
  assert.equal(lifeos.label.fontSize, 11);
  assert.equal(washi.label.fontSize, 11);
});

test('typescale: labels are uppercase with their family’s tracking', () => {
  for (const id of ids) {
    const p = PALETTES[id];
    const { label } = buildType(p);
    assert.equal(label.textTransform, 'uppercase');
    assert.equal(label.letterSpacing, p.labelTracking);
    assert.equal(label.color, p.colors.inkMuted);
  }
});

test('typescale: buttons are tracked capitals on paper and sentence case on LifeOS', () => {
  assert.equal(buildType(PALETTES['washi-light']).button.textTransform, 'uppercase');
  assert.equal(buildType(PALETTES['aizome-dark']).button.textTransform, 'uppercase');
  assert.equal('textTransform' in buildType(PALETTES['lifeos-light']).button, false);
});

test('typescale: nothing is fractional', () => {
  for (const id of ids) {
    for (const [name, s] of styles(id)) {
      assert.ok(Number.isInteger(s.fontSize) && s.fontSize > 0, `${id} ${name} size ${s.fontSize}`);
      assert.ok(Number.isInteger(s.lineHeight) && s.lineHeight > 0, `${id} ${name} line ${s.lineHeight}`);
    }
  }
});
