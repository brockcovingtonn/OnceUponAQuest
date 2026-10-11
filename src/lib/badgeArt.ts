import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Placeholder art until Step 9 adds the original badge illustrations.
// Keys come from badges.art_key in the database.
const badgeIcons: Record<string, IconName> = {
  badge_window: 'albums-outline',
  badge_lamp: 'bulb-outline',
  badge_magnifier: 'search-outline',
  badge_envelope: 'mail-outline',
};

export function badgeIcon(artKey: string | null | undefined): IconName {
  return (artKey && badgeIcons[artKey]) || 'ribbon-outline';
}
