import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { sceneForQuest } from '@/art/scenes';
import { Scene } from '@/components/Scene';
import { useStorageImage } from '@/lib/storageImage';

type Props = {
  slug: string;
  /** Founder's cover photo in the spot-photos bucket, once it exists. */
  coverPhotoPath?: string | null;
  height: number;
  style?: ViewStyle;
};

/** Quest cover: the founder's photo when there is one, otherwise the quest's storybook scene. */
export function QuestCover({ slug, coverPhotoPath, height, style }: Props) {
  const photo = useStorageImage('spot-photos', coverPhotoPath);
  if (photo) {
    return (
      <View style={[styles.box, { height }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      </View>
    );
  }
  return <Scene shapes={sceneForQuest(slug)} height={height} style={style} />;
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    width: '100%',
  },
});
