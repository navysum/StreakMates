import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AA,
  AA_NON_TEXT,
  PALETTES,
  chipSelected,
  contrast,
  deepen,
  flatten,
  themeId,
  type Palette,
} from '../palette.ts';

/**
 * The NavySum rule that contrast is non-negotiable, as tests.
 *
 * All six themes are held to WCAG AA — 4.5:1 for any text a person must read,
 * 3:1 for a control's edge or a mark — on every ground the app actually draws
 * that text on. The design system states that its palettes pass; measuring
 * them showed three pairings that do not, and the guards at the bottom of this
 * file keep those out of the app.
 */

const themes = Object.values(PALETTES);
const inks = ['ink', 'inkSoft', 'inkMuted'] as const;

/** The grounds text sits on: the page, a raised input, and a modal. */
function grounds(p: Palette): [string, string][] {
  const c = p.colors;
  return [
    ['the page', c.paper],
    ['a raised surface', flatten(c.surface, c.paper)],
  ];
}

for (const p of themes) {
  const c = p.colors;
  const deep = deepen(p);

  test(`${p.id}: every ink clears AA on the page and on a raised surface`, () => {
    for (const ink of inks) {
      for (const [where, ground] of grounds(p)) {
        const got = contrast(c[ink], ground);
        assert.ok(got >= AA, `${ink} on ${where} is ${got.toFixed(2)}:1`);
      }
    }
  });

  test(`${p.id}: every ink clears AA on a modal, once deepened`, () => {
    for (const ink of inks) {
      const got = contrast(deep.colors[ink], deep.colors.paper);
      assert.ok(got >= AA, `${ink} on paperDeep is ${got.toFixed(2)}:1`);
    }
    // And an input raised on the modal.
    const input = flatten(deep.colors.surface, deep.colors.paper);
    const got = contrast(deep.colors.ink, input);
    assert.ok(got >= AA, `ink on an input on a modal is ${got.toFixed(2)}:1`);
  });

  test(`${p.id}: a placeholder clears AA on its input, on the page and on a modal`, () => {
    // Field keeps the palette's own muted ink for placeholders even inside a
    // modal, so they stay lighter than typed text.
    for (const ground of [c.paper, c.paperDeep]) {
      const input = flatten(c.surface, ground);
      const got = contrast(c.inkMuted, input);
      assert.ok(got >= AA, `a placeholder is ${got.toFixed(2)}:1 on an input over ${ground}`);
    }
  });

  test(`${p.id}: the accent reads as a text button on the page and on a modal`, () => {
    for (const [where, ground] of [
      ['the page', c.paper],
      ['a modal', c.paperDeep],
    ]) {
      const got = contrast(c.seal, ground);
      assert.ok(got >= AA, `seal on ${where} is ${got.toFixed(2)}:1`);
    }
  });

  test(`${p.id}: a button's label clears AA on its fill`, () => {
    const got = contrast(c.onButton, c.button);
    assert.ok(got >= AA, `onButton on button is ${got.toFixed(2)}:1`);
  });

  test(`${p.id}: a selected chip's label clears AA, on the page and on a modal`, () => {
    for (const ground of [c.paper, c.paperDeep]) {
      const chip = chipSelected(p);
      const got = contrast(chip.text, chip.fill, ground);
      assert.ok(got >= AA, `a selected chip is ${got.toFixed(2)}:1 on ${ground}`);
    }
  });

  test(`${p.id}: segmented labels clear AA on the track`, () => {
    // The track is paperDeep with inkSoft labels; the selected segment is a
    // filled button. On a modal the track steps down to paperEdge.
    for (const t of [p, deep]) {
      const got = contrast(t.colors.inkSoft, t.colors.paperDeep);
      assert.ok(got >= AA, `an inactive segment is ${got.toFixed(2)}:1 in ${t.id}`);
    }
  });

  test(`${p.id}: the tab bar's labels clear AA`, () => {
    const inactive = contrast(c.inkMuted, c.paper);
    assert.ok(inactive >= AA, `an inactive tab is ${inactive.toFixed(2)}:1`);
    // Active is ink on paper; LifeOS writes it in the accent instead.
    const active = contrast(p.family === 'lifeos' ? c.seal : c.ink, c.paper);
    assert.ok(active >= AA, `the active tab is ${active.toFixed(2)}:1`);
  });

  test(`${p.id}: marks and control edges clear 3:1`, () => {
    // The seal, the active tab's mark and a stamped day.
    assert.ok(contrast(c.seal, c.paper) >= AA_NON_TEXT, 'seal on the page');
    // The empty check box, and a kept day in a week strip.
    assert.ok(contrast(c.inkMuted, c.paper) >= AA_NON_TEXT, 'an empty check box');
    assert.ok(contrast(c.inkSoft, c.paper) >= AA_NON_TEXT, 'a kept day');
    // A progress bar's fill against its track.
    assert.ok(contrast(c.seal, c.paperEdge) >= AA_NON_TEXT, 'a progress fill on its track');
  });
}

test('every theme resolves from a family and a mode', () => {
  assert.equal(themeId('washi', 'light', true), 'washi-light');
  assert.equal(themeId('washi', 'dark', false), 'washi-dark');
  assert.equal(themeId('aizome', 'system', true), 'aizome-dark');
  assert.equal(themeId('lifeos', 'system', false), 'lifeos-light');
  for (const p of themes) assert.equal(PALETTES[p.id], p);
});

test('every palette names every colour, as a colour', () => {
  const keys = Object.keys(PALETTES['washi-light'].colors).sort();
  for (const p of themes) {
    assert.deepEqual(Object.keys(p.colors).sort(), keys, `${p.id} is missing a colour`);
    for (const [name, value] of Object.entries(p.colors)) {
      assert.match(value, /^#[0-9A-F]{6}$|^rgba\(\d+, \d+, \d+, [\d.]+\)$/, `${p.id}.${name}`);
    }
  }
});

// Guards. Each of these fails if the pairing it describes becomes readable —
// which would mean the design system fixed its palette and the workaround
// named in the message can go.

test('guard: muted ink on paperDeep fails on Washi, which is why deepen exists', () => {
  const p = PALETTES['washi-light'];
  const got = contrast(p.colors.inkMuted, p.colors.paperDeep);
  assert.ok(got < AA, `inkMuted on paperDeep now passes at ${got.toFixed(2)}:1 — check deepen`);
});

test('guard: the accent on its own wash fails, which is why chips write ink', () => {
  const p = PALETTES['washi-dark'];
  const got = contrast(p.colors.seal, p.colors.sealSoft, p.colors.paper);
  assert.ok(got < AA, `seal on sealSoft now passes at ${got.toFixed(2)}:1 — check chipSelected`);
});

test('guard: text on an accent fill fails on Sumi, which is why only LifeOS fills', () => {
  const p = PALETTES['washi-dark'];
  const got = contrast(p.colors.onAccent, p.colors.seal);
  assert.ok(got < AA, `onAccent on seal now passes at ${got.toFixed(2)}:1 — check chipSelected`);
});
