import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { supabase } from '@/lib/supabase';
import { colors, spacing, type } from '@/theme';

/**
 * Polite stop for under-13 users. The sign-in already created an auth account,
 * so remove it (no profile was ever created) and sign out on this device.
 */
export default function TooYoungScreen() {
  const [cleanedUp, setCleanedUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await supabase.rpc('delete_my_account');
        await supabase.auth.signOut({ scope: 'local' });
      }
      if (!cancelled) setCleanedUp(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Ionicons name="heart-outline" size={56} color={colors.storybookGold} />
        <Text style={styles.title} accessibilityRole="header">
          {copy.tooYoung.title}
        </Text>
        <Text style={styles.body}>{copy.tooYoung.body}</Text>
      </View>
      <View style={styles.footer}>
        <Button
          label={copy.tooYoung.done}
          onPress={() => router.replace('/sign-in')}
          loading={!cleanedUp}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.midnight,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
  },
});
