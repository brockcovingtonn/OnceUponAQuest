import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StampAvatar } from '@/components/StampAvatar';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { avatarFor } from '@/lib/avatars';
import {
  type AddFriendOutcome,
  type FriendProfile,
  useAddFriend,
  useFriendships,
  useLeaderboard,
  useRespondToRequest,
} from '@/lib/queries';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type AddMessage = { text: string; tone: 'info' | 'error' };

function outcomeMessage(outcome: AddFriendOutcome, username: string): AddMessage {
  return {
    text: copy.friends.outcomes[outcome](username),
    tone: outcome === 'sent' || outcome === 'they_asked' ? 'info' : 'error',
  };
}

function IconButton({
  icon,
  label,
  onPress,
  disabled,
  tone,
}: {
  icon: 'checkmark' | 'close';
  label: string;
  onPress: () => void;
  disabled: boolean;
  tone: 'accept' | 'decline';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'accept' ? styles.acceptButton : styles.declineButton,
        (pressed || disabled) && styles.pressed,
      ]}>
      <Ionicons name={icon} size={22} color={tone === 'accept' ? colors.midnight : colors.ink} />
    </Pressable>
  );
}

function PersonRow({ friend, children }: { friend: FriendProfile; children: ReactNode }) {
  return (
    <View style={styles.personRow}>
      <StampAvatar avatar={avatarFor(friend.avatarKey)} size={40} />
      <Text style={styles.personName} numberOfLines={1}>
        @{friend.username}
      </Text>
      {children}
    </View>
  );
}

export default function FriendsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const friendships = useFriendships(userId);
  const leaderboard = useLeaderboard(userId);
  const addFriend = useAddFriend(userId);
  const respond = useRespondToRequest(userId);
  const [username, setUsername] = useState('');
  const [addMessage, setAddMessage] = useState<AddMessage>();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([friendships.refetch(), leaderboard.refetch()]);
    setRefreshing(false);
  }

  function sendRequest() {
    const name = username.trim().replace(/^@/, '');
    if (!name) return;
    setAddMessage(undefined);
    addFriend.mutate(name, {
      onSuccess: (outcome) => {
        setAddMessage(outcomeMessage(outcome, name));
        if (outcome === 'sent') setUsername('');
      },
      onError: () => setAddMessage({ text: copy.common.networkError, tone: 'error' }),
    });
  }

  let body;
  if (friendships.isPending || leaderboard.isPending) {
    body = <StateView kind="loading" />;
  } else if (friendships.isError || leaderboard.isError) {
    body = <StateView kind="error" message={copy.friends.loadError} onRetry={refresh} />;
  } else {
    const { incoming, outgoing } = friendships.data;
    const rows = leaderboard.data;
    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.friends.title}
        </Text>

        <View style={styles.addRow}>
          <Input
            label={copy.friends.addLabel}
            prefix="@"
            placeholder={copy.friends.addPlaceholder}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setAddMessage(undefined);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={sendRequest}
            maxLength={25}
          />
          <Button
            label={copy.friends.add}
            onPress={sendRequest}
            disabled={username.trim() === ''}
            loading={addFriend.isPending}
          />
          {addMessage ? <Banner tone={addMessage.tone} message={addMessage.text} /> : null}
        </View>

        {incoming.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader} accessibilityRole="header">
              {copy.friends.requests(incoming.length)}
            </Text>
            {incoming.map((friend) => (
              <PersonRow key={friend.id} friend={friend}>
                <IconButton
                  icon="checkmark"
                  tone="accept"
                  label={copy.friends.accept(friend.username)}
                  disabled={respond.isPending}
                  onPress={() => respond.mutate({ requesterId: friend.id, accept: true })}
                />
                <IconButton
                  icon="close"
                  tone="decline"
                  label={copy.friends.decline(friend.username)}
                  disabled={respond.isPending}
                  onPress={() => respond.mutate({ requesterId: friend.id, accept: false })}
                />
              </PersonRow>
            ))}
            {respond.isError ? <Banner message={copy.common.networkError} /> : null}
          </View>
        ) : null}

        {outgoing.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader} accessibilityRole="header">
              {copy.friends.sent}
            </Text>
            {outgoing.map((friend) => (
              <PersonRow key={friend.id} friend={friend}>
                <Text style={styles.waiting}>{copy.friends.waiting}</Text>
              </PersonRow>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionHeader} accessibilityRole="header">
            {copy.friends.leaderboard}
          </Text>
          {rows.map((row, index) => {
            const name = row.isMe ? copy.friends.you : row.username;
            return (
              <View
                key={row.userId}
                style={[styles.leaderRow, row.isMe && styles.leaderRowMe]}
                accessible
                accessibilityLabel={copy.friends.rowLabel(index + 1, name, row.spotsFound, row.badges)}>
                <Text style={styles.rank}>{index + 1}</Text>
                <StampAvatar avatar={avatarFor(row.avatarKey)} size={40} />
                <Text style={[styles.personName, row.isMe && styles.meName]} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.stats}>
                  <Text style={styles.statsText}>{copy.friends.stats(row.spotsFound, row.badges)}</Text>
                  <Ionicons name="ribbon" size={16} color={colors.storybookGold} />
                </View>
              </View>
            );
          })}
          {rows.length <= 1 ? <Text style={styles.empty}>{copy.friends.empty}</Text> : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  addRow: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    ...type.label,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 8,
  },
  personName: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  meName: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  waiting: {
    ...type.label,
    color: colors.inkMuted,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.storybookGold,
  },
  declineButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  leaderRowMe: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.storybookGold,
  },
  rank: {
    ...type.bodyStrong,
    color: colors.inkMuted,
    minWidth: 20,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statsText: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  empty: {
    ...type.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
