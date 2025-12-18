import React, { useState, useEffect } from 'react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { supabase } from '@/integrations/supabase/client';
import { DemoModeStatusCard } from './DemoModeStatusCard';
import { AutoEnableRulesCard } from './AutoEnableRulesCard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const DemoModeSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    isDemoMode,
    isLoading: demoModeLoading,
    preferenceSource,
    toggleDemoMode,
    updateAutoEnableRules,
  } = useDemoMode();

  const [preferences, setPreferences] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [lastChanged, setLastChanged] = useState<string | undefined>();
  const [currentAccountType, setCurrentAccountType] = useState<'partner' | 'vendor' | 'enterprise' | null>(null);

  const fetchPreferences = async () => {
    if (!user?.id) return;

    try {
      setPrefsLoading(true);
      const { data, error } = await supabase
        .from('demo_mode_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching preferences:', error);
        return;
      }

      setPreferences(data);
      if (data?.updated_at) {
        setLastChanged(data.updated_at);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setPrefsLoading(false);
    }
  };

  const fetchAccountType = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching account type:', error);
        return;
      }

      if (data?.account_type) {
        setCurrentAccountType(data.account_type as 'partner' | 'vendor' | 'enterprise');
      }
    } catch (error) {
      console.error('Failed to fetch account type:', error);
    }
  };

  useEffect(() => {
    fetchPreferences();
    fetchAccountType();
  }, [user?.id]);

  const handleSaveRules = async (rules: {
    auto_enable_for_partner: boolean;
    auto_enable_for_vendor: boolean;
    auto_enable_for_enterprise: boolean;
  }) => {
    await updateAutoEnableRules(rules);
    // Re-fetch preferences to update the UI
    await fetchPreferences();
  };

  if (prefsLoading || demoModeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Demo Mode Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Manage demo mode settings and auto-enable rules for your account
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DemoModeStatusCard
          isDemoMode={isDemoMode}
          isLoading={demoModeLoading}
          preferenceSource={preferenceSource}
          lastChanged={lastChanged}
          onToggle={toggleDemoMode}
        />

        <AutoEnableRulesCard
          preferences={preferences}
          currentAccountType={currentAccountType}
          onSave={handleSaveRules}
        />
      </div>
    </div>
  );
};
