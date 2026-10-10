import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

/** Font assets to load with expo-font's useFonts in the root layout. */
export const fontAssets = {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export const fonts = {
  heading: 'Fraunces_700Bold',
  headingSemiBold: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/** Base sizes. Text still scales with the system font size setting. */
export const type = {
  display: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: fonts.headingSemiBold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
} as const;
