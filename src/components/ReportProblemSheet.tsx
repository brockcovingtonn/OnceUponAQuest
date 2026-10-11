import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { copy } from '@/copy';
import { type ReportReason, useReportSpot } from '@/lib/queries';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

const REASONS: ReportReason[] = ['spot_changed', 'unsafe', 'answer_wrong', 'other'];

type Props = {
  spotId: string;
  visible: boolean;
  onClose: () => void;
  onSent: () => void;
};

export function ReportProblemSheet({ spotId, visible, onClose, onSent }: Props) {
  const [reason, setReason] = useState<ReportReason>();
  const [note, setNote] = useState('');
  const report = useReportSpot();

  function close() {
    setReason(undefined);
    setNote('');
    report.reset();
    onClose();
  }

  function send() {
    if (!reason) return;
    report.mutate(
      { spotId, reason, note },
      {
        onSuccess: () => {
          setReason(undefined);
          setNote('');
          onSent();
        },
      },
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">
            {copy.report.title}
          </Text>
          <Text style={styles.body}>{copy.report.intro}</Text>

          <View accessibilityRole="radiogroup">
            {REASONS.map((r) => {
              const selected = r === reason;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  accessibilityRole="radio"
                  accessibilityLabel={copy.report.reasons[r]}
                  accessibilityState={{ selected }}
                  style={[styles.option, selected && styles.optionSelected]}>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={colors.midnight}
                  />
                  <Text style={styles.optionText}>{copy.report.reasons[r]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label={copy.report.noteLabel}
            placeholder={copy.report.notePlaceholder}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />

          {report.isError ? <Banner message={copy.common.networkError} /> : null}

          <Button label={copy.report.send} onPress={send} disabled={!reason} loading={report.isPending} />
          <Button variant="secondary" label={copy.report.cancel} onPress={close} />
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
