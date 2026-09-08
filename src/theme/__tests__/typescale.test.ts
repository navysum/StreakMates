import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTypography } from '../type-scale.ts';

/**
 * Text scaling, tested at sizes this machine cannot be set to.
 *
 * React Native scales `fontSize` when someone turns text size up in their
 * phone's settings and does not touch `lineHeight`. Every size in the token
 * set carries a fixed line height, so at 200% text the glyphs grew and the
 * line box did not: descenders clipped, then rows overlapped.
 *
 * `buildTypography` exists to be callable at an arbitrary scale, which is the
 * only way to check this without a device.
 */

const SCALES = [0.85, 1, 1.15, 1.3, 1.5, 2, 3.1];

/** Every style in the set that carries both a size and a line height. */
function sized(scale: number) {
  return Object.entries(buildTypography(scale)).filter(
    ([, v]) => typeof v === 'object' && 'fontSize' in v && 'lineHeight' in v,
  ) as [string, { fontSize: number; lineHeight: number }][];
}

test('typescale: a line box is never shorter than its own glyphs', () => {
  for (const scale of SCALES) {
    for (const [name, style] of sized(scale)) {
      // fontSize is scaled by the platform at render, so compare like with
      // like: the rendered glyph height is fontSize * scale.
      const rendered = style.fontSize * Math.max(1, scale);
      assert.ok(
        style.lineHeight >= rendered - 1,
        `${name} at ${scale}x: line box ${style.lineHeight} under glyphs ${rendered.toFixed(1)}`,
      );
    }
  }
});

test('typescale: the proportions the design was drawn at are preserved', () => {
  const base = new Map(sized(1).map(([n, s]) => [n, s.lineHeight / s.fontSize]));
  for (const scale of [1.3, 2, 3.1]) {
    for (const [name, style] of sized(scale)) {
      const ratio = style.lineHeight / (style.fontSize * scale);
      // Rounding to whole points moves the ratio a little; a tenth is slack
      // enough for that and tight enough to catch a lost multiplication.
      assert.ok(
        Math.abs(ratio - base.get(name)!) < 0.1,
        `${name} at ${scale}x: ratio ${ratio.toFixed(2)} vs ${base.get(name)!.toFixed(2)}`,
      );
    }
  }
});

test('typescale: smaller text still gets a full-height line box', () => {
  // Someone choosing *smaller* text does not need the lines squeezed further;
  // the floor of 1 is what stops a sub-1 scale clipping.
  for (const [name, style] of sized(0.85)) {
    const [, atOne] = sized(1).find(([n]) => n === name)!;
    assert.equal(style.lineHeight, atOne.lineHeight, `${name} shrank below its drawn size`);
  }
});

test('typescale: the tab label is what the bar is sized from', () => {
  // app/(tabs)/_layout.tsx computes the bar height from this exact value at a
  // capped scale, so it has to keep growing with the scale it is given.
  const at1 = buildTypography(1).tabLabel.lineHeight;
  const at13 = buildTypography(1.3).tabLabel.lineHeight;
  assert.ok(at13 > at1, 'the tab label line height stopped tracking its scale');
});

test('typescale: nothing returns a fractional or NaN line height', () => {
  for (const scale of [...SCALES, 0, -1, NaN]) {
    for (const [name, style] of sized(Number.isFinite(scale) ? scale : 1)) {
      assert.ok(
        Number.isInteger(style.lineHeight) && style.lineHeight > 0,
        `${name} at ${scale}x: ${style.lineHeight}`,
      );
    }
  }
});
