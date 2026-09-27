/**
 * The faces each family needs, loaded only when that family is in use.
 *
 * Cormorant Garamond and Inter together are about 2.3 MB, and DM Sans a
 * tenth of that. Loading every family up front would make someone on LifeOS
 * download Cormorant for nothing, so ThemeChoice loads the chosen family's
 * faces before the first frame, and another family's the moment it is picked.
 *
 * Each weight is imported from its own path. The package index requires every
 * weight the family has, which would ship all ten Cormorant files in the app.
 *
 * Shippori Mincho, the NavySum CJK face, is deliberately absent: it is 8.4 MB,
 * and the only Japanese in StreakMates is the 連 on the seal, which is an
 * image drawn by scripts/make-icons.mjs.
 */
import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond/300Light';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { DMSans_300Light } from '@expo-google-fonts/dm-sans/300Light';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_400Regular_Italic } from '@expo-google-fonts/dm-sans/400Regular_Italic';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import type { ThemeFamily } from './palette';

/** Registered under the names src/theme/palette.ts refers to. */
const paper = {
  CormorantGaramond_300Light,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  Inter_400Regular,
  Inter_500Medium,
};

const lifeos = {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_600SemiBold,
};

export const FONTS: Record<ThemeFamily, Record<string, number>> = {
  washi: paper,
  aizome: paper,
  lifeos,
};
