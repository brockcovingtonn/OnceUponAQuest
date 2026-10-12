import * as Updates from 'expo-updates';
import { createContext, createElement, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/** If an update is ready this soon after launch, restart into it right away. */
const AUTO_RESTART_WINDOW_MS = 8_000;
/** Don't re-check more often than this when the app comes back to the foreground. */
const RECHECK_EVERY_MS = 15 * 60 * 1000;
/** When this JavaScript bundle started (i.e. app launch or the last update restart). */
const LAUNCHED_AT = Date.now();

/**
 * Checks for over-the-air updates at launch and when the app returns to the
 * foreground. An update downloaded within a few seconds of launch is applied
 * immediately; later ones wait for the user to tap Restart (so a check-in in
 * progress is never interrupted). No-op in development and Expo Go.
 */
function useUpdateChecker() {
  const [ready, setReady] = useState(false);
  const lastCheck = useRef(0);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled || checking.current) return;
    checking.current = true;
    lastCheck.current = Date.now();
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;
      const fetched = await Updates.fetchUpdateAsync();
      if (!fetched.isNew) return;
      if (Date.now() - LAUNCHED_AT < AUTO_RESTART_WINDOW_MS) {
        await Updates.reloadAsync();
      } else {
        setReady(true);
      }
    } catch {
      // Offline or the update server is unreachable — try again later.
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    // Start on the next tick so the first render isn't held up.
    Promise.resolve().then(check);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastCheck.current > RECHECK_EVERY_MS) check();
    });
    return () => sub.remove();
  }, [check]);

  const restart = useCallback(() => {
    Updates.reloadAsync().catch(() => {});
  }, []);

  return { ready, restart };
}

/** "1.0.0 · update 9ea130c7 · field" — shown in About so it's easy to tell what's running. */
export function versionLabel(appVersion: string): string {
  const parts = [appVersion];
  if (Updates.updateId && !Updates.isEmbeddedLaunch) parts.push(`update ${Updates.updateId.slice(0, 8)}`);
  if (Updates.channel) parts.push(Updates.channel);
  return parts.join(' · ');
}

type AppUpdateState = { ready: boolean; restart: () => void };

const AppUpdateContext = createContext<AppUpdateState>({ ready: false, restart: () => {} });

/** Runs the update checker once for the whole app. */
export function AppUpdatesProvider({ children }: { children: ReactNode }) {
  const state = useUpdateChecker();
  return createElement(AppUpdateContext.Provider, { value: state }, children);
}

export function useAppUpdate(): AppUpdateState {
  return useContext(AppUpdateContext);
}
