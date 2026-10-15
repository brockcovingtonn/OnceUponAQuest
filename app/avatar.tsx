import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { type AvatarLook, DEFAULT_LOOK, parseLook } from '@/art/avatar';
import { AvatarMaker } from '@/components/AvatarMaker';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { type Profile, useProfile, useSaveLook } from '@/lib/queries';
import { colors, spacing, type } from '@/theme';

/** Make or change your explorer's look. Clothes are changed in the wardrobe. */
export default function AvatarScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile(userId);

  if (profile.isPending) return <StateView kind="loading" />;
  if (profile.isError || !profile.data || !userId) {
    return <StateView kind="error" message={copy.profile.loadError} onRetry={() => profile.refetch()} />;
  }
  return <LookEditor profile={profile.data} userId={userId} />;
}

function LookEditor({ profile, userId }: { profile: Profile; userId: string }) {
  const existing = parseLook(profile.avatar);
  const [look, setLook] = useState<AvatarLook>(existing ?? DEFAULT_LOOK);
  const save = useSaveLook(userId);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {existing ? copy.avatar.changeTitle : copy.avatar.makeTitle}
      </Text>
      {existing ? null : <Text style={styles.body}>{copy.avatar.makeIntro}</Text>}
      <AvatarMaker look={look} onChange={setLook} withStarterOutfit={!existing} />
      {save.isError ? <Banner message={copy.avatar.saveFailed} /> : null}
      <Button
        label={copy.avatar.save}
        loading={save.isPending}
        onPress={() => save.mutate(look, { onSuccess: () => router.back() })}
      />
    </ScrollView>
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
  title: {
    ...type.title,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
});
