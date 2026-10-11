import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { copy } from '@/copy';
import { type CapturedPhoto, takePhoto } from '@/lib/photos';
import type { Tables } from '@/types/database';
import { colors, radius, spacing, type } from '@/theme';

type Method = Tables<'spots'>['method'];

export type CheckInSubmission = { answer?: string; photo?: CapturedPhoto };

type Props = {
  method: Method;
  prompt: string;
  busy: boolean;
  disabled: boolean;
  /** Changes every time an answer is wrong, to replay the shake. */
  wrongAnswerCount: number;
  onSubmit: (submission: CheckInSubmission) => void;
  onCameraDenied: () => void;
};

/** The bottom card on the spot screen, with one variant per check-in method. */
export function CheckInCard({ method, prompt, busy, disabled, wrongAnswerCount, onSubmit, onCameraDenied }: Props) {
  const [answer, setAnswer] = useState('');
  const [photo, setPhoto] = useState<CapturedPhoto>();
  const shake = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (wrongAnswerCount === 0) return;
    Animated.sequence(
      [10, -10, 8, -8, 4, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true }),
      ),
    ).start();
  }, [wrongAnswerCount, shake]);

  async function capture() {
    const result = await takePhoto();
    if (result.status === 'ok') setPhoto(result.photo);
    if (result.status === 'denied') onCameraDenied();
  }

  const photoPreview = photo ? (
    <Image
      source={{ uri: photo.uri }}
      style={styles.preview}
      accessible
      accessibilityLabel={copy.spot.photoPreviewLabel}
    />
  ) : null;

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX: shake }] }]}>
      <Text style={styles.prompt}>{prompt}</Text>

      {method === 'answer' ? (
        <>
          <Input
            label={copy.spot.answerLabel}
            placeholder={copy.spot.answerPlaceholder}
            value={answer}
            onChangeText={setAnswer}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => answer.trim() && onSubmit({ answer })}
            editable={!disabled}
          />
          <Button
            label={copy.spot.checkIn}
            onPress={() => onSubmit({ answer })}
            disabled={disabled || answer.trim() === ''}
            loading={busy}
          />
        </>
      ) : null}

      {method === 'photo' ? (
        photo ? (
          <>
            {photoPreview}
            <Button
              label={copy.spot.usePhoto}
              onPress={() => onSubmit({ photo })}
              disabled={disabled}
              loading={busy}
            />
            <Button variant="secondary" label={copy.spot.retake} onPress={capture} disabled={busy} />
          </>
        ) : (
          <Button label={copy.spot.takePhoto} onPress={capture} disabled={disabled} />
        )
      ) : null}

      {method === 'listen' ? (
        <>
          <Text style={styles.body}>{copy.spot.listenBody}</Text>
          <Button label={copy.spot.heardIt} onPress={() => onSubmit({})} disabled={disabled} loading={busy} />
        </>
      ) : null}

      {method === 'snack' ? (
        <>
          <Text style={styles.body}>{copy.spot.snackBody}</Text>
          {photo ? (
            <>
              {photoPreview}
              <Button
                variant="text"
                label={copy.spot.removePhoto}
                onPress={() => setPhoto(undefined)}
                disabled={busy}
              />
            </>
          ) : (
            <Button variant="secondary" label={copy.spot.addPhotoOptional} onPress={capture} disabled={disabled} />
          )}
          <Button
            label={copy.spot.stampPassport}
            onPress={() => onSubmit(photo ? { photo } : {})}
            disabled={disabled}
            loading={busy}
          />
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  prompt: {
    ...type.heading,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
});
