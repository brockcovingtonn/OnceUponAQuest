import { View } from 'react-native';

import { Button } from '@/components/Button';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { copy } from '@/copy';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme';

// Placeholder until Step 8; sign out is here early so sign-in can be tested.
export default function ProfileScreen() {
  return (
    <View style={{ flex: 1 }}>
      <PlaceholderScreen name="Profile" showDisclaimer />
      <View style={{ padding: spacing.lg }}>
        <Button
          variant="secondary"
          label={copy.common.signOut}
          onPress={() => supabase.auth.signOut()}
        />
      </View>
    </View>
  );
}
