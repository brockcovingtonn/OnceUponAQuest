import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { getCurrentFix, getLocationPermission, requestLocationPermission } from '@/lib/location';
import { takePhoto, uploadContentPhoto } from '@/lib/photos';
import { type SpotDetail, useAdminSetQuestCover, useAdminUpdateSpot } from '@/lib/queries';
import { colors, radius, spacing, type } from '@/theme';

/** Pins weaker than this get a warning instead of being saved. */
const MAX_PIN_ACCURACY_M = 25;

type Message = { text: string; tone: 'info' | 'error' };

function Panel({ children }: { children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{copy.fieldTools.title}</Text>
      {children}
    </View>
  );
}

/** Field-walk tools for one spot: set its GPS pin, take its hint photo, mark it verified. */
export function SpotFieldTools({ spot }: { spot: SpotDetail }) {
  const update = useAdminUpdateSpot(spot.id);
  const [busy, setBusy] = useState<'pin' | 'photo' | 'verify'>();
  const [message, setMessage] = useState<Message>();

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

  const takeHintPhoto = () =>
    run('photo', async () => {
      const result = await takePhoto();
      if (result.status === 'denied') return { text: copy.spot.cameraDenied, tone: 'error' };
      if (result.status === 'canceled') return undefined;
      const path = await uploadContentPhoto('spots', spot.id, result.photo);
      await update.mutateAsync({ photoPath: path });
      return { text: copy.fieldTools.photoSaved, tone: 'info' };
    });

  const toggleVerified = () =>
    run('verify', async () => {
      await update.mutateAsync({ verified: !spot.verified_on_site });
      return undefined;
    });

  return (
    <Panel>
      <Text style={styles.body}>
        {spot.lat !== null && spot.lng !== null ? copy.fieldTools.pin(spot.lat, spot.lng) : copy.fieldTools.noPin}
      </Text>
      <Text style={styles.body}>{copy.fieldTools.radius(spot.radius_m)}</Text>
      {spot.verified_on_site ? <Text style={styles.verified}>✓ {copy.fieldTools.verified}</Text> : null}
      <Button label={copy.fieldTools.setPin} onPress={setPin} loading={busy === 'pin'} disabled={Boolean(busy)} />
      <Button
        variant="secondary"
        label={copy.fieldTools.hintPhoto}
        onPress={takeHintPhoto}
        loading={busy === 'photo'}
        disabled={Boolean(busy)}
      />
      <Button
        variant="secondary"
        label={spot.verified_on_site ? copy.fieldTools.markUnverified : copy.fieldTools.markVerified}
        onPress={toggleVerified}
        loading={busy === 'verify'}
        disabled={Boolean(busy)}
      />
      {message ? <Banner tone={message.tone} message={message.text} /> : null}
    </Panel>
  );
}

/** Field-walk tool for a quest: take its cover photo. */
export function QuestFieldTools({ questId }: { questId: string }) {
  const setCover = useAdminSetQuestCover(questId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>();

  async function takeCover() {
    setMessage(undefined);
    setBusy(true);
    try {
      const result = await takePhoto();
      if (result.status === 'denied') {
        setMessage({ text: copy.spot.cameraDenied, tone: 'error' });
        return;
      }
      if (result.status === 'canceled') return;
      const path = await uploadContentPhoto('quests', questId, result.photo);
      await setCover.mutateAsync(path);
      setMessage({ text: copy.fieldTools.photoSaved, tone: 'info' });
    } catch {
      setMessage({ text: copy.fieldTools.failed, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <Button variant="secondary" label={copy.fieldTools.coverPhoto} onPress={takeCover} loading={busy} />
      {message ? <Banner tone={message.tone} message={message.text} /> : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.midnight,
    backgroundColor: colors.white,
  },
  title: {
    ...type.label,
    color: colors.midnight,
  },
  body: {
    ...type.label,
    color: colors.ink,
  },
  verified: {
    ...type.bodyStrong,
    color: colors.fernText,
  },
});
