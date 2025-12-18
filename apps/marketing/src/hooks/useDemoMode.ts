import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

const DEMO_MODE_KEY = 'aicomply_demo_mode';

interface EffectiveState {
  effective_enabled: boolean;
  preference_source: 'manual' | 'auto_rule' | 'default';
  account_type: string;
}

interface AutoEnableRules {
  auto_enable_for_partner?: boolean;
  auto_enable_for_vendor?: boolean;
  auto_enable_for_enterprise?: boolean;
}

export const useDemoMode = () => {
  const { user, profile } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    // Default to localStorage for initial render
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [preferenceSource, setPreferenceSource] = useState<'manual' | 'auto_rule' | 'default'>('default');

  // Check if user is a demo user (synthetic auth)
  const isDemoUser = useCallback((userId?: string) => {
    if (!userId) return false;
    return userId.startsWith('11111111') || userId.startsWith('22222222') || userId.startsWith('33333333');
  }, []);

  // Fetch effective demo mode state from database
  const fetchEffectiveState = useCallback(async () => {
    if (!user || isDemoUser(user.id)) {
      // For unauthenticated or demo users, use localStorage
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_effective_demo_mode_state', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching demo mode state:', error);
        // Fallback to localStorage on error
        return;
      }

      if (data && data.length > 0) {
        const state = data[0] as EffectiveState;
        setIsDemoMode(state.effective_enabled);
        setPreferenceSource(state.preference_source);

        // Sync with localStorage for consistency
        localStorage.setItem(DEMO_MODE_KEY, String(state.effective_enabled));

        // Log auto-enable if it occurred
        if (state.preference_source === 'auto_rule' && state.effective_enabled) {
          const auditLog: Database['public']['Tables']['demo_mode_audit_log']['Insert'] = {
            user_id: user.id,
            action: 'auto_enabled',
            trigger_source: 'auto_rule',
            account_type: state.account_type,
            new_state: true,
            metadata: { reason: `Auto-enabled for ${state.account_type} account` }
          };
          await supabase.from('demo_mode_audit_log').insert(auditLog);
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching demo mode state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemoUser]);

  // Migrate existing localStorage preference to database on first load
  const migrateLocalStoragePreference = useCallback(async () => {
    if (!user || isDemoUser(user.id)) return;

    const localValue = localStorage.getItem(DEMO_MODE_KEY);
    if (localValue === 'true') {
      // Check if preference already exists
      const { data: existing } = await supabase
        .from('demo_mode_preferences')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        // Migrate localStorage to database with manual preference
        await supabase.from('demo_mode_preferences').upsert({
          user_id: user.id,
          enabled: true,
          preference_source: 'manual',
          last_toggled_at: new Date().toISOString()
        });

        const migrationLog: Database['public']['Tables']['demo_mode_audit_log']['Insert'] = {
          user_id: user.id,
          action: 'migrated',
          trigger_source: 'system',
          account_type: profile?.account_type || 'unknown',
          new_state: true,
          metadata: { source: 'localStorage_migration' }
        };
        await supabase.from('demo_mode_audit_log').insert(migrationLog);
      }
    }
  }, [user, profile, isDemoUser]);

  // Initial load: fetch from database
  useEffect(() => {
    if (user && !isDemoUser(user.id)) {
      migrateLocalStoragePreference().then(() => {
        fetchEffectiveState();
      });
    }
  }, [user, fetchEffectiveState, migrateLocalStoragePreference, isDemoUser]);

  // Fallback: sync localStorage for unauthenticated users
  useEffect(() => {
    if (!user || isDemoUser(user.id)) {
      localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));
    }
  }, [isDemoMode, user, isDemoUser]);

  // Toggle demo mode with database persistence
  const toggleDemoMode = useCallback(async () => {
    const newValue = !isDemoMode;
    setIsDemoMode(newValue);

    // For unauthenticated or demo users, only update localStorage
    if (!user || isDemoUser(user.id)) {
      localStorage.setItem(DEMO_MODE_KEY, String(newValue));
      return;
    }

    // For authenticated users, persist to database
    try {
      await supabase.from('demo_mode_preferences').upsert({
        user_id: user.id,
        enabled: newValue,
        preference_source: 'manual',
        last_toggled_at: new Date().toISOString()
      });

      // Insert audit log
      const toggleLog: Database['public']['Tables']['demo_mode_audit_log']['Insert'] = {
        user_id: user.id,
        action: newValue ? 'enabled' : 'disabled',
        trigger_source: 'manual',
        account_type: profile?.account_type || 'unknown',
        previous_state: !newValue,
        new_state: newValue,
        metadata: { source: 'useDemoMode_toggle' },
        user_agent: navigator.userAgent
      };
      await supabase.from('demo_mode_audit_log').insert(toggleLog);

      setPreferenceSource('manual');
      localStorage.setItem(DEMO_MODE_KEY, String(newValue));
    } catch (error) {
      console.error('Error toggling demo mode:', error);
      // Revert on error
      setIsDemoMode(!newValue);
    }
  }, [isDemoMode, user, profile, isDemoUser]);

  const enableDemoMode = useCallback(async () => {
    if (isDemoMode) return; // Already enabled

    setIsDemoMode(true);

    if (!user || isDemoUser(user.id)) {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      return;
    }

    try {
      await supabase.from('demo_mode_preferences').upsert({
        user_id: user.id,
        enabled: true,
        preference_source: 'manual',
        last_toggled_at: new Date().toISOString()
      });

      const enableLog: Database['public']['Tables']['demo_mode_audit_log']['Insert'] = {
        user_id: user.id,
        action: 'enabled',
        trigger_source: 'manual',
        account_type: profile?.account_type || 'unknown',
        previous_state: false,
        new_state: true,
        metadata: { source: 'useDemoMode_enable' },
        user_agent: navigator.userAgent
      };
      await supabase.from('demo_mode_audit_log').insert(enableLog);

      setPreferenceSource('manual');
      localStorage.setItem(DEMO_MODE_KEY, 'true');
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      setIsDemoMode(false);
    }
  }, [isDemoMode, user, profile, isDemoUser]);

  const disableDemoMode = useCallback(async () => {
    if (!isDemoMode) return; // Already disabled

    setIsDemoMode(false);

    if (!user || isDemoUser(user.id)) {
      localStorage.setItem(DEMO_MODE_KEY, 'false');
      return;
    }

    try {
      await supabase.from('demo_mode_preferences').upsert({
        user_id: user.id,
        enabled: false,
        preference_source: 'manual',
        last_toggled_at: new Date().toISOString()
      });

      const disableLog: Database['public']['Tables']['demo_mode_audit_log']['Insert'] = {
        user_id: user.id,
        action: 'disabled',
        trigger_source: 'manual',
        account_type: profile?.account_type || 'unknown',
        previous_state: true,
        new_state: false,
        metadata: { source: 'useDemoMode_disable' },
        user_agent: navigator.userAgent
      };
      await supabase.from('demo_mode_audit_log').insert(disableLog);

      setPreferenceSource('manual');
      localStorage.setItem(DEMO_MODE_KEY, 'false');
    } catch (error) {
      console.error('Error disabling demo mode:', error);
      setIsDemoMode(true);
    }
  }, [isDemoMode, user, profile, isDemoUser]);

  // Update auto-enable rules (for settings UI)
  const updateAutoEnableRules = useCallback(async (rules: AutoEnableRules) => {
    if (!user || isDemoUser(user.id)) {
      console.warn('Cannot update auto-enable rules for unauthenticated or demo users');
      return;
    }

    try {
      await supabase.from('demo_mode_preferences').upsert({
        user_id: user.id,
        ...rules,
        updated_at: new Date().toISOString()
      });

      // Log configuration change
      const configLog: Database['public']['Tables']['demo_mode_audit_log']['Insert'] = {
        user_id: user.id,
        action: 'config_updated',
        trigger_source: 'manual',
        account_type: profile?.account_type || 'unknown',
        new_state: true, // Required field, represents config is active
        metadata: { 
          source: 'updateAutoEnableRules',
          auto_enable_for_partner: rules.auto_enable_for_partner,
          auto_enable_for_vendor: rules.auto_enable_for_vendor,
          auto_enable_for_enterprise: rules.auto_enable_for_enterprise
        },
        user_agent: navigator.userAgent
      };
      await supabase.from('demo_mode_audit_log').insert(configLog);

      // Re-evaluate effective state after updating rules
      await fetchEffectiveState();
    } catch (error) {
      console.error('Error updating auto-enable rules:', error);
    }
  }, [user, profile, fetchEffectiveState, isDemoUser]);

  return {
    isDemoMode,
    isLoading,
    preferenceSource,
    toggleDemoMode,
    enableDemoMode,
    disableDemoMode,
    updateAutoEnableRules,
  };
};
