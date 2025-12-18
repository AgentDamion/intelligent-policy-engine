import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../context/AuthProvider';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Helper hooks for common auth checks
export const useIsAuthenticated = (): boolean => {
  const { session } = useAuth();
  return !!session;
};

export const useHasRole = (role: string): boolean => {
  const { session } = useAuth();
  return session?.roles?.includes(role as any) || false;
};

export const useHasAnyRole = (roles: string[]): boolean => {
  const { session } = useAuth();
  return roles.some(role => session?.roles?.includes(role as any)) || false;
};

export const useRequireMFA = (): boolean => {
  const { session } = useAuth();
  return session?.mfaRequired || false;
};
