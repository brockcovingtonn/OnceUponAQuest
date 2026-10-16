import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { parseLook } from '@/art/avatar';
import { AvatarFigure } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSwitchRow } from '@/components/SettingsSwitchRow';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { StarCount } from '@/components/StarCount';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { openAppSettings } from '@/lib/location';
import { usePreferences } from '@/lib/preferences';
import { getPermissionStatuses, type PermissionStatuses } from '@/lib/permissions';
import { useDeleteAccount, useFieldWalk, useIsAdmin, useOpenReports, useProfile, useWardrobe } from '@/lib/queries';
import { fieldToolsEnabled } from '@/lib/fieldTools';
import { usePassStatus } from '@/lib/purchases';
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
  const prefs = usePreferences();
  const isAdmin = useIsAdmin(userId);
  const openReports = useOpenReports(isAdmin.data === true);
  const fieldWalk = useFieldWalk(fieldToolsEnabled && isAdmin.data === true);
  const walkSpots = fieldWalk.data?.flatMap((q) => q.spots) ?? [];
  const walkDone = walkSpots.filter((s) => s.pinned && s.hasPhoto && s.verified).length;
  const [signingOut, setSigningOut] = useState(false);
  const wardrobe = useWardrobe(userId);
  const pass = usePassStatus(userId);

  if (profile.isPending) return <StateView kind="loading" />;
  if (profile.isError || !profile.data) {
    return <StateView kind="error" message={copy.profile.loadError} onRetry={() => profile.refetch()} />;
  }
  const p = profile.data;
  const look = parseLook(p.avatar);

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
          {look ? (
            <AvatarFigure look={look} size={110} pose="wave" />
          ) : (
            <ProfileAvatar avatarKey={p.avatar_key} avatarPath={p.avatar_url} avatar={p.avatar} size={96} />
          )}
          <Text style={styles.name} accessibilityRole="header">
            {p.display_name ?? p.username}
          </Text>
          {p.display_name ? <Text style={styles.username}>@{p.username}</Text> : null}
          {pass.data?.active ? (
            <View style={styles.passRibbon} accessible accessibilityLabel={copy.pass.name}>
              <Ionicons name="ribbon" size={14} color={colors.midnight} />
              <Text style={styles.passRibbonText}>{copy.pass.chip}</Text>
            </View>
          ) : null}
          <Text style={styles.since}>{copy.profile.exploringSince(p.created_at)}</Text>
          {wardrobe.data ? (
            <StarCount
              count={wardrobe.data.balance}
              onPress={() => router.push('/wardrobe')}
              accessibilityHint={copy.wardrobe.openHint}
              style={styles.stars}
            />
          ) : null}
          {look ? (
            <Button
              label={copy.wardrobe.open}
              accessibilityHint={copy.wardrobe.openHint}
              onPress={() => router.push('/wardrobe')}
              style={styles.editButton}
            />
          ) : (
            <>
              <Banner message={copy.avatar.makeBanner} tone="info" />
              <Button label={copy.avatar.makeBannerButton} onPress={() => router.push('/avatar')} style={styles.editButton} />
            </>
          )}
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
            icon="ribbon-outline"
            label={copy.pass.profileRow}
            value={pass.data?.active ? copy.pass.profileActive : copy.pass.profileGet}
            onPress={() => router.push('/quest-pass')}
          />
          <SettingsSwitchRow
            icon="musical-notes-outline"
            label={copy.profile.sounds}
            hint={copy.profile.soundsHint}
            value={prefs.sounds}
            onChange={(on) => prefs.setPreference('sounds', on)}
          />
          <SettingsSwitchRow
            icon="phone-portrait-outline"
            label={copy.profile.vibration}
            hint={copy.profile.vibrationHint}
            value={prefs.vibration}
            onChange={(on) => {
              prefs.setPreference('vibration', on);
              // Confirm with a tick (the helper still holds the old "off" setting this render).
              if (on) Haptics.selectionAsync().catch(() => {});
            }}
          />
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
          {fieldToolsEnabled && isAdmin.data ? (
            <SettingsRow
              icon="footsteps-outline"
              label={copy.fieldWalk.settingsRow(walkDone, walkSpots.length)}
              onPress={() => router.push('/field-walk')}
            />
          ) : null}
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
  passRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.storybookGold,
  },
  passRibbonText: {
    ...type.caption,
    color: colors.midnight,
  },
  stars: {
    alignSelf: 'center',
    marginTop: spacing.xs,
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
