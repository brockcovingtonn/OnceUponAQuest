import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Placeholder mark (open storybook + star) until Step 9's original logo art. */
export function Logo({ accessibilityLabel }: { accessibilityLabel: string }) {
  return (
    <View
      style={styles.mark}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <Ionicons name="book-outline" size={56} color={colors.parchment} />
      <Ionicons name="star" size={22} color={colors.storybookGold} style={styles.star} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    top: 14,
    right: 18,
  },
});
