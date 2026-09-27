import type { Palette } from './palette.ts';

/**
 * Type: a serif display face for what matters, a quiet UI face for controls,
 * and small uppercase tracked labels above sections. Typography carries the
 * hierarchy, so there are few boxes anywhere in the app.
 *
 *   Washi, Aizome   Cormorant Garamond for display, Inter for the interface
 *   LifeOS          DM Sans for both, display sizes scaled by 0.84 because
 *                   DM Sans runs larger than Cormorant at the same size
 *
 * Line heights are fixed and are NOT multiplied by the OS text size. React
 * Native already scales `lineHeight` alongside `fontSize` on both platforms —
 * iOS multiplies it by the effective font size multiplier, Android converts it
 * as SP — and it honours `maxFontSizeMultiplier` for both. Scaling it here as
 * well gave twice the leading at large text sizes.
 *
 * Every ratio below clears the face's own measured height (from its hhea
 * table): Cormorant 1.21 em, Inter 1.21 em, DM Sans 1.30 em. The figures are
 * the exception, and may sit tighter, because lining digits never reach the
 * ascender or the descender.
 */

/**
 * How far type may grow with the OS text size, where it must stop.
 *
 * Body text grows freely; that is the point of the setting. Hero type, titles
 * and big numerals are capped so a layout built around them does not break,
 * and the tab bar is capped so three labels side by side never collide.
 */
export const HERO_MAX_SCALE = 1.4;
export const NUMERAL_MAX_SCALE = 1.2;
export const CHROME_MAX_SCALE = 1.5;

/**
 * Cormorant's default figures are old-style, which makes "11" read as "II" —
 * "No phone after 10" came out as "after IO". Every display style is set in
 * lining figures, not just the big numerals.
 */
export const numerals = { fontVariant: ['lining-nums' as const] };

/** Small uppercase, tracked labels ("SATURDAY"). */
export function labelStyle(t: Pick<Palette, 'fonts' | 'labelTracking' | 'colors'>) {
  return {
    fontFamily: t.fonts.uiMedium,
    fontSize: 11,
    letterSpacing: t.labelTracking,
    textTransform: 'uppercase' as const,
    color: t.colors.inkMuted,
  };
}

export function buildType(p: Palette) {
  const lifeos = p.family === 'lifeos';
  // Display sizes follow the face; UI sizes are the same in every family.
  const d = (n: number) => Math.round(n * p.displayScale);

  return {
    /** A screen's title. Sentence case. Cap with HERO_MAX_SCALE. */
    title: {
      fontFamily: p.fonts.display,
      fontSize: d(32),
      lineHeight: d(42),
      letterSpacing: lifeos ? -0.5 : -0.2,
      ...numerals,
    },
    /** A name heading a block: a group, a person, an empty state. */
    heading: { fontFamily: p.fonts.display, fontSize: d(24), lineHeight: d(32), ...numerals },
    /** A row's content: a habit, a task, a person. */
    row: { fontFamily: p.fonts.display, fontSize: d(21), lineHeight: d(28), ...numerals },
    /** An italic title, in inkSoft. */
    italicTitle: {
      fontFamily: p.fonts.displayItalic,
      fontSize: d(20),
      lineHeight: d(26),
      ...numerals,
    },
    /**
     * The one short italic line under a number, a source or an excerpt, in
     * inkMuted. LifeOS sets it smaller, as the design system does.
     */
    italic: lifeos
      ? { fontFamily: p.fonts.displayItalic, fontSize: 14, lineHeight: 20, ...numerals }
      : { fontFamily: p.fonts.displayItalic, fontSize: 17, lineHeight: 23, ...numerals },
    body: { fontFamily: p.fonts.ui, fontSize: 16, lineHeight: 24 },
    bodyMedium: { fontFamily: p.fonts.uiMedium, fontSize: 16, lineHeight: 24 },
    caption: { fontFamily: p.fonts.ui, fontSize: 14, lineHeight: 20 },
    /** The section label. Carries inkMuted, as the design system's does. */
    label: { ...labelStyle(p), lineHeight: 15 },
    /** A button's label: tracked capitals on paper, sentence case on LifeOS. */
    button: lifeos
      ? { fontFamily: p.fonts.uiMedium, fontSize: 15, lineHeight: 20 }
      : {
          fontFamily: p.fonts.uiMedium,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: 2.4,
          textTransform: 'uppercase' as const,
        },

    /** Big light numerals: the day's count. Cap with NUMERAL_MAX_SCALE. */
    numeral: { fontFamily: p.fonts.displayLight, fontSize: d(64), lineHeight: d(72), ...numerals },
    /** The focus clock. Drawn digit by digit — see components/Clock. */
    clock: { fontFamily: p.fonts.displayLight, fontSize: d(88), lineHeight: d(96), ...numerals },
    /** A figure in a row of three: a streak, a rate. */
    figure: { fontFamily: p.fonts.displayLight, fontSize: d(44), lineHeight: d(52), ...numerals },
    /** A number inside a row: a rank, a rate, a count. */
    figureSmall: { fontFamily: p.fonts.display, fontSize: d(21), lineHeight: d(28), ...numerals },
    /** The invite code: six characters, spaced to be read aloud. */
    code: {
      fontFamily: p.fonts.display,
      fontSize: d(40),
      lineHeight: d(52),
      letterSpacing: 8,
      ...numerals,
    },
  } as const;
}

export type TypeScale = ReturnType<typeof buildType>;
