/**
 * Design tokens — the Industry design system, rethemed for StreakMates.
 *
 * Industry is a blueprint language: a light technical ground, one accent,
 * square corners, hairline borders, condensed uppercase labels, and `+`
 * registration marks on framed objects. Two rules drive nearly every decision
 * below, and both are easy to break by accident:
 *
 *   Cards are line drawings, not filled surfaces. A 1px divider border, no
 *   fill, no shadow, no radius. The one solid object on a screen is the
 *   primary button.
 *
 *   There is only one accent. No amber, no red, no per-member colour. Rank,
 *   tone and emphasis come from steps of the accent ramp and from tag
 *   variants — which is why first place is not gold and "needs work" is not
 *   red.
 *
 * Ported from streakmates-tokens.css. The CSS expresses secondary ink as
 * color-mix over the text colour; React Native has no such function, so `ink`
 * below does the same job with alpha.
 */

export type Ramp = {
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type Palette = {
  bg: string;
  surface: string;
  text: string;
  accent: string;
  divider: string;
  neutral: Ramp;
  accents: Ramp;
  /**
   * What to write on top of an accent fill. Dark mode's accent is light, so
   * this is the page colour there, never white — a literal '#fff' is a bug in
   * one of the two themes.
   */
  onAccent: string;
};

const light: Palette = {
  bg: '#f2efe6',
  surface: '#e9e6dc',
  text: '#171717',
  accent: '#3f6248',
  divider: 'rgba(23,23,23,0.16)',
  neutral: {
    100: '#f7f5ee',
    200: '#eae7dd',
    300: '#d8d4c8',
    400: '#bcb8ab',
    500: '#9d998d',
    600: '#7e7a70',
    700: '#605d55',
    800: '#45423c',
    900: '#2c2a26',
  },
  accents: {
    100: '#eef3ef',
    200: '#dbe7dd',
    300: '#c0d3c3',
    400: '#a0bba5',
    500: '#82a287',
    600: '#4d7357',
    700: '#2c452f',
    800: '#1f3323',
    900: '#16241a',
  },
  onAccent: '#f2efe6',
};

/**
 * Dark is a re-declaration of the same names, so every component re-themes
 * without being touched. Both ramps are inverted end-for-end: step 100 stays
 * the soft *fill* (now a dark tint) and 700-900 stay the strong *ink* (now
 * light), which is what keeps tags, buttons and label greys legible either way.
 */
const dark: Palette = {
  bg: '#0f120f',
  surface: '#191c19',
  text: '#f2f2ee',
  accent: '#7e9b7a',
  divider: 'rgba(242,242,238,0.20)',
  neutral: {
    100: '#1e201c',
    200: '#2a2c26',
    300: '#3a3c35',
    400: '#55574e',
    500: '#7e8077',
    600: '#9d9f95',
    700: '#c0c2b8',
    800: '#dcded4',
    900: '#f0f1e9',
  },
  accents: {
    100: '#1b241d',
    200: '#243026',
    300: '#2f3d31',
    400: '#41533f',
    500: '#5f7b60',
    600: '#7e9b7a',
    700: '#a8c2a3',
    800: '#c6d9c2',
    900: '#e2ecdf',
  },
  onAccent: '#0f120f',
};

export const palettes = { light, dark };

/**
 * Secondary ink, as a share of the text colour.
 *
 *   78  body prose            60  micro-labels, inactive tabs
 *   70  meta                  55  ranks, completed task text
 *   65  captions inside plates
 */
export function ink(colors: Palette, percent: number): string {
  const hex = colors.text.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${percent / 100})`;
}

/** Font families, as registered with expo-font in app/_layout.tsx. */
export const font = {
  /** Barlow Condensed 600 — anything structural: titles, labels, figures. */
  heading: 'BarlowCondensed-SemiBold',
  /** Barlow — prose, row names, captions. */
  body: 'Barlow-Regular',
  bodyStrong: 'Barlow-SemiBold',
} as const;

/**
 * Every figure a person compares is tabular, so digits do not jitter as they
 * change. Spread this into any style showing a number.
 */
export const tnum = { fontVariant: ['tabular-nums' as const] };

export const space = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
} as const;

export const spacing = {
  /** Side gutter. */
  page: 20,
  /** Between blocks. */
  section: 20,
  /** Inside a plate. */
  card: 16,
  /** Inside a row. */
  row: 12,
  /** Clears the status bar. */
  top: 58,
  bottom: 24,
} as const;

/** Square corners, everywhere, no exceptions. Kept as a token so it reads as a decision. */
export const radius = { none: 0 } as const;

export const border = { hairline: 1 } as const;

/** The minimum comfortable tap target. */
export const hit = 44;

/**
 * Type. Condensed for structure, Barlow for prose, nothing below 11.
 * Letter-spacing is in points here rather than em, so 0.10em on a 12px label
 * becomes 1.2.
 */
export const typography = {
  screenTitle: {
    fontFamily: font.heading,
    fontSize: 34,
    lineHeight: 35,
    letterSpacing: 0.68,
    textTransform: 'uppercase' as const,
  },
  subTitle: {
    fontFamily: font.heading,
    fontSize: 30,
    lineHeight: 31,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontFamily: font.heading,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: 0.48,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontFamily: font.heading,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: 0.44,
    textTransform: 'uppercase' as const,
  },
  /** The kicker above a title, and the header above a list. */
  label: {
    fontFamily: font.heading,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  /** Stat captions, day letters. */
  labelSmall: {
    fontFamily: font.heading,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontFamily: font.heading,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  /** Row names and anything read as a sentence. */
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 20 },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 15, lineHeight: 20 },
  prose: { fontFamily: font.body, fontSize: 13, lineHeight: 20 },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: 16 },

  /** Figures. All tabular; spread `tnum` alongside. */
  stat: { fontFamily: font.heading, fontSize: 26, lineHeight: 26, letterSpacing: 0.52, ...tnum },
  statSmall: { fontFamily: font.heading, fontSize: 22, lineHeight: 22, letterSpacing: 0.44, ...tnum },
  figure: { fontFamily: font.heading, fontSize: 19, lineHeight: 19, letterSpacing: 0.38, ...tnum },
  figureSmall: { fontFamily: font.heading, fontSize: 17, lineHeight: 17, letterSpacing: 0.34, ...tnum },
  clock: { fontFamily: font.heading, fontSize: 64, lineHeight: 64, letterSpacing: 1.28, ...tnum },
  code: { fontFamily: font.heading, fontSize: 38, lineHeight: 38, letterSpacing: 10.6, ...tnum },

  /** Buttons, segments and tags. */
  action: {
    fontFamily: font.heading,
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: 1.04,
    textTransform: 'uppercase' as const,
  },
} as const;

/**
 * The brand's own colours, off the logo. Kept apart from the palette: the mark
 * only ever sits on cream, so it does not need a dark variant.
 */
export const brand = {
  green: '#183b28',
  gold: '#b2924f',
  cream: '#fdfaf2',
  name: 'StreakMates',
  tagline: 'Building better habits, together.',
} as const;
