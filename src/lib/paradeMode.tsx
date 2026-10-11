import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'parade-mode';

type ParadeModeState = {
  paradeMode: boolean;
  setParadeMode: (on: boolean) => void;
};

const ParadeModeContext = createContext<ParadeModeState>({
  paradeMode: false,
  setParadeMode: () => {},
});

/** Parade mode is a per-device setting, so it lives on the phone, not in the database. */
export function ParadeModeProvider({ children }: { children: ReactNode }) {
  const [paradeMode, setParadeModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setParadeModeState(value === 'on'))
      .catch(() => {});
  }, []);

  const setParadeMode = useCallback((on: boolean) => {
    setParadeModeState(on);
    AsyncStorage.setItem(STORAGE_KEY, on ? 'on' : 'off').catch(() => {});
  }, []);

  return (
    <ParadeModeContext.Provider value={{ paradeMode, setParadeMode }}>
      {children}
    </ParadeModeContext.Provider>
  );
}

export function useParadeMode(): ParadeModeState {
  return useContext(ParadeModeContext);
}
