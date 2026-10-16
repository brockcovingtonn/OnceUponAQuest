import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'once-upon-a-quest:preferences';

export type ParkId = 'disneyland-park' | 'california-adventure';

export type Preferences = {
  sounds: boolean;
  vibration: boolean;
  /** The park shown on the Quests and Map tabs. */
  park: ParkId;
};

const DEFAULTS: Preferences = { sounds: true, vibration: true, park: 'disneyland-park' };

type PreferencesState = Preferences & {
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

const PreferencesContext = createContext<PreferencesState>({ ...DEFAULTS, setPreference: () => {} });

/** Per-device settings (Sounds, Vibration, which park), saved on the phone. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw) as Partial<Preferences>;
        setPrefs({ ...DEFAULTS, ...stored });
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...prefs, setPreference }), [prefs, setPreference]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesState {
  return useContext(PreferencesContext);
}
