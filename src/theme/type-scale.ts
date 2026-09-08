/**
 * Type, and how it responds to the OS text size setting.
 *
 * Kept apart from tokens.ts for one reason: tokens.ts reads `PixelRatio` and
 * therefore imports react-native, which the test runner cannot parse. Every
 * pure part of the design system lives in a file that can be loaded by a test,
 * and the single file that touches the platform is named for what it does.
 */
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

/**
 * Line heights track the OS font size setting.
 *
 * React Native scales `fontSize` for you when someone turns text size up in
 * their phone's settings, and does *not* touch `lineHeight`. Every size below
 * carries a fixed lineHeight, so at 200% text the glyphs grew and the line box
 * did not: descenders clipped, then whole rows of the type overlapped.
 *
 * Multiplying the line height by the same factor keeps the proportions the
 * design was drawn at, whatever the setting. It is read once at startup, which
 * is when the platform applies the setting anyway.
 *
 * `buildTypography` is separate from the export so the scaling can be tested
 * at sizes this machine cannot be set to — see theme/__tests__/typescale.
 */
export function buildTypography(fontScale: number) {
  // A scale below 1 is someone choosing smaller text; it still needs a line
  // box at least as tall as the glyphs, so the floor is 1 for line heights.
  const lh = (n: number) => Math.round(n * Math.max(1, fontScale));

  return {
  screenTitle: {
    fontFamily: font.heading,
    fontSize: 34,
    lineHeight: lh(35),
    letterSpacing: 0.68,
    textTransform: 'uppercase' as const,
  },
  subTitle: {
    fontFamily: font.heading,
    fontSize: 30,
    lineHeight: lh(31),
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontFamily: font.heading,
    fontSize: 24,
    lineHeight: lh(26),
    letterSpacing: 0.48,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontFamily: font.heading,
    fontSize: 22,
    lineHeight: lh(24),
    letterSpacing: 0.44,
    textTransform: 'uppercase' as const,
  },
  /** The kicker above a title, and the header above a list. */
  label: {
    fontFamily: font.heading,
    fontSize: 12,
    lineHeight: lh(14),
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  /** Stat captions, day letters. */
  labelSmall: {
    fontFamily: font.heading,
    fontSize: 11,
    lineHeight: lh(13),
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontFamily: font.heading,
    fontSize: 11,
    lineHeight: lh(13),
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  /** Row names and anything read as a sentence. */
  body: { fontFamily: font.body, fontSize: 15, lineHeight: lh(20) },
  bodyStrong: { fontFamily: font.bodyStrong, fontSize: 15, lineHeight: lh(20) },
  prose: { fontFamily: font.body, fontSize: 13, lineHeight: lh(20) },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: lh(16) },

  /** Figures. All tabular; spread `tnum` alongside. */
  stat: { fontFamily: font.heading, fontSize: 26, lineHeight: lh(26), letterSpacing: 0.52, ...tnum },
  statSmall: { fontFamily: font.heading, fontSize: 22, lineHeight: lh(22), letterSpacing: 0.44, ...tnum },
  figure: { fontFamily: font.heading, fontSize: 19, lineHeight: lh(19), letterSpacing: 0.38, ...tnum },
  figureSmall: { fontFamily: font.heading, fontSize: 17, lineHeight: lh(17), letterSpacing: 0.34, ...tnum },
  clock: { fontFamily: font.heading, fontSize: 64, lineHeight: lh(64), letterSpacing: 1.28, ...tnum },
  code: { fontFamily: font.heading, fontSize: 38, lineHeight: lh(38), letterSpacing: 10.6, ...tnum },

  /** Buttons, segments and tags. */
  action: {
    fontFamily: font.heading,
    fontSize: 13,
    lineHeight: lh(15),
    letterSpacing: 1.04,
    textTransform: 'uppercase' as const,
  },
  } as const;
}

/**
 * The scale as it is right now. Components read this; nothing should call
 * `buildTypography` directly outside a test.
 */
