import { type ReactNode, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import {
  type SpotDetail,
  useAdminSpotAnswers,
  useAdminUpdateQuestContent,
  useAdminUpdateSpotContent,
} from '@/lib/queries';
import { colors, spacing, type } from '@/theme';

const c = copy.editContent;

function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** Admin form for a spot's text, answers, parade flag and radius. */
export function EditSpotSheet({ spot, visible, onClose, onSaved }: { spot: SpotDetail; visible: boolean; onClose: () => void; onSaved: () => void }) {
  const isAnswer = spot.method === 'answer';
  const answers = useAdminSpotAnswers(spot.id, visible && isAnswer);
  if (!visible) return null;
  return (
    <Sheet visible={visible} title={c.titleSpot} onClose={onClose}>
      {isAnswer && answers.isPending ? (
        <StateView kind="loading" />
      ) : (
        <EditSpotForm
          key={answers.dataUpdatedAt}
          spot={spot}
          initialAnswers={answers.data ?? []}
          isAnswer={isAnswer}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Sheet>
  );
}

function EditSpotForm({
  spot,
  initialAnswers,
  isAnswer,
  onClose,
  onSaved,
}: {
  spot: SpotDetail;
  initialAnswers: string[];
  isAnswer: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const update = useAdminUpdateSpotContent(spot.id);
  const [teaser, setTeaser] = useState(spot.teaser);
  const [title, setTitle] = useState(spot.title);
  const [whereToStand, setWhereToStand] = useState(spot.where_to_stand);
  const [clue, setClue] = useState(spot.clue);
  const [hint, setHint] = useState(spot.hint ?? '');
  const [prompt, setPrompt] = useState(spot.prompt);
  const [holidayNote, setHolidayNote] = useState(spot.holiday_note ?? '');
  const [answers, setAnswers] = useState(initialAnswers.join('\n'));
  const [pause, setPause] = useState(spot.pause_during_parades);
  const [radius, setRadius] = useState(String(spot.radius_m));
  const [error, setError] = useState<string>();

  function save() {
    const radiusM = Number.parseInt(radius, 10);
    const answerList = answers.split('\n').map((a) => a.trim()).filter(Boolean);
    if (!Number.isFinite(radiusM) || radiusM < 10 || radiusM > 200) return setError(c.badRadius);
    if (isAnswer && answerList.length === 0) return setError(c.needsAnswer);
    setError(undefined);
    update.mutate(
      {
        teaser,
        title,
        where_to_stand: whereToStand,
        clue,
        hint,
        prompt,
        holiday_note: holidayNote,
        pause_during_parades: pause,
        radius_m: radiusM,
        ...(isAnswer ? { accepted_answers: answerList } : {}),
      },
      { onSuccess: onSaved, onError: () => setError(c.failed) },
    );
  }

  return (
    <>
      <Input label={c.teaser} value={teaser} onChangeText={setTeaser} />
      <Input label={c.title} value={title} onChangeText={setTitle} />
      <Input label={c.whereToStand} value={whereToStand} onChangeText={setWhereToStand} multiline />
      <Input label={c.clue} value={clue} onChangeText={setClue} multiline />
      <Input label={c.hint} value={hint} onChangeText={setHint} multiline />
      <Input label={c.prompt} value={prompt} onChangeText={setPrompt} />
      {isAnswer ? (
        <>
          <Input
            label={c.answers}
            value={answers}
            onChangeText={setAnswers}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.help}>{c.answersHelp}</Text>
        </>
      ) : null}
      <Input label={c.holidayNote} value={holidayNote} onChangeText={setHolidayNote} multiline />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{c.pauseDuringParades}</Text>
        <Switch
          value={pause}
          onValueChange={setPause}
          accessibilityLabel={c.pauseDuringParades}
          trackColor={{ false: colors.border, true: colors.storybookGold }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      </View>
      <Input label={c.radius} value={radius} onChangeText={setRadius} keyboardType="number-pad" />
      {error ? <Banner message={error} /> : null}
      <Button label={c.save} onPress={save} loading={update.isPending} />
      <Button variant="secondary" label={c.cancel} onPress={onClose} />
    </>
  );
}

/** Admin form for a quest's title and story intro. */
export function EditQuestSheet({
  quest,
  visible,
  onClose,
  onSaved,
}: {
  quest: { id: string; title: string; story: string | null };
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const update = useAdminUpdateQuestContent(quest.id);
  const [title, setTitle] = useState(quest.title);
  const [story, setStory] = useState(quest.story ?? '');
  const [error, setError] = useState(false);
  return (
    <Sheet visible={visible} title={c.titleQuest} onClose={onClose}>
      <Input label={c.questTitle} value={title} onChangeText={setTitle} />
      <Input label={c.story} value={story} onChangeText={setStory} multiline />
      {error ? <Banner message={c.failed} /> : null}
      <Button
        label={c.save}
        onPress={() => {
          setError(false);
          update.mutate({ title, story }, { onSuccess: onSaved, onError: () => setError(true) });
        }}
        loading={update.isPending}
      />
      <Button variant="secondary" label={c.cancel} onPress={onClose} />
    </Sheet>
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
  help: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: -spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchLabel: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
});
