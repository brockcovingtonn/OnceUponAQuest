import Ionicons from '@expo/vector-icons/Ionicons';
import { onlineManager } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { sceneForLand } from '@/art/scenes';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Flourish } from '@/components/Flourish';
import { LandmarkFieldTools } from '@/components/LandmarkFieldTools';
import { LensStamp } from '@/components/LensStamp';
import { OfflineStatus } from '@/components/OfflineStatus';
import { Scene } from '@/components/Scene';
import { StampCelebration } from '@/components/StampCelebration';
import { StateView } from '@/components/StateView';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { fieldToolsEnabled } from '@/lib/fieldTools';
import { formatDate } from '@/lib/format';
import { LAYER_KEYS, type LayerKey, useLandmark, useLandmarks, useMyLensStamps, useStampLandmark } from '@/lib/landmarks';
import { getCurrentCoords, getLocationPermission, requestLocationPermission } from '@/lib/location';
import { isNetworkError } from '@/lib/network';
import { useIsAdmin } from '@/lib/queries';
import { useStorageImage } from '@/lib/storageImage';
import { colors, fonts, minTouchTarget, radius, spacing, type } from '@/theme';

const LAYER_ICONS: Record<LayerKey, keyof typeof Ionicons.glyphMap> = {
  architecture: 'business-outline',
  story: 'book-outline',
  history: 'hourglass-outline',
  engineering: 'construct-outline',
};

const CELEBRATION_MS = 1600;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Message = { text: string; tone: 'info' | 'error' };

export default function LandmarkScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const landmark = useLandmark(slug);
  const all = useLandmarks();
  const stamps = useMyLensStamps(userId);
  const stampMutation = useStampLandmark(userId);
  const isAdmin = useIsAdmin(userId);
  const fx = useFeedback();
  const photo = useStorageImage('spot-photos', landmark.data?.photoPath);
  const [chosenLayer, setChosenLayer] = useState<LayerKey>();
  const [stamping, setStamping] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [message, setMessage] = useState<Message>();

  if (landmark.isPending) return <StateView kind="loading" />;
  if (landmark.isError) return <StateView kind="error" message={copy.lens.loadError} onRetry={() => landmark.refetch()} />;
  if (!landmark.data) return <StateView kind="empty" message={copy.lens.notFound} />;

  const l = landmark.data;
  const layerKeys = LAYER_KEYS.filter((k) => l.layers[k]);
  const layer = chosenLayer && l.layers[chosenLayer] ? chosenLayer : layerKeys[0];
  const stampedAt = stamps.data?.get(l.id);
  const pinned = l.lat !== null && l.lng !== null;
  const siblings = (all.data ?? []).filter((o) => o.land.id === l.land.id && o.id !== l.id);

  async function stamp() {
    setMessage(undefined);
    if (!onlineManager.isOnline()) {
      setMessage({ text: copy.lens.needsSignal, tone: 'info' });
      return;
    }
    setStamping(true);
    try {
      let coords: { lat: number; lng: number } | undefined;
      if (pinned) {
        if ((await getLocationPermission()) !== 'granted' && !(await requestLocationPermission())) {
          setMessage({ text: copy.lens.locationRequired, tone: 'error' });
          return;
        }
        try {
          coords = await getCurrentCoords();
        } catch {
          setMessage({ text: copy.location.unavailable, tone: 'error' });
          return;
        }
      }
      const result = await stampMutation.mutateAsync({ landmarkId: l.id, lat: coords?.lat, lng: coords?.lng });
      if (result.ok) {
        fx.stamp();
        setCelebrating(true);
        await delay(CELEBRATION_MS);
        setCelebrating(false);
        setMessage({ text: copy.lens.stamped, tone: 'info' });
      } else if (result.reason === 'too_far') {
        fx.wrong();
        setMessage({ text: copy.lens.tooFar(result.distanceM ?? 0), tone: 'error' });
      } else if (result.reason === 'location_required') {
        setMessage({ text: copy.lens.locationRequired, tone: 'error' });
      } else {
        setMessage({ text: copy.lens.notFound, tone: 'error' });
      }
    } catch (error) {
      setMessage({ text: isNetworkError(error) ? copy.lens.needsSignal : copy.lens.failed, tone: 'error' });
    } finally {
      setStamping(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <OfflineStatus />
        <View style={styles.cover}>
          {photo ? (
            <View style={styles.photoBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={200} />
            </View>
          ) : (
            <Scene shapes={sceneForLand(l.land.id)} height={180} />
          )}
          <View style={styles.coverTag} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name="aperture-outline" size={14} color={colors.midnight} />
            <Text style={styles.coverTagText}>{copy.lens.name}</Text>
          </View>
        </View>

        <View style={styles.heading}>
          <Text style={styles.land}>{l.land.name.toUpperCase()}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {l.title}
          </Text>
          <Flourish width={160} />
          <Text style={styles.teaser}>{l.teaser}</Text>
          {!l.verified ? (
            <View style={styles.verifyRow}>
              <Ionicons name="compass-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.caption}>{copy.lens.beingVerified}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.lookFor} accessible accessibilityLabel={`${copy.lens.lookFor} ${l.lookFor}`}>
          <Ionicons name="search" size={20} color={colors.midnight} />
          <View style={styles.lookForText}>
            <Text style={styles.lookForTitle}>{copy.lens.lookFor}</Text>
            <Text style={styles.body}>{l.lookFor}</Text>
          </View>
        </View>

        {layer ? (
          <View style={styles.layers}>
            <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel={copy.lens.layersLabel}>
              {layerKeys.map((key) => {
                const active = key === layer;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      fx.tap();
                      setChosenLayer(key);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={copy.lens.layers[key]}
                    style={[styles.tab, active && styles.tabActive]}>
                    <Ionicons name={LAYER_ICONS[key]} size={18} color={active ? colors.parchment : colors.midnight} />
                    <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                      {copy.lens.layers[key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.layerCard} accessibilityLiveRegion="polite">
              <Text style={styles.layerTitle}>{copy.lens.layers[layer]}</Text>
              <Text style={styles.body}>{l.layers[layer]}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.stampRow}>
          <LensStamp stamped={Boolean(stampedAt)} size={64} />
          <View style={styles.stampText}>
            {stampedAt ? (
              <Text style={styles.bodyStrong}>{copy.lens.stampedOn(formatDate(stampedAt))}</Text>
            ) : (
              <>
                <Button label={copy.lens.stamp} onPress={stamp} loading={stamping} />
                <Text style={styles.caption}>{copy.lens.stampHint}</Text>
              </>
            )}
          </View>
        </View>
        {message ? <Banner tone={message.tone} message={message.text} /> : null}

        {l.linkedQuests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.lens.questsHere}</Text>
            {l.linkedQuests.map((q) => (
              <Pressable
                key={q.id}
                onPress={() => router.push({ pathname: '/quest/[slug]', params: { slug: q.slug } })}
                accessibilityRole="button"
                accessibilityLabel={q.title}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Ionicons name="map-outline" size={18} color={colors.midnight} />
                <Text style={styles.rowText}>{q.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {siblings.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.lens.moreInLand(l.land.name)}</Text>
            {siblings.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: '/landmark/[slug]', params: { slug: o.slug } })}
                accessibilityRole="button"
                accessibilityLabel={copy.lens.cardLabel(o.title, o.teaser)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <LensStamp stamped={Boolean(stamps.data?.has(o.id))} size={32} />
                <View style={styles.rowTextBox}>
                  <Text style={styles.rowText}>{o.title}</Text>
                  <Text style={styles.caption}>{o.teaser}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.footnote}>{copy.lens.ownWords}</Text>

        {fieldToolsEnabled && isAdmin.data ? <LandmarkFieldTools landmark={l} /> : null}
      </ScrollView>
      {celebrating ? <StampCelebration label={copy.lens.stamped} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  cover: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  photoBox: {
    height: 180,
    width: '100%',
  },
  coverTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.round,
    backgroundColor: colors.storybookGold,
  },
  coverTagText: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  land: {
    ...type.caption,
    color: colors.inkMuted,
    letterSpacing: 1.5,
  },
  title: {
    ...type.title,
    color: colors.midnight,
    textAlign: 'center',
  },
  teaser: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  caption: {
    ...type.caption,
    color: colors.inkMuted,
  },
  lookFor: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
  },
  lookForText: {
    flex: 1,
    gap: 2,
  },
  lookForTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  bodyStrong: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  layers: {
    gap: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.midnight,
  },
  tabActive: {
    backgroundColor: colors.midnight,
  },
  tabText: {
    ...type.label,
    fontFamily: fonts.bodySemiBold,
    color: colors.midnight,
  },
  tabTextActive: {
    color: colors.parchment,
  },
  layerCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  layerTitle: {
    ...type.label,
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stampText: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...type.heading,
    color: colors.midnight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + 8,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTextBox: {
    flex: 1,
  },
  rowText: {
    ...type.bodyStrong,
    color: colors.midnight,
    flexShrink: 1,
    flexGrow: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  footnote: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
