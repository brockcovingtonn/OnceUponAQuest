import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { Input } from '@/components/Input';
import { Logo } from '@/components/Logo';
import { Scene } from '@/components/Scene';
import { Twinkle } from '@/components/Twinkle';
import { copy } from '@/copy';
import { supabase } from '@/lib/supabase';
import { mainStreetNight } from '@/art/scenes';
import { colors, spacing, type } from '@/theme';

const CODE_LENGTH = 6;
// Supabase allows one code email per address every 60 seconds by default.
const RESEND_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function describeSendError(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return copy.common.networkError;
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    return copy.signIn.rateLimited;
  }
  return copy.common.somethingWrong;
}

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [codeSentTo, setCodeSentTo] = useState<string>();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [banner, setBanner] = useState<{ message: string; tone: 'error' | 'info' }>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(isResend = false) {
    const address = (isResend ? codeSentTo : email.trim().toLowerCase()) ?? '';
    if (!EMAIL_PATTERN.test(address)) {
      setEmailError(copy.signIn.invalidEmail);
      return;
    }
    setEmailError(undefined);
    setBanner(undefined);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (error) {
      setBanner({ message: describeSendError(error), tone: 'error' });
      return;
    }
    setCodeSentTo(address);
    setCode('');
    setCodeError(undefined);
    setResendIn(RESEND_SECONDS);
    if (isResend) setBanner({ message: copy.signIn.codeResent, tone: 'info' });
  }

  async function verifyCode(token: string) {
    if (!codeSentTo || token.length !== CODE_LENGTH || verifying) return;
    setBanner(undefined);
    setCodeError(undefined);
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: codeSentTo,
      token,
      type: 'email',
    });
    setVerifying(false);
    if (error) {
      if (isAuthRetryableFetchError(error)) {
        setBanner({ message: copy.common.networkError, tone: 'error' });
      } else {
        setCodeError(copy.signIn.wrongCode);
      }
    }
    // On success the auth gate in app/_layout.tsx moves on to onboarding or the tabs.
  }

  function changeCode(next: string) {
    setCode(next);
    setCodeError(undefined);
    if (next.length === CODE_LENGTH) verifyCode(next);
  }

  function startOver() {
    setCodeSentTo(undefined);
    setCode('');
    setCodeError(undefined);
    setBanner(undefined);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.banner}>
            <Scene shapes={mainStreetNight} height={190} />
            <Twinkle size={14} style={{ top: 22, left: '18%' }} />
            <Twinkle size={10} delay={500} style={{ top: 50, right: '22%' }} />
            <Twinkle size={12} delay={1000} style={{ top: 16, right: '40%' }} />
          </View>
          <View style={styles.hero}>
            <Logo accessibilityLabel={copy.signIn.logoLabel} />
            <Text style={styles.title} accessibilityRole="header">
              {copy.appName}
            </Text>
            <Text style={styles.tagline}>{copy.tagline}</Text>
          </View>

          {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

          {codeSentTo ? (
            <View style={styles.form}>
              <Text style={styles.body}>{copy.signIn.codeSentTo(codeSentTo)}</Text>
              <Text style={styles.label}>{copy.signIn.codeLabel}</Text>
              <CodeInput
                value={code}
                onChange={changeCode}
                length={CODE_LENGTH}
                accessibilityLabel={copy.signIn.codeAccessibilityLabel}
                testID="code-input"
                hasError={Boolean(codeError)}
                autoFocus
              />
              {codeError ? (
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {codeError}
                </Text>
              ) : null}
              <Button
                label={copy.signIn.signIn}
                onPress={() => verifyCode(code)}
                disabled={code.length !== CODE_LENGTH}
                loading={verifying}
              />
              <Button
                variant="secondary"
                label={resendIn > 0 ? copy.signIn.resendIn(resendIn) : copy.signIn.resend}
                onPress={() => sendCode(true)}
                disabled={resendIn > 0}
                loading={sending}
              />
              <Button variant="text" label={copy.signIn.useDifferentEmail} onPress={startOver} />
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label={copy.signIn.emailLabel}
                placeholder={copy.signIn.emailPlaceholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(undefined);
                }}
                error={emailError}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                testID="email-input"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={() => sendCode()}
              />
              <Button label={copy.signIn.sendCode} onPress={() => sendCode()} loading={sending} />
            </View>
          )}

          <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
        </ScrollView>
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
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  banner: {
    marginTop: -spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -64,
    marginBottom: spacing.md,
  },
  title: {
    ...type.display,
    color: colors.midnight,
    textAlign: 'center',
  },
  tagline: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  body: {
    ...type.body,
    color: colors.ink,
  },
  label: {
    ...type.label,
    color: colors.ink,
  },
  error: {
    ...type.label,
    color: colors.roseText,
  },
  disclaimer: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
