/**
 * Design tokens.
 *
 * The palette came from life-os-portal and is kept — it is the reason the app
 * looks like LifeOS. Everything dimensional (type sizes, spacing, radii) was
 * originally copied across too, and that was the mistake: those numbers were
 * drawn for a 1400px monitor at arm's length, not a 390px phone held at 30cm.
 * They have been redrawn against Apple's Human Interface Guidelines and
 * Material's type scale.
 *
 * This shares nothing with LifeOS but its colours. Change anything freely.
 */

export type Palette = {
  // core
  background: string;
  primary: string;
  secondary: string;

  // accents
  green: string;
  amber: string;
  blue: string;
  purple: string;
  teal: string;
  coral: string;
  red: string;

  // soft accent tints
  greenSoft: string;
  amberSoft: string;
  blueSoft: string;
  purpleSoft: string;
  tealSoft: string;
  coralSoft: string;
  redSoft: string;

  // surfaces
  bgPage: string;
  bgSurface: string;
  bgSurfaceMuted: string;
  bgHover: string;

  // text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // lines
  borderDefault: string;
  borderStrong: string;

  // chart tints
  greenMid: string;
  greenMuted: string;
  greenFaint: string;
  neutralChart: string;
};

const light: Palette = {
  background: '#ffffff',
  primary: '#171717',
  secondary: '#737373',

  green: '#3f6248',
  amber: '#a46f2b',
  blue: '#3f5a80',
  purple: '#6c4f80',
  teal: '#2f7266',
  coral: '#a15547',
  red: '#955c55',

  greenSoft: '#edf2ed',
  amberSoft: '#faf1e5',
  blueSoft: '#e9eef5',
  purpleSoft: '#efeaf2',
  tealSoft: '#e8f1ee',
  coralSoft: '#f5eae7',
  redSoft: '#f6ecea',

  // The page sits a shade below the card, so a card reads as a raised object
  // rather than as a hairline rectangle drawn on the same white.
  bgPage: '#f7f6f3',
  bgSurface: '#ffffff',
  bgSurfaceMuted: '#f1f0ec',
  bgHover: '#eceae5',

  textPrimary: '#171717',
  textSecondary: '#6b6b68',
  textMuted: '#8f8f8c',

  borderDefault: '#e6e5e1',
  borderStrong: '#d3d2cd',

  greenMid: '#7f9b82',
  greenMuted: '#c9d5cb',
  greenFaint: '#dde5de',
  neutralChart: '#ecefeb',
};

const dark: Palette = {
  background: '#000000',
  primary: '#f2f2ee',
  secondary: '#252725',

  green: '#7e9b7a',
  amber: '#c39552',
  blue: '#7691bc',
  purple: '#a189b3',
  teal: '#6ba597',
  coral: '#c48f7c',
  red: '#bb7770',

  greenSoft: '#1d261e',
  amberSoft: '#2b2318',
  blueSoft: '#1c2430',
  purpleSoft: '#241f28',
  tealSoft: '#1a2622',
  coralSoft: '#2a2119',
  redSoft: '#2c1c1b',

  // Same idea inverted: the card is lifted off the page rather than outlined.
  bgPage: '#0a0b0a',
  bgSurface: '#161816',
  bgSurfaceMuted: '#212421',
  bgHover: '#252825',

  textPrimary: '#f2f2ee',
  textSecondary: '#a9aaa6',
  textMuted: '#7d807c',

  borderDefault: '#262926',
  borderStrong: '#3b3e3b',

  greenMid: '#647c68',
  greenMuted: '#364139',
  greenFaint: '#2b332d',
  neutralChart: '#303330',
};

export const palettes = { light, dark };

/**
 * The logo's own colours, straight off the mark.
 *
 * These are the identity — the app icon, the splash plate, the sign-in mark —
 * and are deliberately kept apart from the UI palette above. The brand green is
 * darker than the interface green, which is tuned for contrast against both a
 * light and a dark ground; a logo only ever sits on cream.
 */
export const brand = {
  green: '#183b28',
  gold: '#b2924f',
  cream: '#fdfaf2',
  name: 'StreakMates',
  tagline: 'Building better habits, together.',
} as const;

/** Font family names, as registered with expo-font in app/_layout.tsx. */
export const font = {
  regular: 'DMSans-Regular',
  medium: 'DMSans-Medium',
  semibold: 'DMSans-SemiBold',
  bold: 'DMSans-Bold',
  mono: 'CascadiaCode-Regular',
  monoSemibold: 'CascadiaCode-SemiBold',
} as const;

/**
 * A 4pt grid. Every gap, pad and inset comes from here, so everything on a
 * screen lands on the same rhythm instead of on an arbitrary number.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const spacing = {
  /** Side gutter. 20 is the iOS standard for a phone. */
  page: space.xl,
  /** Between cards. Cards need more air than the things inside them. */
  section: space.lg,
  /** Inside a card. */
  card: space.lg,
  /** Between rows in a list. */
  row: space.md,
} as const;

export const radius = {
  /** Large enough to read as a modern surface rather than a boxy panel. */
  card: 16,
  button: 12,
  input: 12,
  chip: 10,
  pill: 999,
} as const;

/**
 * A card is separated from the page by a soft shadow in light mode and by a
 * lighter surface in dark mode, because shadows are close to invisible on a
 * dark background. Both are deliberately restrained — this is one step of
 * elevation, not a floating panel.
 */
export const elevation = {
  light: {
    shadowColor: '#1c1b17',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dark: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
} as const;

/** The minimum comfortable tap target, per Apple's HIG. */
export const hit = 44;

/**
 * Type scale.
 *
 * Three jobs, kept deliberately far apart in size so a glance finds the
 * important thing: a display number, a title, and body text. Everything else
 * is a supporting role. Nothing is below 11pt.
 */
export const typography = {
  /** The one number a screen is about. Tabular so digits don't jitter. */
  display: { fontFamily: font.bold, fontSize: 40, letterSpacing: -1.2, lineHeight: 44 },

  /** Large title, at the top of a screen. */
  screenTitle: { fontFamily: font.bold, fontSize: 28, letterSpacing: -0.6, lineHeight: 34 },

  /** A heading inside the page. */
  sectionTitle: { fontFamily: font.bold, fontSize: 20, letterSpacing: -0.3, lineHeight: 26 },

  /** A card's own heading. */
  cardTitle: { fontFamily: font.semibold, fontSize: 16, letterSpacing: -0.2, lineHeight: 21 },

  /** The name of a thing in a list. */
  rowName: { fontFamily: font.medium, fontSize: 16, letterSpacing: -0.2, lineHeight: 21 },

  /** Running text. */
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },

  /** Secondary text under a row, and captions. */
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },

  /** Small print, still legible. */
  monoSmall: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },

  /** Micro-caps, for the one-word label above a group of things. */
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 0.7,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },

  /** A figure in a stat block. Mono keeps columns of numbers aligned. */
  stat: { fontFamily: font.monoSemibold, fontSize: 22, lineHeight: 28 },

  /** Button and action text. */
  action: { fontFamily: font.semibold, fontSize: 15, letterSpacing: -0.1, lineHeight: 20 },

  tabLabel: { fontFamily: font.medium, fontSize: 11, letterSpacing: 0 },
} as const;
