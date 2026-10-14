import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Flourish } from '@/components/Flourish';
import { ProgressDots } from '@/components/ProgressDots';
import {
  FindDemo,
  FriendsDemo,
  HintParadeDemo,
  LensDemo,
  MethodsDemo,
  OfflineDemo,
  QuestDemo,
  SafetyDemo,
  STAGE_HEIGHT,
  StampsDemo,
} from '@/components/walkthrough/Demos';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { markWalkthroughSeen } from '@/lib/walkthrough';
import { colors, minTouchTarget, spacing, type } from '@/theme';

const DEMOS = [QuestDemo, FindDemo, MethodsDemo, StampsDemo, HintParadeDemo, OfflineDemo, FriendsDemo, LensDemo, SafetyDemo];
const PAGES = copy.walkthrough.pages;

/** "How quests work": shown once after onboarding, and any time from Profile or the Quests screen. */
export default function WalkthroughScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(PAGES.length - 1, next));
    scroller.current?.scrollTo({ x: clamped * width, animated: !reduced });
    changePage(clamped);
  }

  function changePage(next: number) {
    if (next === page) return;
    setPage(next);
    AccessibilityInfo.announceForAccessibility(`${copy.walkthrough.pageOf(next + 1, PAGES.length)}. ${PAGES[next].title}`);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    changePage(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  async function finish() {
    if (session) await markWalkthroughSeen(session.user.id);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <ProgressDots current={page} total={PAGES.length} label={copy.walkthrough.pageOf(page + 1, PAGES.length)} />
        {!last ? (
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel={copy.walkthrough.skip} style={styles.skip}>
            <Text style={styles.skipText}>{copy.walkthrough.skip}</Text>
          </Pressable>
        ) : (
          <View style={styles.skip} />
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.flex}>
        {PAGES.map((p, i) => {
          const Demo = DEMOS[i];
          return (
            <ScrollView key={p.title} style={{ width }} contentContainerStyle={styles.page}>
              {/* Only the visible page animates; the rest hold a blank stage. */}
              {i === page ? <Demo /> : <View style={styles.stagePlaceholder} />}
              <Text style={styles.step}>{copy.walkthrough.pageOf(i + 1, PAGES.length)}</Text>
              <Text style={styles.title} accessibilityRole="header">
                {p.title}
              </Text>
              <Flourish width={120} />
              <Text style={styles.body}>{p.body}</Text>
              {reduced && i === page ? <Text style={styles.note}>{copy.walkthrough.reducedMotionNote}</Text> : null}
            </ScrollView>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        {page > 0 ? (
          <Button variant="secondary" label={copy.walkthrough.back} onPress={() => goTo(page - 1)} style={styles.footerButton} />
        ) : (
          <View style={styles.footerButton} />
        )}
        <Button
          label={last ? copy.walkthrough.done : copy.walkthrough.next}
          onPress={() => (last ? finish() : goTo(page + 1))}
          style={styles.footerButton}
        />
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skip: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    ...type.bodyStrong,
    color: colors.midnight,
    textDecorationLine: 'underline',
  },
  page: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stagePlaceholder: {
    height: STAGE_HEIGHT,
  },
  step: {
    ...type.label,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  note: {
    ...type.caption,
    color: colors.inkMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
