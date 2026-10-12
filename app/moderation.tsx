import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { type ModerationAction, type OpenReport, useIsAdmin, useOpenReports, useResolveReport } from '@/lib/queries';
import { colors, radius, spacing, type } from '@/theme';

/** Admin queue of open user reports. The database refuses these actions for non-admins. */
export default function ModerationScreen() {
  const { session } = useAuth();
  const isAdmin = useIsAdmin(session?.user.id);
  const reports = useOpenReports(isAdmin.data === true);
  const resolve = useResolveReport();
  const [error, setError] = useState(false);

  if (isAdmin.isPending || (isAdmin.data && reports.isPending)) return <StateView kind="loading" />;
  if (!isAdmin.data) return <StateView kind="empty" message={copy.moderation.loadError} />;
  if (reports.isError) return <StateView kind="error" message={copy.moderation.loadError} onRetry={() => reports.refetch()} />;

  function act(report: OpenReport, action: ModerationAction) {
    const run = () => {
      setError(false);
      resolve.mutate({ reportId: report.id, action }, { onError: () => setError(true) });
    };
    if (action === 'suspend') {
      Alert.alert(copy.moderation.actions.suspend, copy.moderation.confirmSuspend(report.reported.username), [
        { text: copy.moderation.cancel, style: 'cancel' },
        { text: copy.moderation.confirm, style: 'destructive', onPress: run },
      ]);
    } else {
      run();
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{copy.moderation.intro}</Text>
      {error ? <Banner message={copy.moderation.failed} /> : null}
      {reports.data && reports.data.length === 0 ? <Text style={styles.empty}>{copy.moderation.empty}</Text> : null}
      {reports.data?.map((report) => (
        <View key={report.id} style={styles.card}>
          <View style={styles.header}>
            <ProfileAvatar avatarKey={report.reported.avatarKey} avatarPath={report.reported.avatarUrl} size={72} />
            <View style={styles.who}>
              <Text style={styles.username}>@{report.reported.username}</Text>
              {report.reported.displayName ? <Text style={styles.body}>{report.reported.displayName}</Text> : null}
              <Text style={styles.reason}>{copy.moderation.reasons[report.reason]}</Text>
            </View>
          </View>
          {report.note ? <Text style={styles.body}>“{report.note}”</Text> : null}
          <Text style={styles.meta}>{copy.moderation.reportedBy(report.reporter, formatDate(report.createdAt))}</Text>
          <View style={styles.actions}>
            {report.reported.avatarUrl ? (
              <Button variant="secondary" label={copy.moderation.actions.remove_photo} onPress={() => act(report, 'remove_photo')} disabled={resolve.isPending} />
            ) : null}
            <Button variant="secondary" label={copy.moderation.actions.reset_name} onPress={() => act(report, 'reset_name')} disabled={resolve.isPending} />
            <Button
              variant="secondary"
              label={copy.moderation.actions.suspend}
              onPress={() => act(report, 'suspend')}
              disabled={resolve.isPending}
              labelColor={colors.roseText}
            />
            <Button variant="text" label={copy.moderation.actions.dismiss} onPress={() => act(report, 'dismiss')} disabled={resolve.isPending} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  intro: {
    ...type.label,
    color: colors.inkMuted,
  },
  empty: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  who: {
    flex: 1,
    gap: 2,
  },
  username: {
    ...type.heading,
    color: colors.midnight,
  },
  reason: {
    ...type.bodyStrong,
    color: colors.roseText,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.inkMuted,
  },
  actions: {
    gap: spacing.sm,
  },
});
