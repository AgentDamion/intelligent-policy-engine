// frontend/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, auth, api } from '../lib/supabase-client';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    // Check active session
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserContext();
        } else {
          setUser(null);
          setUserContext(null);
        }
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  async function checkUser() {
    try {
      const { data: { user } } = await auth.getUser();
      setUser(user);
      if (user) {
        await fetchUserContext();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchUserContext() {
    try {
      const context = await api.get('/api/me');
      setUserContext(context);
    } catch (error) {
      console.error('Error fetching user context:', error);
    }
  }
  
  const value = {
    user,
    userContext,
    loading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    refreshContext: fetchUserContext
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
