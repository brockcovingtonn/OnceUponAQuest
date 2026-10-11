import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  /** Inked (gold) when earned or found; grey outline otherwise. */
  inked: boolean;
  size?: number;
};

/** Round passport stamp. Decorative: give the parent the accessibility label. */
export function Stamp({ icon, inked, size = 32 }: Props) {
  const color = inked ? colors.midnight : colors.inkMuted;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.stamp,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: inked ? colors.storybookGold : 'transparent',
          borderColor: inked ? colors.storybookGold : colors.border,
          borderStyle: inked ? 'solid' : 'dashed',
        },
      ]}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
