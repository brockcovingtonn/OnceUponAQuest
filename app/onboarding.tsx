import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarPicker } from '@/components/AvatarPicker';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Input } from '@/components/Input';
import { ProgressDots } from '@/components/ProgressDots';
import { copy } from '@/copy';
import { useAuth } from '@/lib/auth';
import { useAvatarChoice } from '@/lib/useAvatarChoice';
import { USERNAME_PATTERN, useCreateProfile, useUsernameAvailable } from '@/lib/queries';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { colors, minTouchTarget, spacing, type } from '@/theme';

const TOTAL_STEPS = 3;

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export default function OnboardingScreen() {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [usernameConflict, setUsernameConflict] = useState(false);
  const avatar = useAvatarChoice();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [is13OrOlder, setIs13OrOlder] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const trimmed = username.trim();
  const debounced = useDebouncedValue(trimmed, 400);
  const availability = useUsernameAvailable(debounced);
  const createProfile = useCreateProfile();

  const formatOk = USERNAME_PATTERN.test(trimmed);
  const settled = debounced === trimmed && !availability.isFetching;
  const usernameReady = formatOk && settled && availability.data === true && !usernameConflict;

  let usernameError: string | undefined;
  let usernameStatus: { text: string; tone: 'neutral' | 'success' } | undefined;
  if (usernameConflict) {
    usernameError = copy.onboarding.usernameJustTaken;
  } else if (trimmed === '') {
    usernameStatus = { text: copy.onboarding.usernameRules, tone: 'neutral' };
  } else if (!formatOk) {
    if (debounced === trimmed) usernameError = copy.onboarding.usernameInvalid;
    else usernameStatus = { text: copy.onboarding.usernameRules, tone: 'neutral' };
  } else if (!settled) {
    usernameStatus = { text: copy.onboarding.usernameChecking, tone: 'neutral' };
  } else if (availability.isError) {
    usernameError = copy.common.networkError;
  } else if (availability.data === false) {
    usernameError = copy.onboarding.usernameTaken;
  } else if (availability.data === true) {
    usernameStatus = { text: copy.onboarding.usernameAvailable, tone: 'success' };
  }

  async function finish() {
    if (!session) return;
    const userId = session.user.id;
    setAvatarError(false);
    setUploadingAvatar(true);
    let saved;
    try {
      saved = await avatar.resolve(userId);
    } catch {
      setAvatarError(true);
      return;
    } finally {
      setUploadingAvatar(false);
    }
    createProfile.mutate(
      {
        id: userId,
        username: trimmed,
        avatar_key: saved.avatarKey,
        avatar_url: saved.avatarUrl,
        age_confirmed_13: true,
        terms_accepted_at: new Date().toISOString(),
      },
      {
        onSuccess: () => avatar.cleanUp(userId, saved),
        onError: (error) => {
          if (isUniqueViolation(error)) {
            setUsernameConflict(true);
            setStep(0);
          }
        },
      },
    );
    // On success the auth gate in app/_layout.tsx moves on to the tabs.
  }

  const showSaveError = createProfile.isError && !isUniqueViolation(createProfile.error);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable
              onPress={() => setStep(step - 1)}
              accessibilityRole="button"
              accessibilityLabel={copy.common.back}
              hitSlop={8}
              style={styles.back}>
              <Ionicons name="chevron-back" size={24} color={colors.midnight} />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <ProgressDots
            current={step}
            total={TOTAL_STEPS}
            label={copy.onboarding.stepOf(step + 1, TOTAL_STEPS)}
          />
          <View style={styles.back} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepLabel}>{copy.onboarding.stepOf(step + 1, TOTAL_STEPS)}</Text>

          {step === 0 ? (
            <>
              <Text style={styles.title} accessibilityRole="header">
                {copy.onboarding.usernameTitle}
              </Text>
              <Input
                label={copy.onboarding.usernameLabel}
                prefix="@"
                placeholder={copy.onboarding.usernamePlaceholder}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setUsernameConflict(false);
                }}
                error={usernameError}
                status={usernameStatus}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                testID="username-input"
                maxLength={24}
              />

              <Text style={styles.subtitle}>{copy.onboarding.avatarTitle}</Text>
              <AvatarPicker
                choice={avatar.choice}
                onSelectStamp={avatar.selectStamp}
                onSelectPhoto={avatar.selectPhoto}
                onPickPhoto={avatar.pickPhoto}
                picking={avatar.picking}
              />
              <Text style={styles.note}>{copy.avatarPhoto.note}</Text>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.title} accessibilityRole="header">
                {copy.onboarding.rulesTitle}
              </Text>
              {copy.onboarding.rules.map((rule) => (
                <View key={rule.text} style={styles.rule}>
                  <Ionicons name={rule.icon} size={28} color={colors.midnight} />
                  <Text style={styles.ruleText}>{rule.text}</Text>
                </View>
              ))}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.title} accessibilityRole="header">
                {copy.onboarding.finalTitle}
              </Text>
              <Text style={styles.body}>{copy.disclaimer}</Text>
              <Checkbox
                checked={is13OrOlder}
                onChange={setIs13OrOlder}
                accessibilityLabel={copy.onboarding.ageConfirm}>
                {copy.onboarding.ageConfirm}
              </Checkbox>
              <Checkbox
                checked={agreedToTerms}
                onChange={setAgreedToTerms}
                accessibilityLabel={`${copy.onboarding.termsPrefix}${copy.onboarding.terms}${copy.onboarding.termsAnd}${copy.onboarding.privacy}`}>
                {`${copy.onboarding.termsPrefix}${copy.onboarding.terms}${copy.onboarding.termsAnd}${copy.onboarding.privacy}`}
              </Checkbox>
              <View style={styles.legalLinks}>
                <Button variant="text" label={copy.onboarding.terms} onPress={() => router.push('/terms')} />
                <Button variant="text" label={copy.onboarding.privacy} onPress={() => router.push('/privacy')} />
              </View>
              {showSaveError ? <Banner message={copy.common.networkError} /> : null}
              {avatarError ? <Banner message={copy.avatarPhoto.uploadFailed} /> : null}
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step === 0 ? (
            <Button label={copy.onboarding.next} onPress={() => setStep(1)} disabled={!usernameReady} />
          ) : null}
          {step === 1 ? <Button label={copy.onboarding.rulesNext} onPress={() => setStep(2)} /> : null}
          {step === 2 ? (
            <>
              <Button
                label={copy.onboarding.start}
                onPress={finish}
                disabled={!is13OrOlder || !agreedToTerms}
                loading={uploadingAvatar || createProfile.isPending}
              />
              <Button
                variant="text"
                label={copy.onboarding.under13}
                onPress={() => router.replace('/too-young')}
              />
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepLabel: {
    ...type.label,
    color: colors.inkMuted,
  },
  title: {
    ...type.title,
    color: colors.midnight,
  },
  subtitle: {
    ...type.heading,
    color: colors.midnight,
    marginTop: spacing.md,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleText: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  note: {
    ...type.caption,
    color: colors.inkMuted,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
