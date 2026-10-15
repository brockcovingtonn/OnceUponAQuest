import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AvatarLook } from '@/art/avatar';
import { AvatarBust } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { copy } from '@/copy';
import type { AvatarChoice } from '@/lib/useAvatarChoice';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  choice: AvatarChoice;
  look: AvatarLook;
  onSelectExplorer: () => void;
  onSelectPhoto: () => void;
  onPickPhoto: () => void;
  picking?: boolean;
};

/** The profile picture: your explorer, or your own photo. Exactly one option is selected. */
export function AvatarPicker({ choice, look, onSelectExplorer, onSelectPhoto, onPickPhoto, picking }: Props) {
  const hasPhoto = Boolean(choice.photo);
  return (
    <View style={styles.wrapper}>
      <View style={styles.grid} accessibilityRole="radiogroup">
        <Pressable
          onPress={onSelectExplorer}
          accessibilityRole="radio"
          accessibilityLabel={copy.avatarPhoto.explorerLabel}
          accessibilityState={{ selected: choice.mode === 'explorer' }}
          style={[styles.option, choice.mode === 'explorer' && styles.selected]}>
          <AvatarBust look={look} size={72} />
          <Text style={styles.caption}>{copy.avatarPhoto.explorerLabel}</Text>
        </Pressable>
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
              size={72}
            />
            <Text style={styles.caption}>{copy.avatarPhoto.optionLabel}</Text>
          </Pressable>
        ) : null}
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
    gap: spacing.md,
  },
  option: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.storybookGold,
  },
  caption: {
    ...type.label,
    color: colors.ink,
  },
});
