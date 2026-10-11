import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** False until the stored session has been read from the device. */
  initialized: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, initialized: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, initialized: false });

  useEffect(() => {
    // Fires INITIAL_SESSION right away with the stored session (or null).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, initialized: true });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
