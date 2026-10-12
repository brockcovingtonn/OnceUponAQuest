import { onlineManager, QueryClient, useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { type ErrorBoundaryProps, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IntroAnimation } from '@/components/IntroAnimation';
import { copy } from '@/copy';
import { AuthProvider, useAuth } from '@/lib/auth';
import { flushPendingErrors, installGlobalErrorHandler, reportError, setCurrentScreen } from '@/lib/errorReporting';
import '@/lib/network';
import { OfflineQueueProvider } from '@/lib/offlineQueue';
import { ParadeModeProvider } from '@/lib/paradeMode';
import { useProfile } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { legalInfo } from '@/legal/info';
import { CACHE_MAX_AGE_MS, persistOptions } from '@/lib/queryPersistence';
import { colors, fontAssets, fonts, spacing, type } from '@/theme';

SplashScreen.preventAutoHideAsync();
installGlobalErrorHandler();

const queryClient = new QueryClient({
  // Keep data around as long as the on-device cache does, so it works offline.
  defaultOptions: { queries: { retry: 1, gcTime: CACHE_MAX_AGE_MS } },
});

// The storybook intro plays once per app launch.
let introPlayed = false;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const pathname = usePathname();

  useEffect(() => {
    setCurrentScreen(pathname);
  }, [pathname]);

  // Send error reports saved after a crash or while offline.
  useEffect(() => {
    flushPendingErrors();
    return onlineManager.subscribe((online) => {
      if (online) flushPendingErrors();
    });
  }, []);
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <AuthProvider>
          <OfflineQueueProvider>
            <ParadeModeProvider>
              <StatusBar style="dark" />
              {fontsReady ? <RootNavigator /> : null}
            </ParadeModeProvider>
          </OfflineQueueProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Auth gate: no session → sign-in; session but no profile row → onboarding; else tabs.
 * Screens outside every guard (too-young, terms, privacy) are always reachable.
 */
function RootNavigator() {
  const { session, initialized } = useAuth();
  const profile = useProfile(session?.user.id);
  const restoring = useIsRestoring();

  const signedIn = Boolean(session);
  // Wait for the on-device cache so an offline launch can still find the profile.
  // A profile query paused for lack of signal (and nothing cached) shows the offline message.
  const waitingForSignal = profile.isPending && profile.fetchStatus === 'paused';
  const ready = initialized && !restoring && (!signedIn || !profile.isPending || waitingForSignal);
  const hasProfile = Boolean(profile.data);
  const [showIntro, setShowIntro] = useState(!introPlayed);
  const finishIntro = useCallback(() => {
    introPlayed = true;
    setShowIntro(false);
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (signedIn && profile.data?.suspended_at) {
    return (
      <View style={styles.error}>
        <Text style={styles.suspendedTitle} accessibilityRole="header">
          {copy.suspended.title}
        </Text>
        <Text style={styles.errorText}>{copy.suspended.body(legalInfo.contactEmail)}</Text>
        <Button variant="secondary" label={copy.common.signOut} onPress={() => supabase.auth.signOut()} />
      </View>
    );
  }

  if (signedIn && (profile.isError || waitingForSignal)) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{waitingForSignal ? copy.offline.firstLaunch : copy.common.networkError}</Text>
        <Button label={copy.common.retry} onPress={() => profile.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.parchment },
          headerTintColor: colors.midnight,
          headerBackTitle: copy.common.back,
          headerTitleStyle: { fontFamily: fonts.headingSemiBold },
          contentStyle: { backgroundColor: colors.parchment },
        }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && !hasProfile}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && hasProfile}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="quest/[slug]" options={{ title: 'Quest' }} />
          <Stack.Screen name="spot/[id]" options={{ title: 'Spot' }} />
          <Stack.Screen
            name="badge/[slug]"
            options={{ presentation: 'modal', title: 'Badge earned' }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{ presentation: 'modal', title: copy.editProfile.title }}
          />
          <Stack.Screen name="safety" options={{ title: copy.safety.title }} />
          <Stack.Screen name="about" options={{ title: copy.about.title }} />
        <Stack.Screen name="blocked" options={{ title: copy.blocked.title }} />
        <Stack.Screen name="moderation" options={{ title: copy.moderation.title }} />
        <Stack.Screen name="insights" options={{ title: copy.insights.title }} />
        </Stack.Protected>

        <Stack.Screen name="too-young" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="terms" options={{ title: copy.legal.termsTitle }} />
        <Stack.Screen name="privacy" options={{ title: copy.legal.privacyTitle }} />
      </Stack>
      {showIntro ? <IntroAnimation onDone={finishIntro} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  suspendedTitle: {
    ...type.title,
    color: colors.midnight,
    textAlign: 'center',
  },
  errorText: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
});

/** Shown instead of a screen that crashed while rendering (Expo Router error boundary). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <View style={styles.error}>
      <Text style={styles.suspendedTitle} accessibilityRole="header">
        {copy.errorScreen.title}
      </Text>
      <Text style={styles.errorText}>{copy.errorScreen.body}</Text>
      <Button label={copy.common.retry} onPress={retry} />
    </View>
  );
}
