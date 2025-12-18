import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Session } from '../types/auth';
import { checkSession, logout as apiLogout } from '../services/auth.api';

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: Error | null;
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  error: null,
  setSession: () => {},
  logout: async () => {},
  refreshSession: async () => {},
});

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check session on mount
  useEffect(() => {
    refreshSession();
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentSession = await checkSession();
      setSession(currentSession);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check session'));
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      // Still clear the session locally even if API call fails
      setSession(null);
    }
  }, []);

  const value: AuthContextValue = {
    session,
    loading,
    error,
    setSession,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
