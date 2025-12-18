import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type AppMode = 'enterprise' | 'partner' | 'vendor' | 'admin';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const auth = useAuth();
  
  // Wait for auth to initialize before accessing profile
  if (!auth) {
    return <>{children}</>;
  }
  
  const { profile } = auth;
  
  // Mode is determined by user's account_type from their profile
  const mode: AppMode = profile?.account_type || 'enterprise';

  const setMode = (newMode: AppMode) => {
    // In a role-based system, mode changes should go through profile updates
    console.warn('Mode is determined by user role. Use updateProfile to change account_type.');
  };

  const toggleMode = () => {
    // In a role-based system, mode changes should go through profile updates
    console.warn('Mode is determined by user role. Use updateProfile to change account_type.');
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};