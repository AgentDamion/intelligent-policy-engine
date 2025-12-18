import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { demoMode, createDemoUser, createDemoSession, createDemoProfile } from '@/utils/demoMode';
import { monitoring } from '@/utils/monitoring';

type DatabaseProfile = Database['public']['Tables']['profiles']['Row'];
type Profile = Omit<DatabaseProfile, 'account_type'> & {
  // Extend account_type to include 'admin' for demo mode
  account_type: DatabaseProfile['account_type'] | 'admin';
};

interface JWTClaims {
  enterprises?: string[];
  workspaces?: string[];
  account_type?: string;
  primary_enterprise?: string;
  primary_workspace?: string;
  is_admin?: boolean;
  claims_version?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  claims: JWTClaims | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string,
    accountType?: 'enterprise' | 'partner' | 'vendor'
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<JWTClaims | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract custom claims from JWT token
  const extractClaims = (session: Session | null): JWTClaims | null => {
    if (!session?.access_token) return null;
    
    try {
      // Decode JWT to get custom claims
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      return {
        enterprises: payload.enterprises || [],
        workspaces: payload.workspaces || [],
        account_type: payload.account_type,
        primary_enterprise: payload.primary_enterprise,
        primary_workspace: payload.primary_workspace,
        is_admin: payload.is_admin || false,
        claims_version: payload.claims_version || 0
      };
    } catch (error) {
      console.error('Error extracting JWT claims:', error);
      return null;
    }
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      monitoring.debug('Initializing auth context');
    }
    
    // Check for demo mode URL param on mount
    demoMode.checkURLParam();

    // Demo mode: skip Supabase auth and use synthetic data
    if (demoMode.isEnabled()) {
      if (import.meta.env.DEV) {
        monitoring.debug('Demo mode is enabled');
      }
      const demoRole = demoMode.getDemoRole();
      const demoUser = createDemoUser();
      setUser(demoUser as User);
      setSession(createDemoSession(demoUser) as Session);
      
      // If demo role is set, create profile immediately
      if (demoRole) {
        if (import.meta.env.DEV) {
          monitoring.debug('Setting demo profile with role', { role: demoRole });
        }
        setProfile(createDemoProfile(demoRole));
      } else {
        if (import.meta.env.DEV) {
          monitoring.debug('No demo role set, showing role selector');
        }
        setProfile(null); // Show RoleSelector
      }
      
      setLoading(false);
      return;
    }

    console.log('🔗 Setting up normal auth flow');
    // Normal auth flow
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        
        // Extract JWT claims for faster access checks
        const jwtClaims = extractClaims(session);
        setClaims(jwtClaims);
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id);
          // Fetch user profile when authenticated
          setTimeout(async () => {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('❌ Error fetching profile:', error);
            } else {
              console.log('✅ Profile loaded:', profile?.account_type || 'no account type');
            }
            
            // Provide defaults for gamification fields if missing
            const profileWithDefaults = profile ? {
              ...profile,
              compliance_streak: profile.compliance_streak ?? 0,
              compliance_streak_best: profile.compliance_streak_best ?? 0,
              last_compliance_date: profile.last_compliance_date ?? null
            } : null;
            
            setProfile(profileWithDefaults);
            setLoading(false);
          }, 0);
        } else {
          console.log('🚫 No user session');
          setProfile(null);
          setClaims(null);
          setLoading(false);
        }
      }
    );

    console.log('📋 Checking for existing session');
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
      } else if (session) {
        console.log('✅ Found existing session for:', session.user.email);
      } else {
        console.log('ℹ️ No existing session found');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Extract JWT claims
      const jwtClaims = extractClaims(session);
      setClaims(jwtClaims);
      
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in with email:', email);
    
    // Demo mode: always succeed
    if (demoMode.isEnabled()) {
      if (import.meta.env.DEV) {
        monitoring.debug('Demo mode enabled, skipping real auth');
      }
      return { error: null };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error.message, error);
        
        // Handle specific error types
        if (error.message.includes('email_not_confirmed')) {
          console.warn('📧 Email not confirmed for user:', email);
        } else if (error.message.includes('invalid_credentials')) {
          console.warn('🔑 Invalid credentials for user:', email);
        }
        
        return { error };
      } else {
        console.log('✅ Sign in successful for:', email);
        console.log('👤 User data:', data.user?.email, data.user?.id);
        return { error: null };
      }
    } catch (err) {
      console.error('💥 Unexpected sign in error:', err);
      return { error: { message: 'Unexpected error during sign in' } };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string,
    accountType?: 'enterprise' | 'partner' | 'vendor'
  ) => {
    console.log('Attempting sign up with email:', email);
    
    // Demo mode: always succeed
    if (demoMode.isEnabled()) {
      console.log('Demo mode enabled, skipping real auth');
      return { error: null };
    }
    
    // Check if this email has a customer_onboarding record with account_type
    const { data: onboardingData } = await supabase
      .from('customer_onboarding')
      .select('account_type')
      .eq('email', email)
      .maybeSingle();
    
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('Sign up redirect URL:', redirectUrl);
    
    const metadata: Record<string, string> = {
      first_name: firstName || '',
      last_name: lastName || ''
    };
    
    // Prioritize accountType parameter, then onboarding, then default
    if (accountType) {
      metadata.account_type = accountType;
      console.log('Setting account_type from registration form:', accountType);
    } else if (onboardingData?.account_type) {
      metadata.account_type = onboardingData.account_type;
      console.log('Setting account_type from onboarding:', onboardingData.account_type);
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
    } else {
      console.log('Sign up successful, check email for confirmation');
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Signing out user');
    
    if (demoMode.isEnabled()) {
      if (import.meta.env.DEV) {
        monitoring.debug('Disabling demo mode');
      }
      demoMode.disable();
      return;
    }
    
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    // Demo mode: update local state only (no localStorage role)
    if (demoMode.isEnabled()) {
      const demoProfile = createDemoProfile(updates.account_type);
      // Ensure all required fields are present including gamification fields
      const updatedProfile = { 
        ...demoProfile, 
        ...updates,
        compliance_streak: updates.compliance_streak ?? demoProfile.compliance_streak,
        compliance_streak_best: updates.compliance_streak_best ?? demoProfile.compliance_streak_best,
        last_compliance_date: updates.last_compliance_date ?? demoProfile.last_compliance_date
      };
      setProfile(updatedProfile);
      
      // Dispatch custom event for navigation (handled by App-level component)
      if (updates.account_type && typeof window !== 'undefined') {
        console.log('AuthContext - Dispatching profile-type-changed event:', updates.account_type);
        window.dispatchEvent(new CustomEvent('profile-type-changed', {
          detail: { newType: updates.account_type }
        }));
      }
      
      return { error: null };
    }

    // Filter out admin account_type for real database updates (admin only exists in demo mode)
    const dbUpdates = { ...updates };
    if (dbUpdates.account_type === 'admin') {
      // Admin accounts can't be updated in the real database, only in demo mode
      delete dbUpdates.account_type;
    }

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates as Partial<DatabaseProfile>)
      .eq('id', user.id);

    if (!error && profile) {
      const updatedProfile = { ...profile, ...updates } as Profile;
      setProfile(updatedProfile);
      
      // Dispatch custom event for navigation (handled by App-level component)
      if (updates.account_type && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-type-changed', {
          detail: { newType: updates.account_type }
        }));
      }
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      claims,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};