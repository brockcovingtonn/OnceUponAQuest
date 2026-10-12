import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { copy } from '@/copy';
import { useReportUser, type UserReportReason } from '@/lib/queries';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

const REASONS: UserReportReason[] = ['inappropriate_photo', 'offensive_name', 'harassment', 'spam', 'other'];

type Props = {
  /** The person being reported; null hides the sheet. */
  target: { id: string; username: string } | null;
  onClose: () => void;
  onSent: (username: string) => void;
};

export function ReportUserSheet({ target, onClose, onSent }: Props) {
  const [reason, setReason] = useState<UserReportReason>();
  const [note, setNote] = useState('');
  const report = useReportUser();

  function close() {
    setReason(undefined);
    setNote('');
    report.reset();
    onClose();
  }

  function send() {
    if (!target || !reason) return;
    report.mutate(
      { reportedId: target.id, reason, note },
      {
        onSuccess: () => {
          const username = target.username;
          setReason(undefined);
          setNote('');
          onSent(username);
        },
      },
    );
  }

  return (
    <Modal visible={target !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">
            {target ? copy.reportUser.title(target.username) : ''}
          </Text>
          <Text style={styles.body}>{copy.reportUser.intro}</Text>
          <View accessibilityRole="radiogroup">
            {REASONS.map((r) => {
              const selected = r === reason;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  accessibilityRole="radio"
                  accessibilityLabel={copy.reportUser.reasons[r]}
                  accessibilityState={{ selected }}
                  style={[styles.option, selected && styles.optionSelected]}>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.midnight} />
                  <Text style={styles.optionText}>{copy.reportUser.reasons[r]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Input
            label={copy.reportUser.noteLabel}
            placeholder={copy.reportUser.notePlaceholder}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />
          {report.isError ? <Banner message={copy.common.networkError} /> : null}
          <Button label={copy.reportUser.send} onPress={send} disabled={!reason} loading={report.isPending} />
          <Button variant="secondary" label={copy.reportUser.cancel} onPress={close} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: colors.white,
  },
  optionText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
});
