import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';

import { usePreferences } from '@/lib/preferences';

/**
 * Sound + vibration for the app's little moments, honoring the Sounds and
 * Vibration settings. Sounds are original (scripts/generate-sounds.mjs),
 * follow the phone's silent switch, and mix with music instead of stopping it.
 */
const SOURCES = {
  stamp: require('../../assets/sounds/stamp.wav'),
  chime: require('../../assets/sounds/chime.wav'),
  saved: require('../../assets/sounds/saved.wav'),
} as const;

type SoundName = keyof typeof SOURCES;

let players: Partial<Record<SoundName, AudioPlayer>> | null = null;

function player(name: SoundName): AudioPlayer | null {
  try {
    if (!players) {
      players = {};
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    players[name] ??= createAudioPlayer(SOURCES[name]);
    return players[name] ?? null;
  } catch {
    return null;
  }
}

function play(name: SoundName) {
  const p = player(name);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // Sound is a nicety; never let it break a check-in.
  }
}

export type Feedback = {
  /** A spot was stamped. */
  stamp: () => void;
  /** A quest was finished and a badge earned. */
  badge: () => void;
  /** A typed answer wasn't right. */
  wrong: () => void;
  /** A check-in was saved offline. */
  saved: () => void;
  /** A light tap for toggles and small selections. */
  tap: () => void;
};

export function useFeedback(): Feedback {
  const { sounds, vibration } = usePreferences();
  return useMemo(
    () => ({
      stamp: () => {
        if (sounds) play('stamp');
        if (vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      badge: () => {
        if (sounds) play('chime');
        if (vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      wrong: () => {
        if (vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      },
      saved: () => {
        if (sounds) play('saved');
        if (vibration) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      tap: () => {
        if (vibration) Haptics.selectionAsync().catch(() => {});
      },
    }),
    [sounds, vibration],
  );
}
