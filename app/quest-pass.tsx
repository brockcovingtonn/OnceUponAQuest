import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_LOOK, parseLook } from '@/art/avatar';
import { mainStreetNight } from '@/art/scenes';
import { AvatarFigure } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Scene } from '@/components/Scene';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { formatDate } from '@/lib/format';
import {
  MANAGE_SUBSCRIPTION_URL,
  type PassPlan,
  storeEnabled,
  useBuyPass,
  usePassPlans,
  usePassStatus,
  useRestorePurchases,
} from '@/lib/purchases';
import { useProfile } from '@/lib/queries';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

type Message = { text: string; tone: 'info' | 'error' };

/** The Quest Pass: what it includes, the plans, and buying or managing it. */
export default function QuestPassScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const pass = usePassStatus(userId);
  const plans = usePassPlans();
  const buyPass = useBuyPass(userId);
  const restore = useRestorePurchases(userId);
  const feedback = useFeedback();
  const [chosen, setChosen] = useState<PassPlan['kind']>('yearly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const look = parseLook(profile.data?.avatar) ?? DEFAULT_LOOK;
  // Your explorer shows off October's gift lantern.
  const showLook = { ...look, held: 'lantern-bearer' };
  const plan = plans.data?.find((p) => p.kind === chosen) ?? plans.data?.[0];

  async function buy() {
    if (!plan) return;
    setMessage(null);
    setBusy(true);
    const outcome = await buyPass(plan);
    setBusy(false);
    if (outcome === 'done') {
      feedback.badge();
      setMessage({ text: copy.pass.done, tone: 'info' });
    } else if (outcome === 'pending') {
      setMessage({ text: copy.pass.pending, tone: 'info' });
    } else if (outcome === 'failed') {
      setMessage({ text: copy.pass.failed, tone: 'error' });
    }
  }

  async function doRestore() {
    setMessage(null);
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    setMessage(ok ? { text: copy.pass.restored, tone: 'info' } : { text: copy.pass.restoreFailed, tone: 'error' });
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Scene shapes={mainStreetNight} height={170} />
        <Twinkle size={12} style={{ top: 30, left: '18%' }} />
        <Twinkle size={9} delay={600} style={{ top: 54, right: '22%' }} color={colors.parchment} />
        <AvatarFigure look={showLook} size={96} pose="wave" style={styles.heroAvatar} />
      </View>

      <View style={styles.titleRow}>
        <Ionicons name="ribbon" size={26} color={colors.storybookGold} />
        <Text style={styles.title} accessibilityRole="header">
          {copy.pass.name}
        </Text>
      </View>
      <Text style={styles.tagline}>{copy.pass.tagline}</Text>

      <View style={styles.benefits}>
        {copy.pass.benefits.map((b) => (
          <View key={b.text} style={styles.benefit}>
            <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.midnight} />
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      {message ? <Banner message={message.text} tone={message.tone} /> : null}

      {pass.data?.active ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeText}>{copy.pass.active(formatDate(pass.data.expiresAt ?? ''))}</Text>
          {pass.data.willRenew ? <Text style={styles.small}>{copy.pass.renews(formatDate(pass.data.expiresAt ?? ''))}</Text> : null}
          <Button variant="secondary" label={copy.wardrobe.open} onPress={() => router.push('/wardrobe')} />
          {pass.data.willRenew ? (
            <Button variant="text" label={copy.pass.manage} onPress={() => Linking.openURL(MANAGE_SUBSCRIPTION_URL)} />
          ) : null}
        </View>
      ) : !storeEnabled ? (
        <Banner message={copy.pass.comingSoon} tone="info" />
      ) : plans.isPending ? (
        <ActivityIndicator color={colors.midnight} />
      ) : plans.isError || !plans.data?.length ? (
        <>
          <Banner message={copy.pass.unavailable} tone="error" />
          <Button variant="secondary" label={copy.common.retry} onPress={() => plans.refetch()} />
        </>
      ) : (
        <>
          <View style={styles.plans} accessibilityRole="radiogroup">
            {plans.data.map((p) => {
              const info = copy.pass.plans[p.kind];
              const selected = plan?.kind === p.kind;
              const line = info.line(p.priceString);
              return (
                <Pressable
                  key={p.kind}
                  onPress={() => setChosen(p.kind)}
                  accessibilityRole="radio"
                  accessibilityLabel={copy.pass.planLabel(info.title, line)}
                  accessibilityState={{ selected }}
                  style={[styles.plan, selected && styles.planOn]}>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.midnight} />
                  <View style={styles.planText}>
                    <Text style={styles.planTitle}>{info.title}</Text>
                    <Text style={styles.planLine}>{line}</Text>
                  </View>
                  {info.tag ? <Text style={styles.tag}>{info.tag}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <Button label={copy.pass.continue} onPress={buy} loading={busy} />
        </>
      )}

      <Text style={styles.legal}>{copy.pass.legal}</Text>
      <View style={styles.links}>
        <Button variant="text" label={copy.onboarding.terms} onPress={() => router.push('/terms')} />
        <Button variant="text" label={copy.onboarding.privacy} onPress={() => router.push('/privacy')} />
        {storeEnabled ? <Button variant="text" label={copy.pass.restore} onPress={doRestore} disabled={busy} /> : null}
      </View>
    </ScrollView>
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
  hero: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroAvatar: {
    position: 'absolute',
    bottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...type.display,
    color: colors.midnight,
  },
  tagline: {
    ...type.body,
    color: colors.ink,
  },
  benefits: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefit: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  benefitText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  plans: {
    gap: spacing.sm,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchTarget + 16,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  planOn: {
    borderColor: colors.storybookGold,
    backgroundColor: '#FBF3DD',
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  planLine: {
    ...type.label,
    color: colors.ink,
  },
  tag: {
    ...type.caption,
    color: colors.midnight,
    backgroundColor: colors.storybookGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  activeCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.storybookGold,
    backgroundColor: colors.white,
  },
  activeText: {
    ...type.bodyStrong,
    color: colors.midnight,
  },
  small: {
    ...type.label,
    color: colors.inkMuted,
  },
  legal: {
    ...type.caption,
    color: colors.inkMuted,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
