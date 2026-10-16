import { Pressable, StyleSheet, Text, View } from 'react-native';

import { copy } from '@/copy';
import { PARK_IDS } from '@/lib/parks';
import { usePreferences } from '@/lib/preferences';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

/** Disneyland | California Adventure. The choice is shared by the Quests and Map tabs. */
export function ParkSwitch({ onChange }: { onChange?: () => void }) {
  const { park, setPreference } = usePreferences();
  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={copy.parks.label}>
      {PARK_IDS.map((id) => {
        const on = id === park;
        return (
          <Pressable
            key={id}
            onPress={() => {
              setPreference('park', id);
              onChange?.();
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={copy.parks.names[id]}
            style={[styles.option, on && styles.optionOn]}>
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {copy.parks.names[id]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.round,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.midnight,
  },
  option: {
    flex: 1,
    minHeight: minTouchTarget - 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.round,
  },
  optionOn: {
    backgroundColor: colors.midnight,
  },
  text: {
    ...type.label,
    color: colors.midnight,
  },
  textOn: {
    color: colors.parchment,
  },
});
