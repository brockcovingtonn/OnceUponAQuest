import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, fontAssets, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Auth gate (Step 3): no session → sign-in; no profile → onboarding; else tabs.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.parchment },
          headerTintColor: colors.midnight,
          headerTitleStyle: { fontFamily: fonts.headingSemiBold },
          contentStyle: { backgroundColor: colors.parchment },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/sign-in" options={{ title: 'Sign in' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Welcome' }} />
        <Stack.Screen name="quest/[slug]" options={{ title: 'Quest' }} />
        <Stack.Screen name="spot/[id]" options={{ title: 'Spot' }} />
        <Stack.Screen
          name="badge/[slug]"
          options={{ presentation: 'modal', title: 'Badge earned' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
