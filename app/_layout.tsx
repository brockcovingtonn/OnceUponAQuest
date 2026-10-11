import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ParadeModeProvider } from '@/lib/paradeMode';
import { useProfile } from '@/lib/queries';
import { colors, fontAssets, fonts, spacing, type } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ParadeModeProvider>
            <StatusBar style="dark" />
            {fontsReady ? <RootNavigator /> : null}
          </ParadeModeProvider>
        </AuthProvider>
      </QueryClientProvider>
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

  const signedIn = Boolean(session);
  const ready = initialized && (!signedIn || !profile.isPending);
  const hasProfile = Boolean(profile.data);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (signedIn && profile.isError) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{copy.common.networkError}</Text>
        <Button label={copy.common.retry} onPress={() => profile.refetch()} />
      </View>
    );
  }

  return (
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
      </Stack.Protected>

      <Stack.Screen name="too-young" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="terms" options={{ title: copy.legal.termsTitle }} />
      <Stack.Screen name="privacy" options={{ title: copy.legal.privacyTitle }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.parchment,
  },
  errorText: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
});
