/**
 * The palette: colour, and the rules for spending it.
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

/**
 * One colour, part-way along a set of stops.
 *
 * For the places that need a gradient spread across several separate objects
 * rather than drawn inside one. The day's progress is the case that prompted
 * it: filling each tick with the whole four-stop sweep gave a row of tiny
 * identical rainbows instead of one gradient crossing the row, which is the
 * opposite of a brand moment.
 *
 * `t` is clamped, so a caller need not special-case a single tick.
 */
export function sampleGradient(stops: readonly string[], t: number): string {
  if (stops.length === 0) throw new Error('sampleGradient needs at least one stop');
  if (stops.length === 1) return stops[0];

  const at = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const span = at * (stops.length - 1);
  const i = Math.min(Math.floor(span), stops.length - 2);
  const f = span - i;

  const channels = (hex: string) =>
    [0, 2, 4].map((o) => parseInt(hex.slice(1 + o, 3 + o), 16));
  const a = channels(stops[i]);
  const b = channels(stops[i + 1]);

  return (
    '#' +
    a
      .map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, '0'))
      .join('')
  );
}

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
