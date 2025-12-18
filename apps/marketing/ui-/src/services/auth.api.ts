import { CreateOrgPayload, SignInPayload, JoinOrgPayload, Session } from '../types/auth';

const API = (path: string) => `/api${path}`;

export const signIn = async (payload: SignInPayload): Promise<Session> => {
  const response = await fetch(API('/auth/signin'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sign in failed');
  }
  
  return response.json();
};

export const startOAuth = (provider: 'google' | 'microsoft') => {
  // Backend handles OAuth flow via redirect
  window.location.assign(API(`/oauth/start/${provider}`));
};

export const startSAML = () => {
  // Backend handles SAML SP-initiated flow
  window.location.assign(API('/saml/start'));
};

export const createOrg = async (payload: CreateOrgPayload): Promise<{ orgId: string; next: 'mfa' | 'invite' }> => {
  const response = await fetch(API('/org/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Organization creation failed');
  }
  
  return response.json();
};

export const requestAccess = async (payload: JoinOrgPayload): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(API('/org/request-access'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Access request failed');
  }
  
  return response.json();
};

export const checkSession = async (): Promise<Session | null> => {
  try {
    const response = await fetch(API('/auth/session'), {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await fetch(API('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
};
