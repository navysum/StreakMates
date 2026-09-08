/**
 * Design tokens — the StreakMates brand system.
 *
 * Built from the logo: an "S" drawn from two figures, running blue into
 * violet into orchid into pink on a midnight ground. Three rules carry that
 * mark into an interface without turning the interface into the mark:
 *
 *   The UI is flat. No gloss, no glass, no glow, no shadow. A card is a fill
 *   and a hairline. Depth comes from the surface steps below, never from
 *   lighting.
 *
 *   Most of the screen is neutral. Off-white to white to near-black text in
 *   light; midnight to navy to near-white in dark. The brand colours are not
 *   decoration — they are a vocabulary, and spending them on ordinary
 *   furniture is what makes them stop meaning anything.
 *
 *   Colour appears where something *means* something:
 *     blue    progress, interaction
 *     violet  primary actions, active navigation
 *     orchid  social — friends, groups, shared habits
 *     pink    celebration — streak milestones
 *     the gradient   brand moments and real accomplishments only
 *
 *   So a completed habit gets a violet tick, not a violet card.
 *
 * Every colour below was measured rather than chosen by eye. The brand hues
 * are light on purpose, which means several of them are illegible as ink on a
 * white page: orchid #C56AE9 is 2.98:1 there. Each palette therefore carries
 * its own darkened or lightened variant of the same meaning, and `meaning`
 * exists so no screen ever reaches for a raw brand hex.
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

/** The five semantic roles. Never reach for a raw brand hex in a screen. */
export type Meaning = {
  /** Blue. Progress bars, ring fills, anything counting toward something. */
  progress: string;
  /** Violet. Primary actions, the active tab, a completed habit's tick. */
  action: string;
  /** Orchid. Anything social — friends, groups, shared habits, reactions. */
  social: string;
  /** Pink. Celebration only. A streak milestone, a personal best. */
  celebrate: string;
};

export type Palette = {
  /** The page. Never stark white — a lavender tint reads considerably better. */
  bg: string;
  /** A card sitting on the page. */
  surface: string;
  /** A card that is selected, or raised above another card. */
  raised: string;
  text: string;
  /** Violet, as a *fill*. The ink version lives in `meaning.action`. */
  accent: string;
  /** Violet held down. */
  accentPressed: string;
  divider: string;
  /** For a border that has to be seen rather than felt. */
  dividerStrong: string;
  neutral: Ramp;
  accents: Ramp;
  meaning: Meaning;
  /** A 12%-ish wash of each meaning, for chips and soft fills. */
  meaningSoft: Meaning;
  /**
   * The streak spectrum, low to high. Replaces "green means done": a streak
   * climbs blue → periwinkle → violet → orchid → pink as it grows. Read it
   * through `streakColor`, which does the banding.
   */
  streak: [string, string, string, string, string];
  /**
   * What to write on top of an accent fill. Dark mode's accent is light, so
   * this is the page colour there, never white — a literal '#fff' is a bug in
   * one of the two themes. (White on light's #765CEB is 4.67:1; midnight on
   * dark's #8B67F5 is 5.15:1. White on dark's would have been 3.92:1.)
   */
  onAccent: string;
};

/**
 * Light is lavender-tinted rather than stark white, which is most of what
 * makes it feel considered rather than default.
 *
 * The meanings are darkened from their brand hues because the brand hues are
 * light: as ink on this page, violet #8B67F5 measures 3.68:1, orchid #C56AE9
 * measures 2.98:1 and soft pink #F7A4E2 measures 1.73:1.
 *
 * Electric blue was the near miss. It passes on the page (4.51:1) and on a
 * card (4.81:1) and fails on `raised` (4.23:1) — the one ground it was not
 * checked against first, and the one a selected row uses. Every meaning here
 * is now held to AA on all three grounds and on its own soft chip, which is
 * what src/theme/__tests__/contrast.test.ts asserts.
 */
const light: Palette = {
  bg: '#f8f7fc',
  surface: '#ffffff',
  raised: '#f1eff8',
  text: '#111326',
  accent: '#765ceb',
  accentPressed: '#6548df',
  divider: '#e1ddee',
  dividerStrong: '#cbc5dd',
  neutral: {
    100: '#ffffff',
    200: '#f1eff8',
    300: '#eae6f7',
    400: '#e1ddee',
    500: '#cbc5dd',
    600: '#9697a8',
    700: '#686a7c',
    800: '#3a3b4e',
    900: '#111326',
  },
  accents: {
    100: '#f2eafe',
    200: '#e6dafc',
    300: '#d3c2f9',
    400: '#b7a0f4',
    500: '#9b7ef0',
    600: '#765ceb',
    700: '#6548df',
    800: '#4e36b0',
    900: '#372578',
  },
  meaning: {
    progress: '#3d51e6',
    action: '#6548df',
    social: '#9b39bd',
    celebrate: '#aa3a86',
  },
  meaningSoft: {
    progress: '#e6eafe',
    action: '#f2eafe',
    social: '#f8e9fc',
    celebrate: '#fde9f5',
  },
  streak: ['#4b61f8', '#5c55f0', '#6548df', '#a343c7', '#b23f8d'],
  onAccent: '#ffffff',
};

/**
 * Dark is navy-black, not #000: the logo lives on midnight and pure black
 * would strand it. Both ramps are inverted end-for-end — step 100 stays the
 * soft *fill* (now a dark tint) and 700-900 stay the strong *ink* (now light)
 * — which is what lets tags, buttons and label greys re-theme untouched.
 *
 * Two swaps here. Progress cannot be electric blue: it measures 3.81:1 on a
 * card, so dark uses periwinkle #6A81FB at 5.37:1 — the neighbouring stop of
 * the same gradient. And violet as *ink* is one step lighter than violet as a
 * *fill*: #8B67F5 is right under white on a button but only 4.35:1 as text on
 * `raised`, so `meaning.action` is #9D7EF7 at 5.49:1 while `accent` stays the
 * brand's own violet. Orchid and pink work as themselves.
 */
const dark: Palette = {
  bg: '#050611',
  surface: '#0f1328',
  raised: '#151a35',
  text: '#faf9fd',
  accent: '#8b67f5',
  accentPressed: '#a98cf8',
  divider: '#242a49',
  dividerStrong: '#343b62',
  neutral: {
    100: '#0a0d1d',
    200: '#0f1328',
    300: '#151a35',
    400: '#1c2142',
    500: '#343b62',
    600: '#7c7b8e',
    700: '#b2b0c2',
    800: '#d8d6e4',
    900: '#faf9fd',
  },
  accents: {
    100: '#1a153a',
    200: '#231c4c',
    300: '#2e2464',
    400: '#453488',
    500: '#6b4fc9',
    600: '#8b67f5',
    700: '#a98cf8',
    800: '#c5b2fb',
    900: '#e3d9fd',
  },
  meaning: {
    progress: '#6a81fb',
    action: '#9d7ef7',
    social: '#c56ae9',
    celebrate: '#f7a4e2',
  },
  meaningSoft: {
    progress: '#141a3d',
    action: '#1a153a',
    social: '#2a1440',
    celebrate: '#33122a',
  },
  streak: ['#6a81fb', '#7b74f8', '#8b67f5', '#c56ae9', '#f7a4e2'],
  onAccent: '#050611',
};

export const palettes = { light, dark };

/**
 * The brand gradient, as the logo draws it. Four stops for surfaces and
 * strokes, five for the streak spectrum.
 *
 * Spend it deliberately: the sign-in mark, a primary call to action, a
 * milestone. Applied to ordinary furniture it stops being a brand moment and
 * becomes wallpaper — which is the failure mode the whole flat rule exists to
 * avoid.
 */
export const gradient = ['#4b61f8', '#8b67f5', '#c56ae9', '#f7a4e2'] as const;
export const gradientStreak = ['#4b61f8', '#6a81fb', '#8b67f5', '#c56ae9', '#f7a4e2'] as const;

/**
 * The same sweep, for anything with a label on top of it.
 *
 * The brand gradient cannot carry text. It is built to end in soft pink, and
 * white on soft pink is 1.85:1 — a button filled with the full sweep is
 * readable at its left edge and unreadable at its right, which a screenshot
 * of the sign-in screen showed immediately. Nothing about it is fixable by
 * choosing a different text colour: the sweep spans both ends of the
 * lightness range, so no single ink clears it.
 *
 * These are the same four hues held to the darker half of the ramp, where
 * white measures 6.91, 5.92 and 6.23 — clear of AA across the whole sweep
 * rather than only at the start. It reads as the brand gradient because it is
 * the brand gradient; it just does not run off the end into a colour that
 * cannot hold a word.
 */
export const gradientAction = ['#3348d6', '#6548df', '#9332b6'] as const;

/** Left-to-right, so a gradient reads the way the wordmark does. */
export const gradientDirection = { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } } as const;

/**
 * Where a streak sits on the spectrum. The bands are the milestones the app
 * already celebrates, so the colour changes on the day the number does:
 *
 *   0        not started — no colour is spent on nothing
 *   1-2      blue         just begun
 *   3-6      periwinkle   holding
 *   7-13     violet       a week
 *   14-29    orchid       a fortnight
 *   30+      pink         a month and beyond
 *
 * Returns null at zero rather than a grey, so callers must decide what "no
 * streak" looks like in their own context instead of being handed a colour
 * that quietly means something.
 */
export function streakColor(colors: Palette, days: number): string | null {
  if (days <= 0) return null;
  if (days < 3) return colors.streak[0];
  if (days < 7) return colors.streak[1];
  if (days < 14) return colors.streak[2];
  if (days < 30) return colors.streak[3];
  return colors.streak[4];
}

/** The days that earn the full gradient rather than a single stop. */
export const MILESTONES = [7, 14, 30, 50, 100, 200, 365] as const;

export function isMilestone(days: number): boolean {
  return (MILESTONES as readonly number[]).includes(days);
}

/**
 * Secondary ink, as a share of the text colour.
 *
 *   78  body prose             62  micro-labels, ranks, completed task text
 *   70  meta, inactive tabs    45  input placeholders
 *   65  captions inside cards
 *
 * 62 is a floor, not a preference, and it survived the rebrand unchanged:
 * against the new grounds the worst case is a soft accent chip in light mode
 * at 4.79:1, still clear of WCAG AA's 4.5 — and ink 58 would be 4.22, under
 * it. Dark mode is nowhere near the line at 6.55.
 *
 * The one value below the floor is deliberate and non-essential: 45 is
 * placeholder text, and every Field also carries a permanent visible label.
 * Nothing a person must read goes below 62.
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

/**
 * Corners. The mark is a rounded square, so the interface is too — but
 * modestly. `none` is kept because a few things genuinely want a hard edge
 * (a progress bar's fill against its track, a full-bleed rule).
 */
export const radius = {
  none: 0,
  /** Tags, chips, small controls. */
  sm: 8,
  /** Buttons, fields, rows. */
  md: 12,
  /** Cards. */
  lg: 16,
  /** Avatars, pills, the tab indicator. */
  pill: 999,
} as const;

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
 * The mark's own colours, named as the brand names them. Screens should use
 * `meaning` on the palette instead — these are here so the gradient and the
 * icon pipeline have one source, and so the names in the design conversation
 * exist in the code.
 */
export const brand = {
  midnight: '#080c1f',
  deepNavy: '#121945',
  electricBlue: '#4b61f8',
  periwinkle: '#6a81fb',
  violet: '#8b67f5',
  orchid: '#c56ae9',
  softPink: '#f7a4e2',
  softLilac: '#d39ef4',
  name: 'StreakMates',
  tagline: 'Better together.',
} as const;
