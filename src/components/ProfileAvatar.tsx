import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { StampAvatar } from '@/components/StampAvatar';
import { avatarFor } from '@/lib/avatars';
import { useStorageImage } from '@/lib/storageImage';
import { colors } from '@/theme';

type Props = {
  avatarKey: string | null | undefined;
  /** Path in the avatars bucket when the user chose their own photo. */
  avatarPath?: string | null;
  /** A local photo not uploaded yet (onboarding / edit preview). */
  localUri?: string | null;
  size?: number;
};

/** The user's own photo in a gold stamp ring, or their stamp avatar. Decorative: label the parent. */
export function ProfileAvatar({ avatarKey, avatarPath, localUri, size = 56 }: Props) {
  const remote = useStorageImage('avatars', avatarPath);
  const source: ImageSource | null = localUri ? { uri: localUri } : remote;
  if (!source) return <StampAvatar avatar={avatarFor(avatarKey)} size={size} />;
  return (
    <View
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Image
        source={source}
        style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    borderColor: colors.storybookGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
  },
});
