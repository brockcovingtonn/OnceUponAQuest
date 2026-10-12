import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useMyBlocks, useUnblockUser } from '@/lib/queries';
import { colors, minTouchTarget, spacing, type } from '@/theme';

export default function BlockedScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const blocks = useMyBlocks(userId);
  const unblock = useUnblockUser(userId);

  if (blocks.isPending) return <StateView kind="loading" />;
  if (blocks.isError) return <StateView kind="error" message={copy.blocked.loadError} onRetry={() => blocks.refetch()} />;
  if (blocks.data.length === 0) return <StateView kind="empty" message={copy.blocked.empty} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {blocks.data.map((b) => {
        const name = b.username ? `@${b.username}` : copy.blocked.hidden;
        return (
          <View key={b.id} style={styles.row}>
            <ProfileAvatar avatarKey={b.avatarKey} avatarPath={b.avatarUrl} size={40} />
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Button
              variant="secondary"
              label={copy.blocked.unblockShort}
              accessibilityHint={copy.blocked.unblock(b.username ?? '')}
              onPress={() => unblock.mutate(b.id)}
              disabled={unblock.isPending}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.parchment,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 8,
  },
  name: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
});
