import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar3DViewer } from '@/components/Avatar3DViewer';
import { copy } from '@/copy';
import type { AvatarModelId } from '@/lib/avatar3d';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

const MODEL_IDS: AvatarModelId[] = ['sculpted', 'original'];

/** A 3D preview of the explorer: turn, zoom and reset. */
export default function Avatar3DScreen() {
  const [model, setModel] = useState<AvatarModelId>('sculpted');
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Text style={styles.intro}>{copy.avatar3d.intro}</Text>
      <View style={styles.switch} accessibilityRole="radiogroup">
        {MODEL_IDS.map((id) => {
          const on = id === model;
          return (
            <Pressable
              key={id}
              onPress={() => setModel(id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={copy.avatar3d.models[id]}
              style={[styles.option, on && styles.optionOn]}>
              <Text style={[styles.optionText, on && styles.optionTextOn]}>{copy.avatar3d.models[id]}</Text>
            </Pressable>
          );
        })}
      </View>
      {/* A fresh viewer per model, so switching stops the old render loop and frees its GPU memory. */}
      <Avatar3DViewer key={model} model={model} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
    padding: spacing.md,
    gap: spacing.md,
  },
  intro: {
    ...type.body,
    color: colors.ink,
  },
  switch: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: minTouchTarget,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionOn: {
    backgroundColor: colors.midnight,
    borderColor: colors.midnight,
  },
  optionText: {
    ...type.label,
    color: colors.midnight,
  },
  optionTextOn: {
    color: colors.white,
  },
});
