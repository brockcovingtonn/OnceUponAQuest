import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { AvatarPicker } from '@/components/AvatarPicker';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { avatarFor } from '@/lib/avatars';
import { type Profile, useProfile, useUpdateProfile } from '@/lib/queries';
import { colors, spacing, type } from '@/theme';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile(userId);

  if (profile.isPending) return <StateView kind="loading" />;
  if (profile.isError || !profile.data) {
    return <StateView kind="error" message={copy.profile.loadError} onRetry={() => profile.refetch()} />;
  }
  return <EditProfileForm profile={profile.data} userId={userId} />;
}

function EditProfileForm({ profile, userId }: { profile: Profile; userId: string | undefined }) {
  const update = useUpdateProfile(userId);
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [avatarKey, setAvatarKey] = useState(avatarFor(profile.avatar_key).key);

  function save() {
    update.mutate({ displayName, avatarKey }, { onSuccess: () => router.back() });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.username}>{copy.editProfile.username(profile.username)}</Text>
        <Text style={styles.note}>{copy.editProfile.usernameNote}</Text>

        <Input
          label={copy.editProfile.displayNameLabel}
          placeholder={copy.editProfile.displayNamePlaceholder}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={40}
          autoCorrect={false}
        />

        <Text style={styles.subtitle}>{copy.editProfile.avatarTitle}</Text>
        <AvatarPicker value={avatarKey} onChange={setAvatarKey} />

        {update.isError ? <Banner message={copy.editProfile.saveFailed} /> : null}
        <Button label={copy.editProfile.save} onPress={save} loading={update.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  username: {
    ...type.heading,
    color: colors.midnight,
  },
  note: {
    ...type.label,
    color: colors.inkMuted,
  },
  subtitle: {
    ...type.heading,
    color: colors.midnight,
    marginTop: spacing.sm,
  },
});
