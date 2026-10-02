/**
 * The NavySum theme, as the app reads it.
 *
 * This is the design system's `theme.ts`, with the same names — `Theme`,
 * `THEMES`, `FAMILIES`, `resolveTheme`, `space`, `numerals`, `labelStyle` — so
 * a component written for any NavySum app reads the same here. It is split in
 * two for one reason: the textures are `require`d images, which only the
 * bundler understands, and the test runner cannot load them. So colour and
 * type live in pure files (./palette, ./type-scale) that the tests import
 * directly, and this is the one file in the theme that touches the platform.
 */
import type { ImageSourcePropType } from 'react-native';
import {
  PALETTES,
  deepen,
  themeId,
  type Palette,
  type ThemeFamily,
  type ThemeId,
  type ThemeMode,
} from './palette';
import { buildType, type TypeScale } from './type-scale';

export * from './palette';
export * from './type-scale';

export type Theme = Palette & {
  /** Tiled paper texture, or null for a flat background. */
  texture: ImageSourcePropType | null;
  /** The type scale, in this theme's faces. */
  type: TypeScale;
};

/** Textures tile with resizeMode="repeat". LifeOS is flat. */
const TEXTURES: Record<ThemeId, ImageSourcePropType | null> = {
  'washi-light': require('../../assets/washi.png'),
  'washi-dark': require('../../assets/washi-sumi.png'),
  'lifeos-light': null,
  'lifeos-dark': null,
  'aizome-light': require('../../assets/washi-aizome.png'),
  'aizome-dark': require('../../assets/washi-aizome-dark.png'),
};

function build(p: Palette): Theme {
  return { ...p, texture: TEXTURES[p.id], type: buildType(p) };
}

export const THEMES = Object.fromEntries(
  (Object.keys(PALETTES) as ThemeId[]).map((id) => [id, build(PALETTES[id])]),
) as Record<ThemeId, Theme>;

/**
 * Each theme one step deeper, for a modal or a sheet: opaque `paperDeep`, no
 * texture, and muted ink stepped up where it would fall under AA on the deeper
 * ground. The type scale is rebuilt too, because the label carries its colour.
 */
export const DEEP_THEMES = Object.fromEntries(
  (Object.keys(PALETTES) as ThemeId[]).map((id) => [
    id,
    { ...build(deepen(PALETTES[id])), texture: null },
  ]),
) as Record<ThemeId, Theme>;

export function resolveTheme(family: ThemeFamily, mode: ThemeMode, systemDark: boolean): Theme {
  return THEMES[themeId(family, mode, systemDark)];
}
