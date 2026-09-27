/**
 * The NavySum palettes: paper, ink and one seal.
 *
 * Every value here is exactly what the NavySum design system ships (first seen
 * in Parables), so StreakMates looks like the rest of the family. Three
 * families, each with a light and a dark look, and the person picks a family
 * plus Light, Dark or Automatic:
 *
 *   Washi & Seal   rice paper and a vermilion hanko (dark: Sumi, "ink")
 *   LifeOS         true neutrals and one emerald, set in DM Sans
 *   Aizome         indigo-dyed paper with the red seal
 *
 * This file is pure data so the contrast rules can be tested directly: the
 * textures need `require`, which only the bundler understands, so they are
 * attached in ./index — the one file in the theme that touches the platform.
 *
 * The rules for spending it:
 *
 *   One accent. `seal` marks the single most important thing on a screen: a
 *   completed habit's stamp, the active tab, a text button. Never a second
 *   accent, never a gradient, never a coloured section background.
 *
 *   Paper, not glass. Grounds are opaque. Depth is a step from `paper` to
 *   `paperDeep`, never a shadow or a blur.
 *
 *   Dark is its own palette, drawn rather than inverted.
 *
 * Three pairings the palettes do not support, measured rather than assumed —
 * see theme/__tests__/contrast.test.ts, which fails if any of them creeps in:
 *
 *   inkMuted on paperDeep   4.22:1 on Washi. Muted text on a deep ground is
 *                           stepped up to inkSoft by `deepen` below.
 *   seal on sealSoft        4.02:1 on Sumi. A selected chip writes its label
 *                           in ink and keeps the accent for its edge and mark.
 *   onAccent on seal        3.54:1 on Sumi. Nothing in the paper families
 *                           writes on an accent fill; LifeOS alone does.
 */

export type ThemeFamily = 'washi' | 'lifeos' | 'aizome';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeId = `${ThemeFamily}-${'light' | 'dark'}`;

export type Colors = {
  /** Page background. */
  paper: string;
  /** Slightly deeper surface: modals, sheets, a pressed row. */
  paperDeep: string;
  /** Hairlines, input borders, the tab bar's top rule. */
  paperEdge: string;
  /** Raised surfaces: inputs (often semi-transparent over the texture). */
  surface: string;
  /** Primary text. */
  ink: string;
  /** Secondary text, italic titles. */
  inkSoft: string;
  /** Labels, captions, inactive tabs. Still AA on paper. */
  inkMuted: string;
  /** Decorative only: hairlines, empty days. Never text someone must read. */
  inkFaint: string;
  /** The one accent: the seal, the streak, the active tab. */
  seal: string;
  /** An accent wash behind a selected chip. */
  sealSoft: string;
  /** Text on an accent fill. LifeOS only — see the note above. */
  onAccent: string;
  /** The filled button, and its label. */
  button: string;
  onButton: string;
};

export type Fonts = {
  display: string;
  displayItalic: string;
  displayLight: string;
  /** For CJK, including the characters on the seal. */
  mincho: string;
  ui: string;
  uiMedium: string;
};

/** Everything about a theme except its texture, which needs the bundler. */
export type Palette = {
  /** Resolved id, e.g. "washi-dark". */
  id: ThemeId;
  family: ThemeFamily;
  name: string;
  dark: boolean;
  colors: Colors;
  fonts: Fonts;
  /** Tint for the seal image; null keeps the textured vermilion stamp. */
  sealTint: string | null;
  /** Letter-spacing for small uppercase labels. */
  labelTracking: number;
  /** Scale applied to display sizes (DM Sans runs larger than Cormorant). */
  displayScale: number;
  radius: { card: number; input: number };
};

/** Font families, as registered with expo-font in app/_layout.tsx. */
const cormorant: Fonts = {
  display: 'CormorantGaramond_500Medium',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  displayLight: 'CormorantGaramond_300Light',
  mincho: 'ShipporiMincho_500Medium',
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
};

const dmSans: Fonts = {
  display: 'DMSans_500Medium',
  displayItalic: 'DMSans_400Regular_Italic',
  displayLight: 'DMSans_300Light',
  mincho: 'ShipporiMincho_500Medium',
  ui: 'DMSans_400Regular',
  uiMedium: 'DMSans_600SemiBold',
};

const washiBase = {
  family: 'washi' as const,
  fonts: cormorant,
  sealTint: null,
  labelTracking: 2.2,
  displayScale: 1,
  radius: { card: 4, input: 4 },
};
const aizomeBase = {
  family: 'aizome' as const,
  fonts: cormorant,
  sealTint: null,
  labelTracking: 2.2,
  displayScale: 1,
  radius: { card: 4, input: 4 },
};
const lifeosBase = {
  family: 'lifeos' as const,
  fonts: dmSans,
  labelTracking: 0.9,
  displayScale: 0.84,
  radius: { card: 12, input: 12 },
};

export const PALETTES: Record<ThemeId, Palette> = {
  'washi-light': {
    ...washiBase,
    id: 'washi-light',
    name: 'Washi',
    dark: false,
    colors: {
      paper: '#F3EDE2',
      paperDeep: '#EAE2D3',
      paperEdge: '#DCD2BF',
      surface: 'rgba(255, 253, 248, 0.55)',
      ink: '#1E1B17',
      inkSoft: '#4E483F',
      inkMuted: '#70695E',
      inkFaint: '#B8AE9D',
      seal: '#B2382A',
      sealSoft: 'rgba(178, 56, 42, 0.10)',
      onAccent: '#FFFDF8',
      button: '#1E1B17',
      onButton: '#F3EDE2',
    },
  },
  'washi-dark': {
    ...washiBase,
    id: 'washi-dark',
    name: 'Sumi',
    dark: true,
    colors: {
      paper: '#1C1A17',
      paperDeep: '#141311',
      paperEdge: '#3A362F',
      surface: 'rgba(255, 250, 240, 0.04)',
      ink: '#EDE6D8',
      inkSoft: '#C9C0B0',
      inkMuted: '#958C7D',
      inkFaint: '#5E574C',
      seal: '#D4614E',
      sealSoft: 'rgba(208, 80, 60, 0.14)',
      onAccent: '#FFF8EE',
      button: '#EDE6D8',
      onButton: '#1C1A17',
    },
  },
  'lifeos-light': {
    ...lifeosBase,
    id: 'lifeos-light',
    name: 'LifeOS',
    dark: false,
    sealTint: '#047857',
    colors: {
      paper: '#FAFAFA',
      paperDeep: '#F4F4F5',
      paperEdge: '#E5E5E5',
      surface: '#FFFFFF',
      ink: '#0A0A0A',
      inkSoft: '#525252',
      inkMuted: '#737373',
      inkFaint: '#D4D4D4',
      seal: '#047857',
      sealSoft: '#E7F6F0',
      onAccent: '#FFFFFF',
      button: '#047857',
      onButton: '#FFFFFF',
    },
  },
  'lifeos-dark': {
    ...lifeosBase,
    id: 'lifeos-dark',
    name: 'LifeOS Dark',
    dark: true,
    sealTint: '#34D399',
    colors: {
      paper: '#050505',
      paperDeep: '#0A0A0A',
      paperEdge: '#1F1F1F',
      surface: '#111111',
      ink: '#F5F5F5',
      inkSoft: '#A3A3A3',
      inkMuted: '#808080',
      inkFaint: '#2C2C2C',
      seal: '#34D399',
      sealSoft: '#0F2A20',
      onAccent: '#04120C',
      button: '#34D399',
      onButton: '#04120C',
    },
  },
  'aizome-light': {
    ...aizomeBase,
    id: 'aizome-light',
    name: 'Aizome',
    dark: false,
    colors: {
      paper: '#ECEFF3',
      paperDeep: '#E1E6ED',
      paperEdge: '#C9D1DD',
      surface: 'rgba(255, 255, 255, 0.6)',
      ink: '#14213D',
      inkSoft: '#34466B',
      inkMuted: '#5E6B83',
      inkFaint: '#A7B2C4',
      seal: '#B2382A',
      sealSoft: 'rgba(178, 56, 42, 0.10)',
      onAccent: '#FFFFFF',
      button: '#14213D',
      onButton: '#ECEFF3',
    },
  },
  'aizome-dark': {
    ...aizomeBase,
    id: 'aizome-dark',
    name: 'Aizome Night',
    dark: true,
    colors: {
      paper: '#111C30',
      paperDeep: '#0B1424',
      paperEdge: '#26365A',
      surface: 'rgba(255, 255, 255, 0.04)',
      ink: '#E8ECF3',
      inkSoft: '#BCC6D8',
      inkMuted: '#8292B0',
      inkFaint: '#3C4E75',
      seal: '#D56251',
      sealSoft: 'rgba(208, 80, 60, 0.16)',
      onAccent: '#FFFFFF',
      button: '#E8ECF3',
      onButton: '#111C30',
    },
  },
};

export const FAMILIES: { id: ThemeFamily; name: string; description: string }[] = [
  { id: 'washi', name: 'Washi & Seal', description: 'Rice paper and a red seal' },
  { id: 'lifeos', name: 'LifeOS', description: 'Clean greys and one green' },
  { id: 'aizome', name: 'Aizome', description: 'Indigo-dyed paper and a red seal' },
];

export const MODES: { id: ThemeMode; name: string }[] = [
  { id: 'system', name: 'Automatic' },
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
];

export function isFamily(value: unknown): value is ThemeFamily {
  return value === 'washi' || value === 'lifeos' || value === 'aizome';
}

export function isMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Which of the six to draw. "system" follows the phone's light/dark setting. */
export function themeId(family: ThemeFamily, mode: ThemeMode, systemDark: boolean): ThemeId {
  const dark = mode === 'dark' || (mode === 'system' && systemDark);
  return `${family}-${dark ? 'dark' : 'light'}`;
}

/** The spacing scale. `gutter` is the page's side padding. */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  gutter: 28,
} as const;

/** The minimum comfortable tap target. Tabs get 48. */
export const hit = 44;

/**
 * Real padding that brings a line of text up to `hit`, rather than hitSlop.
 *
 * hitSlop is the obvious tool and the wrong one here: react-native-web does
 * not implement it, so every text control measured the height of its own
 * glyphs in a browser while looking correct on a phone. Padding works on all
 * three platforms; `marginVertical` cancels the space it adds, so the layout
 * around the control is unchanged.
 */
export function tapPadding(lineHeight: number) {
  const pad = Math.max(0, Math.ceil((hit - lineHeight) / 2));
  return { paddingVertical: pad, marginVertical: -pad } as const;
}

/**
 * A colour with some transparency, from a #rrggbb hex. For a scrim or a
 * pressed wash — never for a surface, which is always opaque.
 */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * Flattens a colour onto the ground beneath it, as the eye sees it. The paper
 * families' `surface` and `sealSoft` are washes over the page, so their
 * contrast is only meaningful once composited.
 */
export function flatten(color: string, ground: string): string {
  if (color.startsWith('#')) return color.toLowerCase();
  const [r, g, b, a] = color.match(/[\d.]+/g)!.map(Number);
  const base = [1, 3, 5].map((i) => parseInt(ground.slice(i, i + 2), 16));
  const out = [r, g, b].map((v, i) => Math.round(v * a + base[i] * (1 - a)));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** WCAG contrast ratio between two colours, the first composited on `ground`. */
export function contrast(fg: string, bg: string, ground = bg): number {
  const [x, y] = [luminance(flatten(fg, ground)), luminance(flatten(bg, ground))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** WCAG AA for text; 3:1 is the floor for a control's edge or a mark. */
export const AA = 4.5;
export const AA_NON_TEXT = 3;

/**
 * The same theme, one step deeper: for a modal or a sheet, which sits on
 * `paperDeep` rather than the page.
 *
 * On that ground Washi's muted ink measures 4.22:1 — under AA — so muted text
 * steps up to `inkSoft` wherever the palette's own `inkMuted` would fall
 * short, and stays itself where it does not. `paperDeep` becomes the page, and
 * a pressed row on it deepens to `paperEdge`.
 */
export function deepen<T extends Palette>(p: T): T {
  const ground = p.colors.paperDeep;
  const muted =
    contrast(p.colors.inkMuted, ground) >= AA ? p.colors.inkMuted : p.colors.inkSoft;
  return {
    ...p,
    colors: {
      ...p.colors,
      paper: ground,
      paperDeep: p.colors.paperEdge,
      inkMuted: muted,
    },
  };
}

/**
 * How a selected chip is drawn.
 *
 * The design system asks for the accent on its soft wash, which measures
 * 4.02:1 on Sumi and 4.48:1 on Washi. So the paper families write the label
 * in ink on the wash and keep the accent for the chip's edge and a small
 * square mark; LifeOS fills the chip with the accent, where its own onAccent
 * clears AA in both looks.
 */
export function chipSelected(p: Palette): { fill: string; edge: string; text: string } {
  if (p.family === 'lifeos') {
    return { fill: p.colors.seal, edge: p.colors.seal, text: p.colors.onAccent };
  }
  return { fill: p.colors.sealSoft, edge: p.colors.seal, text: p.colors.ink };
}
