import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { StampAvatar as StampAvatarData } from '@/lib/avatars';
import { colors } from '@/theme';

/** Round "passport stamp" avatar. Placeholder art until Step 9. */
export function StampAvatar({ avatar, size = 56 }: { avatar: StampAvatarData; size?: number }) {
  return (
    <View
      style={[
        styles.stamp,
        { width: size, height: size, borderRadius: size / 2, borderColor: avatar.color },
      ]}>
      <View
        style={[
          styles.inner,
          { width: size - 10, height: size - 10, borderRadius: (size - 10) / 2, borderColor: avatar.color },
        ]}>
        <Ionicons name={avatar.icon} size={size * 0.45} color={avatar.color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
  },
  inner: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
