import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// Tell react-query when the phone loses signal: queries pause and show cached
// data instead of failing, and resume when the connection comes back.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    // isInternetReachable is null until it has been checked; treat that as online.
    setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  }),
);

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

/** True for errors caused by having no connection (vs. the server saying no). */
export function isNetworkError(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message
      : String(error);
  return !onlineManager.isOnline() || /network request failed|failed to fetch|network error|timed? ?out|aborted/i.test(message);
}
