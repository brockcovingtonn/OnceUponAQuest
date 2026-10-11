import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type StampAvatar = {
  key: string;
  label: string;
  icon: IconName;
  color: string;
};

// Placeholder art until Step 9 adds the 8 original stamp illustrations.
// Keys are stored in profiles.avatar_key, so keep them stable.
export const stampAvatars: StampAvatar[] = [
  { key: 'stamp_lamp', label: 'Lamp stamp', icon: 'bulb-outline', color: colors.storybookGold },
  { key: 'stamp_key', label: 'Key stamp', icon: 'key-outline', color: colors.rose },
  { key: 'stamp_compass', label: 'Compass stamp', icon: 'compass-outline', color: colors.fern },
  { key: 'stamp_star', label: 'Star stamp', icon: 'star-outline', color: colors.midnight },
  { key: 'stamp_leaf', label: 'Leaf stamp', icon: 'leaf-outline', color: colors.fern },
  { key: 'stamp_map', label: 'Map stamp', icon: 'map-outline', color: colors.midnight },
  { key: 'stamp_bell', label: 'Bell stamp', icon: 'notifications-outline', color: colors.storybookGold },
  { key: 'stamp_book', label: 'Book stamp', icon: 'book-outline', color: colors.rose },
];
