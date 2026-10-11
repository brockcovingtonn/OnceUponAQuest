import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { StampAvatar } from '@/components/StampAvatar';
import { copy } from '@/copy';
import { stampAvatars } from '@/lib/avatars';
import type { AvatarChoice } from '@/lib/useAvatarChoice';
import { colors, radius, spacing } from '@/theme';

type Props = {
  choice: AvatarChoice;
  onSelectStamp: (key: string) => void;
  onSelectPhoto: () => void;
  onPickPhoto: () => void;
  picking?: boolean;
};

/** The 8 stamp avatars plus "Use my own photo". Exactly one option is selected. */
export function AvatarPicker({ choice, onSelectStamp, onSelectPhoto, onPickPhoto, picking }: Props) {
  const hasPhoto = Boolean(choice.photo);
  return (
    <View style={styles.wrapper}>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {hasPhoto ? (
          <Pressable
            onPress={onSelectPhoto}
            accessibilityRole="radio"
            accessibilityLabel={copy.avatarPhoto.optionLabel}
            accessibilityState={{ selected: choice.mode === 'photo' }}
            style={[styles.option, choice.mode === 'photo' && styles.selected]}>
            <ProfileAvatar
              avatarKey={choice.stampKey}
              avatarPath={choice.photo?.path}
              localUri={choice.photo?.localUri}
              size={56}
            />
          </Pressable>
        ) : null}
        {stampAvatars.map((avatar) => {
          const selected = choice.mode === 'stamp' && avatar.key === choice.stampKey;
          return (
            <Pressable
              key={avatar.key}
              onPress={() => onSelectStamp(avatar.key)}
              accessibilityRole="radio"
              accessibilityLabel={avatar.label}
              accessibilityState={{ selected }}
              style={[styles.option, selected && styles.selected]}>
              <StampAvatar avatar={avatar} size={56} />
            </Pressable>
          );
        })}
      </View>
      <Button
        variant="secondary"
        label={hasPhoto ? copy.avatarPhoto.change : copy.avatarPhoto.use}
        onPress={onPickPhoto}
        loading={picking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
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
