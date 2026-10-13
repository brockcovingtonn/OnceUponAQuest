import Ionicons from '@expo/vector-icons/Ionicons';
import { onlineManager } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CheckInCard, type CheckInSubmission } from '@/components/CheckInCard';
import { OfflineStatus } from '@/components/OfflineStatus';
import { SpotFieldTools } from '@/components/FieldTools';
import { ReportProblemSheet } from '@/components/ReportProblemSheet';
import { SpotPhoto } from '@/components/SpotPhoto';
import { Stamp } from '@/components/Stamp';
import { StampCelebration } from '@/components/StampCelebration';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { formatDate } from '@/lib/format';
import {
  type Coords,
  distanceMeters,
  getCurrentCoords,
  getLocationPermission,
  LOCATION_TOLERANCE_M,
  openAppSettings,
  requestLocationPermission,
} from '@/lib/location';
import { fieldToolsEnabled } from '@/lib/fieldTools';
import { isNetworkError } from '@/lib/network';
import { useOfflineQueue, useQueuedCheckIn } from '@/lib/offlineQueue';
import { useParadeMode } from '@/lib/paradeMode';
import { uploadCheckinPhoto } from '@/lib/photos';
import { type CheckInResult, useCheckIn, useIsAdmin, useMyProgress, useSpot } from '@/lib/queries';
import { colors, radius, spacing, type } from '@/theme';

const CELEBRATION_MS = 1400;
const MISSES_BEFORE_HINT = 2;

type LocationIssue =
  | { kind: 'explain' }
  | { kind: 'denied' }
  | { kind: 'tooFar'; meters: number }
  | { kind: 'unavailable' };

type Feedback = { text: string; tone: 'error' | 'info' | 'warning'; showSettings?: boolean };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const spot = useSpot(id);
  const progress = useMyProgress(userId);
  const { paradeMode } = useParadeMode();
  const checkIn = useCheckIn(userId);
  const fx = useFeedback();
  const isAdmin = useIsAdmin(userId);
  const offlineQueue = useOfflineQueue();
  const queued = useQueuedCheckIn(id);

  const [submitting, setSubmitting] = useState(false);
  const [misses, setMisses] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [locationIssue, setLocationIssue] = useState<LocationIssue>();
  const [celebrating, setCelebrating] = useState<'stamped' | 'saved' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const pendingSubmission = useRef<CheckInSubmission | null>(null);

  if (spot.isPending || progress.isPending) return <StateView kind="loading" />;
  if (spot.isError || progress.isError) {
    return (
      <StateView
        kind="error"
        message={copy.spot.loadError}
        onRetry={() => {
          spot.refetch();
          progress.refetch();
        }}
      />
    );
  }
  if (!spot.data) return <StateView kind="empty" message={copy.spot.notFound} />;

  const s = spot.data;
  const foundAt = progress.data.foundSpots.get(s.id);
  const paused = !foundAt && paradeMode && s.pause_during_parades;
  const total = s.quest.spots[0]?.count ?? 0;

  async function celebrate(result: Extract<CheckInResult, { ok: true }>) {
    fx.stamp();
    setCelebrating('stamped');
    await delay(CELEBRATION_MS);
    if (result.questComplete && result.badgeSlug) {
      router.replace({ pathname: '/badge/[slug]', params: { slug: result.badgeSlug } });
    } else {
      router.back();
    }
  }

  /** No signal: keep the check-in on the phone; it syncs (and is checked) when the connection returns. */
  async function saveForLater(submission: CheckInSubmission, coords: Coords | undefined) {
    await offlineQueue.enqueue({
      spotId: s.id,
      questSlug: s.quest.slug,
      spotName: s.teaser,
      answer: submission.answer,
      photo: submission.photo,
      lat: coords?.lat,
      lng: coords?.lng,
      paradeMode,
    });
    setFeedback({
      text: submission.answer !== undefined ? copy.offline.savedAnswer : copy.offline.savedOther,
      tone: 'info',
    });
    fx.saved();
    setCelebrating('saved');
    await delay(CELEBRATION_MS + 600);
    router.back();
  }

  function showFailure(result: Extract<CheckInResult, { ok: false }>) {
    switch (result.reason) {
      case 'wrong_answer':
        fx.wrong();
        setMisses((m) => m + 1);
        setFeedback({ text: copy.checkInReasons.wrong_answer, tone: 'error' });
        break;
      case 'too_far':
        setLocationIssue({ kind: 'tooFar', meters: result.distanceM ?? 0 });
        break;
      case 'paused':
        setFeedback({ text: copy.checkInReasons.paused, tone: 'warning' });
        break;
      default:
        setFeedback({ text: copy.checkInReasons[result.reason], tone: 'error' });
    }
  }

  async function submit(submission: CheckInSubmission) {
    if (!userId || paused || submitting) return;
    setFeedback(undefined);
    setLocationIssue(undefined);
    setSubmitting(true);
    // Location is captured even without signal (GPS works offline), so it can be checked at sync time.
    let coords: Coords | undefined;
    try {
      if (queued) await offlineQueue.remove(queued.id);
      // Location check only for spots with a GPS pin (set during the field walk).
      if (s.lat !== null && s.lng !== null) {
        const permission = await getLocationPermission();
        if (permission === 'undetermined') {
          pendingSubmission.current = submission;
          setLocationIssue({ kind: 'explain' });
          return;
        }
        if (permission === 'denied') {
          setLocationIssue({ kind: 'denied' });
          return;
        }
        try {
          coords = await getCurrentCoords();
        } catch {
          setLocationIssue({ kind: 'unavailable' });
          return;
        }
        // Check distance before uploading a photo; the server checks again.
        const meters = distanceMeters(coords, { lat: s.lat, lng: s.lng });
        if (meters > s.radius_m + LOCATION_TOLERANCE_M) {
          setLocationIssue({ kind: 'tooFar', meters: Math.round(meters) });
          return;
        }
      }

      if (!onlineManager.isOnline()) {
        await saveForLater(submission, coords);
        return;
      }

      let photoPath: string | undefined;
      if (submission.photo) {
        try {
          photoPath = await uploadCheckinPhoto(userId, s.id, submission.photo);
        } catch (error) {
          if (isNetworkError(error)) await saveForLater(submission, coords);
          else setFeedback({ text: copy.spot.photoFailed, tone: 'error' });
          return;
        }
      }

      const result = await checkIn.mutateAsync({
        spotId: s.id,
        answer: submission.answer,
        lat: coords?.lat,
        lng: coords?.lng,
        photoPath,
        paradeMode,
      });
      if (result.ok) {
        await celebrate(result);
      } else {
        showFailure(result);
      }
    } catch (error) {
      if (isNetworkError(error)) await saveForLater(submission, coords);
      else setFeedback({ text: copy.common.networkError, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithLocation() {
    const granted = await requestLocationPermission();
    const next = pendingSubmission.current;
    pendingSubmission.current = null;
    setLocationIssue(undefined);
    if (!granted) {
      setLocationIssue({ kind: 'denied' });
      return;
    }
    if (next) submit(next);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: s.quest.title,
          headerRight: () => (
            <Text style={styles.position}>{copy.spot.position(s.sort_order, total)}</Text>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <OfflineStatus />
          <SpotPhoto
            photoPath={s.photo_path}
            questSlug={s.quest.slug}
            accessibilityLabel={copy.spot.photoLabel(s.where_to_stand)}
          />
          <Text style={styles.title} accessibilityRole="header">
            {foundAt ? s.title : s.teaser}
          </Text>

          {foundAt ? (
            <View style={styles.foundRow} accessible accessibilityLabel={copy.spot.foundOn(formatDate(foundAt))}>
              <Stamp icon="checkmark" inked size={40} />
              <Text style={styles.foundText}>{copy.spot.foundOn(formatDate(foundAt))}</Text>
            </View>
          ) : null}

          {paused ? <Banner tone="warning" message={copy.paradeMode.banner} /> : null}

          {queued?.status === 'failed' && !foundAt ? (
            <Banner
              message={
                queued.reason === 'wrong_answer' && queued.answer
                  ? copy.offline.failedAnswer(queued.answer)
                  : copy.offline.failedOther(copy.checkInReasons[queued.reason ?? 'not_found'])
              }
            />
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={18} color={colors.midnight} />
              <Text style={styles.sectionTitle}>{copy.spot.whereToStand}</Text>
            </View>
            <Text style={styles.body}>{s.where_to_stand}</Text>
            {!s.verified_on_site ? (
              <View style={styles.sectionHeader}>
                <Ionicons name="compass-outline" size={14} color={colors.inkMuted} />
                <Text style={styles.unverified}>{copy.spot.beingVerified}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.spot.clue}</Text>
            <Text style={styles.body}>{s.clue}</Text>
          </View>

          {s.holiday_note ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{copy.spot.holidayNote}</Text>
              <Text style={styles.body}>{s.holiday_note}</Text>
            </View>
          ) : null}

          {queued?.status === 'waiting' && !foundAt && !celebrating ? (
            <View style={styles.notice}>
              <Text style={styles.sectionTitle}>{copy.offline.savedTitle}</Text>
              <Text style={styles.body}>{copy.offline.pendingNotice}</Text>
            </View>
          ) : null}

          {!foundAt && queued?.status !== 'waiting' ? (
            <>
              {locationIssue?.kind === 'explain' ? (
                <View style={styles.notice}>
                  <Text style={styles.sectionTitle}>{copy.location.explainTitle}</Text>
                  <Text style={styles.body}>{copy.location.explainBody}</Text>
                  <Button label={copy.location.explainContinue} onPress={continueWithLocation} />
                </View>
              ) : null}
              {locationIssue?.kind === 'denied' ? (
                <View style={styles.notice}>
                  <Text style={styles.body}>📍 {copy.location.off}</Text>
                  <Button variant="secondary" label={copy.spot.openSettings} onPress={openAppSettings} />
                </View>
              ) : null}
              {locationIssue?.kind === 'tooFar' ? (
                <Banner tone="info" message={`📍 ${copy.location.tooFar(locationIssue.meters)}`} />
              ) : null}
              {locationIssue?.kind === 'unavailable' ? (
                <Banner tone="info" message={copy.location.unavailable} />
              ) : null}

              <CheckInCard
                method={s.method}
                prompt={s.prompt}
                busy={submitting}
                disabled={paused || submitting}
                wrongAnswerCount={misses}
                onSubmit={submit}
                onCameraDenied={() =>
                  setFeedback({ text: copy.spot.cameraDenied, tone: 'info', showSettings: true })
                }
              />

              {feedback ? (
                <View style={styles.feedback}>
                  <Banner tone={feedback.tone} message={feedback.text} />
                  {feedback.showSettings ? (
                    <Button variant="secondary" label={copy.spot.openSettings} onPress={openAppSettings} />
                  ) : null}
                </View>
              ) : null}

              {s.hint && misses >= MISSES_BEFORE_HINT ? (
                hintShown ? (
                  <View style={styles.notice}>
                    <Text style={styles.sectionTitle}>{copy.spot.hint}</Text>
                    <Text style={styles.body}>{s.hint}</Text>
                  </View>
                ) : (
                  <Button variant="secondary" label={copy.spot.needHint} onPress={() => setHintShown(true)} />
                )
              ) : null}
            </>
          ) : null}

          <Button variant="text" label={`${copy.report.open} ›`} onPress={() => setReportOpen(true)} />

          {fieldToolsEnabled && isAdmin.data ? <SpotFieldTools spot={s} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ReportProblemSheet
        spotId={s.id}
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSent={() => {
          setReportOpen(false);
          setFeedback({ text: copy.report.thanks, tone: 'info' });
        }}
      />

      {celebrating === 'stamped' ? <StampCelebration /> : null}
      {celebrating === 'saved' ? <StampCelebration icon="hourglass-outline" label={copy.offline.savedTitle} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  position: {
    ...type.label,
    color: colors.inkMuted,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  foundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  foundText: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  unverified: {
    ...type.caption,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  notice: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedback: {
    gap: spacing.sm,
  },
});
