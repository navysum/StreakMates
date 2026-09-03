/**
 * Design tokens copied once from life-os-portal/src/styles/variables.css.
 *
 * This is a one-time copy, not a live dependency: the phone app shares nothing
 * with LifeOS but its appearance. Change anything here freely.
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

  bgPage: '#ffffff',
  bgSurface: '#ffffff',
  bgSurfaceMuted: '#f5f5f3',
  bgHover: '#f1f2ef',

  textPrimary: '#171717',
  textSecondary: '#737373',
  textMuted: '#949494',

  borderDefault: '#e4e4e1',
  borderStrong: '#ccccca',

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

  bgPage: '#000000',
  bgSurface: '#101110',
  bgSurfaceMuted: '#252725',
  bgHover: '#1c1e1c',

  textPrimary: '#f2f2ee',
  textSecondary: '#a9aaa6',
  textMuted: '#777a76',

  borderDefault: '#292b29',
  borderStrong: '#414441',

  greenMid: '#647c68',
  greenMuted: '#364139',
  greenFaint: '#2b332d',
  neutralChart: '#303330',
};

export const palettes = { light, dark };

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
 * The portal's phone breakpoint values, not its desktop ones —
 * page padding drops to 20 under 650px in globals.css.
 */
export const spacing = {
  page: 20,
  section: 20,
  card: 14,
  row: 11,
} as const;

export const radius = {
  card: 8,
  button: 6,
  pill: 999,
} as const;

/**
 * Type scale lifted from the portal's components. Letter-spacing is in points
 * here rather than em, so 0.06em on an 8px label becomes 0.5.
 */
export const typography = {
  screenTitle: { fontFamily: font.bold, fontSize: 19, letterSpacing: -0.2 },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.44,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontFamily: font.monoSemibold,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  rowName: { fontFamily: font.medium, fontSize: 12 },
  body: { fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  stat: { fontFamily: font.monoSemibold, fontSize: 17 },
  monoSmall: { fontFamily: font.mono, fontSize: 8 },
  tabLabel: { fontFamily: font.medium, fontSize: 9 },
} as const;
