import { type ReactNode, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { copy } from '@/copy';
import { shareViewAsImage } from '@/lib/shareImage';
import { colors, spacing, type } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Title for the system share dialog (Android). */
  dialogTitle: string;
  /** The storybook card to turn into an image. */
  children: ReactNode;
};

/** Previews a storybook share card and shares it as an image. */
export function ShareSheet({ visible, onClose, dialogTitle, children }: Props) {
  const card = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string>();

  async function share() {
    setError(undefined);
    setSharing(true);
    const result = await shareViewAsImage(card, dialogTitle);
    setSharing(false);
    if (result === 'unavailable') setError(copy.share.unavailable);
    else if (result === 'failed') setError(copy.share.failed);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>{copy.share.preview}</Text>
          <View style={styles.cardWrap}>
            <View ref={card} collapsable={false}>
              {children}
            </View>
          </View>
          {error ? <Banner message={error} /> : null}
          <Button label={copy.share.shareImage} onPress={share} loading={sharing} />
          <Button variant="secondary" label={copy.share.close} onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  hint: {
    ...type.body,
    color: colors.ink,
    textAlign: 'center',
  },
  cardWrap: {
    alignItems: 'center',
  },
});
