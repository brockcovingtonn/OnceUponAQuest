import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId: string) => `once-upon-a-quest:walkthrough-seen:${userId}`;

/** Whether this explorer has seen "How quests work" on this phone. */
export async function hasSeenWalkthrough(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(userId))) === 'yes';
  } catch {
    return true; // never block the app on storage trouble
  }
}

export async function markWalkthroughSeen(userId: string): Promise<void> {
  await AsyncStorage.setItem(key(userId), 'yes').catch(() => {});
}
