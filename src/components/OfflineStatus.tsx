import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { useIsOnline } from '@/lib/network';
import { useOfflineQueue } from '@/lib/offlineQueue';
import { colors, radius, spacing, type } from '@/theme';

/** Offline / syncing / synced notice. Renders nothing when there's nothing to say. */
export function OfflineStatus() {
  const online = useIsOnline();
  const { waitingCount, syncing, lastSync, dismissLastSync } = useOfflineQueue();

  if (!online) {
    return (
      <View style={[styles.box, styles.offline]} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={styles.row}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.parchment} />
          <Text style={[styles.text, styles.light]}>{copy.offline.banner}</Text>
        </View>
        {waitingCount > 0 ? <Text style={[styles.detail, styles.light]}>{copy.offline.waiting(waitingCount)}</Text> : null}
      </View>
    );
  }

  if (syncing) {
    return (
      <View style={styles.box} accessibilityLiveRegion="polite">
        <Text style={styles.text}>{copy.offline.syncing}</Text>
      </View>
    );
  }

  if (lastSync) {
    return (
      <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
        {lastSync.syncedCount > 0 ? <Text style={styles.text}>{copy.offline.synced(lastSync.syncedCount)}</Text> : null}
        {lastSync.failedCount > 0 ? <Text style={styles.text}>{copy.offline.needsLook(lastSync.failedCount)}</Text> : null}
        {lastSync.badges.length > 0 ? <Text style={styles.text}>{copy.offline.badgeEarned}</Text> : null}
        <View style={styles.actions}>
          {lastSync.badges.map((slug) => (
            <Button
              key={slug}
              label={copy.offline.seeBadge}
              onPress={() => {
                dismissLastSync();
                router.push({ pathname: '/badge/[slug]', params: { slug } });
              }}
            />
          ))}
          <Button variant="text" label={copy.offline.dismiss} onPress={dismissLastSync} />
        </View>
      </View>
    );
  }

  if (waitingCount > 0) {
    return (
      <View style={styles.box} accessibilityLiveRegion="polite">
        <Text style={styles.text}>{copy.offline.waiting(waitingCount)}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  offline: {
    backgroundColor: colors.midnight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  text: {
    ...type.label,
    color: colors.ink,
    flexShrink: 1,
  },
  detail: {
    ...type.caption,
    color: colors.ink,
  },
  light: {
    color: colors.parchment,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
