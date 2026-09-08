import { PixelRatio } from 'react-native';

/**
 * Design tokens — the StreakMates brand system.
 *
 * The one file in the theme that touches the platform, and the one place
 * everything else imports from. Colour lives in ./palette and type in
 * ./type-scale, both pure and both directly testable; this re-exports them so
 * no screen has to know the split exists.
 *
 * See ./palette for the rules the colours follow.
 */
export * from './palette';
export * from './type-scale';

import { buildTypography } from './type-scale';

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
 * Real padding that brings a line of text up to `hit`, rather than hitSlop.
 *
 * hitSlop is the obvious tool and it is the wrong one here: react-native-web
 * does not implement it at all, so every text control in this app measured
 * 14px tall in a browser — the exact height of its own glyphs — while looking
 * correct on a phone. "See all", "+ Add", "Clear", "Edit habit" and every
 * back arrow were affected.
 *
 * Padding works on all three platforms and is visible to a layout inspector,
 * which is the other half of why it is better. Spread it into a Pressable's
 * style; `marginVertical` cancels the space it adds so surrounding layout is
 * unchanged.
 *
 *   line height 14  ->  15 above and below  ->  44
 */
export function tapPadding(lineHeight: number) {
  const pad = Math.max(0, Math.ceil((hit - lineHeight) / 2));
  return { paddingVertical: pad, marginVertical: -pad } as const;
}

/** The same idea horizontally, for a short label like "+ Add". */
export function tapPaddingX(width: number) {
  const pad = Math.max(0, Math.ceil((hit - width) / 2));
  return { paddingHorizontal: pad, marginHorizontal: -pad } as const;
}

export const typography = buildTypography(PixelRatio.getFontScale());

