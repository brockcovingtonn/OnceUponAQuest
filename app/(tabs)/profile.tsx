import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { SettingsRow } from '@/components/SettingsRow';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { openAppSettings } from '@/lib/location';
import { getPermissionStatuses, type PermissionStatuses } from '@/lib/permissions';
import { useDeleteAccount, useIsAdmin, useOpenReports, useProfile } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, spacing, type } from '@/theme';

/** Permission statuses, refreshed whenever the app comes back from the phone's Settings. */
function usePermissionStatuses(): PermissionStatuses | undefined {
  const [statuses, setStatuses] = useState<PermissionStatuses>();
  const refresh = useCallback(() => {
    getPermissionStatuses()
      .then(setStatuses)
      .catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  return statuses;
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const permissions = usePermissionStatuses();
  const deleteAccount = useDeleteAccount(userId);
  const isAdmin = useIsAdmin(userId);
  const openReports = useOpenReports(isAdmin.data === true);
  const [signingOut, setSigningOut] = useState(false);

  if (profile.isPending) return <StateView kind="loading" />;
  if (profile.isError || !profile.data) {
    return <StateView kind="error" message={copy.profile.loadError} onRetry={() => profile.refetch()} />;
  }
  const p = profile.data;

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  }

  function confirmDelete() {
    Alert.alert(copy.profile.deleteConfirmTitle, copy.profile.deleteConfirmBody, [
      { text: copy.profile.deleteCancel, style: 'cancel' },
      { text: copy.profile.deleteConfirm, style: 'destructive', onPress: () => deleteAccount.mutate() },
    ]);
  }

  const feedbackEmail = copy.feedbackEmail;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ProfileAvatar avatarKey={p.avatar_key} avatarPath={p.avatar_url} size={96} />
          <Text style={styles.name} accessibilityRole="header">
            {p.display_name ?? p.username}
          </Text>
          {p.display_name ? <Text style={styles.username}>@{p.username}</Text> : null}
          <Text style={styles.since}>{copy.profile.exploringSince(p.created_at)}</Text>
          <Button
            variant="secondary"
            label={copy.profile.editProfile}
            onPress={() => router.push('/edit-profile')}
            style={styles.editButton}
          />
        </View>

        <View>
          <Text style={styles.sectionHeader} accessibilityRole="header">
            {copy.profile.settings}
          </Text>
          <SettingsRow
            icon="location-outline"
            label={copy.profile.locationPermission}
            value={permissions ? copy.profile.permissionState[permissions.location] : undefined}
            accessibilityHint={copy.profile.permissionHint}
            onPress={openAppSettings}
          />
          <SettingsRow
            icon="camera-outline"
            label={copy.profile.cameraPermission}
            value={permissions ? copy.profile.permissionState[permissions.camera] : undefined}
            accessibilityHint={copy.profile.permissionHint}
            onPress={openAppSettings}
          />
          <SettingsRow
            icon="hand-left-outline"
            label={copy.blocked.title}
            onPress={() => router.push('/blocked')}
          />
          <SettingsRow
            icon="book-outline"
            label={copy.walkthrough.open}
            accessibilityHint={copy.walkthrough.openHint}
            onPress={() => router.push('/walkthrough')}
          />
          <SettingsRow icon="walk-outline" label={copy.profile.safetyRules} onPress={() => router.push('/safety')} />
          <SettingsRow icon="document-text-outline" label={copy.profile.terms} onPress={() => router.push('/terms')} />
          <SettingsRow icon="lock-closed-outline" label={copy.profile.privacy} onPress={() => router.push('/privacy')} />
          <SettingsRow
            icon="information-circle-outline"
            label={copy.profile.about}
            onPress={() => router.push('/about')}
          />
          {isAdmin.data ? (
            <SettingsRow
              icon="stats-chart-outline"
              label={copy.insights.settingsRow}
              onPress={() => router.push('/insights')}
            />
          ) : null}
          {isAdmin.data ? (
            <SettingsRow
              icon="shield-checkmark-outline"
              label={copy.moderation.settingsRow(openReports.data?.length ?? 0)}
              onPress={() => router.push('/moderation')}
            />
          ) : null}
          {feedbackEmail ? (
            <SettingsRow
              icon="mail-outline"
              label={copy.profile.sendFeedback}
              value={feedbackEmail}
              onPress={() => Linking.openURL(`mailto:${feedbackEmail}`)}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          {deleteAccount.isError ? <Banner message={copy.profile.deleteFailed} /> : null}
          <Button variant="secondary" label={copy.profile.signOut} onPress={signOut} loading={signingOut} />
          <Button
            variant="text"
            label={copy.profile.deleteAccount}
            onPress={confirmDelete}
            loading={deleteAccount.isPending}
            labelColor={colors.roseText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...type.title,
    color: colors.midnight,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  username: {
    ...type.body,
    color: colors.ink,
  },
  since: {
    ...type.label,
    color: colors.inkMuted,
  },
  editButton: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  sectionHeader: {
    ...type.label,
    color: colors.inkMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
