import { Pressable, StyleSheet, View } from 'react-native';

import { StampAvatar } from '@/components/StampAvatar';
import { stampAvatars } from '@/lib/avatars';
import { colors, radius, spacing } from '@/theme';

type Props = {
  value: string;
  onChange: (key: string) => void;
};

/** Grid of the 8 stamp avatars; one is always selected. */
export function AvatarPicker({ value, onChange }: Props) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {stampAvatars.map((avatar) => {
        const selected = avatar.key === value;
        return (
          <Pressable
            key={avatar.key}
            onPress={() => onChange(avatar.key)}
            accessibilityRole="radio"
            accessibilityLabel={avatar.label}
            accessibilityState={{ selected }}
            style={[styles.option, selected && styles.selected]}>
            <StampAvatar avatar={avatar} size={56} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    padding: spacing.xs,
    borderRadius: radius.round,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.storybookGold,
  },
});
