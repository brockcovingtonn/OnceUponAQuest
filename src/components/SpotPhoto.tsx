import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { sceneForQuest } from '@/art/scenes';
import { Scene } from '@/components/Scene';
import { copy } from '@/copy';
import { useStorageImage } from '@/lib/storageImage';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  /** Founder's hint photo in the spot-photos bucket. */
  photoPath: string | null;
  questSlug: string;
  /** Spoken description, e.g. the where-to-stand hint. */
  accessibilityLabel: string;
};

const HEIGHT = 200;

/** The spot's hint photo, or a storybook placeholder until the field-walk photo is uploaded. */
export function SpotPhoto({ photoPath, questSlug, accessibilityLabel }: Props) {
  const photo = useStorageImage('spot-photos', photoPath);
  return (
    <View style={styles.box} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {photo ? (
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      ) : (
        <>
          <Scene shapes={sceneForQuest(questSlug)} height={HEIGHT} />
          <View style={styles.chip}>
            <Text style={styles.chipText}>{copy.spot.photoComingSoon}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.midnight,
  },
  chip: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: 'rgba(27, 35, 64, 0.85)',
  },
  chipText: {
    ...type.caption,
    color: colors.parchment,
  },
});
