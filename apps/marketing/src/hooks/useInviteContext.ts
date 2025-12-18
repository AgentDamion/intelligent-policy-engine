import { useState, useEffect, createContext, useContext } from 'react';

export interface InviteContext {
  workspaceId: string;
  enterpriseName: string;
  workspaceName: string;
  policyScope: string;
  policyName: string;
  role: string;
  email: string;
  inviteId: string;
}

interface InviteContextState {
  context: InviteContext | null;
  isInviteSession: boolean;
  clearContext: () => void;
  setContext: (context: InviteContext) => void;
}

const InviteContextContext = createContext<InviteContextState | undefined>(undefined);

export const useInviteContext = (): InviteContextState => {
  const [context, setContextState] = useState<InviteContext | null>(null);

  useEffect(() => {
    // Load invite context from localStorage on mount
    const storedContext = localStorage.getItem('inviteContext');
    if (storedContext) {
      try {
        const parsed = JSON.parse(storedContext);
        setContextState(parsed);
      } catch (error) {
        console.error('Failed to parse invite context:', error);
        localStorage.removeItem('inviteContext');
      }
    }
  }, []);

  const setContext = (newContext: InviteContext) => {
    setContextState(newContext);
    localStorage.setItem('inviteContext', JSON.stringify(newContext));
  };

  const clearContext = () => {
    setContextState(null);
    localStorage.removeItem('inviteContext');
  };

  return {
    context,
    isInviteSession: !!context,
    clearContext,
    setContext
  };
};

// Hook for components that need invite context
export const useInviteData = () => {
  const { context, isInviteSession } = useInviteContext();
  
  return {
    inviteData: context,
    isInviteSession,
    workspaceId: context?.workspaceId,
    enterpriseName: context?.enterpriseName,
    workspaceName: context?.workspaceName,
    policyScope: context?.policyScope,
    policyName: context?.policyName,
    role: context?.role,
    email: context?.email
  };
};