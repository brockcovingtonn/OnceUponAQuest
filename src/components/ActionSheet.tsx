import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/copy';
import { colors, minTouchTarget, radius, spacing, type } from '@/theme';

export type SheetAction = { label: string; onPress: () => void; destructive?: boolean };

type Props = {
  visible: boolean;
  title: string;
  actions: SheetAction[];
  onClose: () => void;
};

/** A simple bottom sheet of actions (works the same on iOS and Android). */
export function ActionSheet({ visible, title, actions, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.common.close} accessibilityRole="button" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <View>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={[styles.actionText, action.destructive && styles.destructive]}>{action.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={copy.common.cancel}
            style={({ pressed }) => [styles.action, styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>{copy.common.cancel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 35, 64, 0.45)',
  },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    ...type.label,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  action: {
    minHeight: minTouchTarget + 6,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  actionText: {
    ...type.body,
    color: colors.midnight,
    textAlign: 'center',
  },
  destructive: {
    color: colors.roseText,
  },
  cancel: {
    marginBottom: spacing.sm,
  },
  cancelText: {
    ...type.bodyStrong,
    color: colors.ink,
    textAlign: 'center',
  },
});
