import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Panel } from '@/components/FieldTools';
import { Input } from '@/components/Input';
import { copy } from '@/copy';
import {
  LAYER_KEYS,
  type LandmarkDetail,
  type LayerKey,
  useAdminUpdateLandmark,
  useAdminUpdateLandmarkContent,
} from '@/lib/landmarks';
import { getCurrentFix, getLocationPermission, requestLocationPermission } from '@/lib/location';
import { takePhoto, uploadContentPhoto } from '@/lib/photos';
import { colors, spacing, type } from '@/theme';

/** Pins weaker than this get a warning instead of being saved. */
const MAX_PIN_ACCURACY_M = 25;

type Message = { text: string; tone: 'info' | 'error' };

/** Field-walk tools for one landmark: pin, photo, verified flag and story text. */
export function LandmarkFieldTools({ landmark }: { landmark: LandmarkDetail }) {
  const update = useAdminUpdateLandmark(landmark.id);
  const [busy, setBusy] = useState<'pin' | 'photo' | 'verify'>();
  const [message, setMessage] = useState<Message>();
  const [editing, setEditing] = useState(false);

  async function run(kind: 'pin' | 'photo' | 'verify', action: () => Promise<Message | undefined>) {
    setMessage(undefined);
    setBusy(kind);
    try {
      setMessage(await action());
    } catch {
      setMessage({ text: copy.fieldTools.failed, tone: 'error' });
    } finally {
      setBusy(undefined);
    }
  }

  const setPin = () =>
    run('pin', async () => {
      if ((await getLocationPermission()) !== 'granted' && !(await requestLocationPermission())) {
        return { text: copy.location.off, tone: 'error' };
      }
      const fix = await getCurrentFix();
      if (fix.accuracyM !== null && fix.accuracyM > MAX_PIN_ACCURACY_M) {
        return { text: copy.fieldTools.pinWeak(fix.accuracyM), tone: 'error' };
      }
      await update.mutateAsync({ lat: fix.lat, lng: fix.lng });
      return { text: copy.fieldTools.pinSaved(fix.accuracyM), tone: 'info' };
    });

  const takeLandmarkPhoto = () =>
    run('photo', async () => {
      const result = await takePhoto();
      if (result.status === 'denied') return { text: copy.spot.cameraDenied, tone: 'error' };
      if (result.status === 'canceled') return undefined;
      const path = await uploadContentPhoto('landmarks', landmark.id, result.photo);
      await update.mutateAsync({ photoPath: path });
      return { text: copy.fieldTools.photoSaved, tone: 'info' };
    });

  const toggleVerified = () =>
    run('verify', async () => {
      await update.mutateAsync({ verified: !landmark.verified });
      return undefined;
    });

  return (
    <Panel>
      <Text style={styles.body}>
        {landmark.lat !== null && landmark.lng !== null ? copy.fieldTools.pin(landmark.lat, landmark.lng) : copy.fieldTools.landmarkNoPin}
      </Text>
      <Text style={styles.body}>{copy.fieldTools.landmarkRadius(landmark.radiusM)}</Text>
      {landmark.verified ? <Text style={styles.verified}>✓ {copy.fieldTools.verified}</Text> : null}
      <Button label={copy.fieldTools.setPin} onPress={setPin} loading={busy === 'pin'} disabled={Boolean(busy)} />
      <Button
        variant="secondary"
        label={copy.fieldTools.landmarkPhoto}
        onPress={takeLandmarkPhoto}
        loading={busy === 'photo'}
        disabled={Boolean(busy)}
      />
      <Button
        variant="secondary"
        label={landmark.verified ? copy.fieldTools.markUnverified : copy.fieldTools.markVerified}
        onPress={toggleVerified}
        loading={busy === 'verify'}
        disabled={Boolean(busy)}
      />
      <Button variant="secondary" label={copy.editContent.editLandmark} onPress={() => setEditing(true)} disabled={Boolean(busy)} />
      {message ? <Banner tone={message.tone} message={message.text} /> : null}
      {editing ? (
        <EditLandmarkSheet
          landmark={landmark}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setMessage({ text: copy.editContent.saved, tone: 'info' });
          }}
        />
      ) : null}
    </Panel>
  );
}

const c = copy.editContent;

function EditLandmarkSheet({ landmark, onClose, onSaved }: { landmark: LandmarkDetail; onClose: () => void; onSaved: () => void }) {
  const update = useAdminUpdateLandmarkContent(landmark.id);
  const [title, setTitle] = useState(landmark.title);
  const [teaser, setTeaser] = useState(landmark.teaser);
  const [lookFor, setLookFor] = useState(landmark.lookFor);
  const [layers, setLayers] = useState<Record<LayerKey, string>>(() => ({
    architecture: landmark.layers.architecture ?? '',
    story: landmark.layers.story ?? '',
    history: landmark.layers.history ?? '',
    engineering: landmark.layers.engineering ?? '',
  }));
  const [radiusText, setRadiusText] = useState(String(landmark.radiusM));
  const [error, setError] = useState<string>();

  function save() {
    const radiusM = Number.parseInt(radiusText, 10);
    if (!Number.isFinite(radiusM) || radiusM < 10 || radiusM > 300) return setError(c.badLandmarkRadius);
    if (LAYER_KEYS.filter((k) => layers[k].trim()).length < 2) return setError(c.needsTwoLayers);
    setError(undefined);
    update.mutate(
      { title, teaser, look_for: lookFor, ...layers, radius_m: radiusM },
      { onSuccess: onSaved, onError: () => setError(c.failed) },
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle} accessibilityRole="header">
            {c.titleLandmark}
          </Text>
          <Input label={c.landmarkTitle} value={title} onChangeText={setTitle} />
          <Input label={c.landmarkTeaser} value={teaser} onChangeText={setTeaser} />
          <Input label={c.lookFor} value={lookFor} onChangeText={setLookFor} multiline />
          {LAYER_KEYS.map((key) => (
            <Input
              key={key}
              label={c.layer(copy.lens.layers[key])}
              value={layers[key]}
              onChangeText={(text) => setLayers((prev) => ({ ...prev, [key]: text }))}
              multiline
            />
          ))}
          <Input label={c.landmarkRadius} value={radiusText} onChangeText={setRadiusText} keyboardType="number-pad" />
          {error ? <Banner message={error} /> : null}
          <Button label={c.save} onPress={save} loading={update.isPending} />
          <Button variant="secondary" label={c.cancel} onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    ...type.label,
    color: colors.ink,
  },
  verified: {
    ...type.bodyStrong,
    color: colors.fernText,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: {
    ...type.title,
    color: colors.midnight,
  },
});
