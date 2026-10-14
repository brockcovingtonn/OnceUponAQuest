import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Turns a rendered card into a PNG and opens the share sheet. */
export async function shareViewAsImage(
  ref: RefObject<View | null>,
  dialogTitle: string,
): Promise<'shared' | 'unavailable' | 'failed'> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1 });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
    return 'shared';
  } catch {
    return 'failed';
  }
}
