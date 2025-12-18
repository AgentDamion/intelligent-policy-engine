import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutoEnableRulesCardProps {
  preferences: {
    auto_enable_for_partner: boolean;
    auto_enable_for_vendor: boolean;
    auto_enable_for_enterprise: boolean;
  } | null;
  currentAccountType?: 'partner' | 'vendor' | 'enterprise' | null;
  onSave: (rules: {
    auto_enable_for_partner: boolean;
    auto_enable_for_vendor: boolean;
    auto_enable_for_enterprise: boolean;
  }) => Promise<void>;
}

export const AutoEnableRulesCard: React.FC<AutoEnableRulesCardProps> = ({
  preferences,
  currentAccountType,
  onSave
}) => {
  const { toast } = useToast();
  const [rules, setRules] = useState({
    auto_enable_for_partner: preferences?.auto_enable_for_partner ?? true,
    auto_enable_for_vendor: preferences?.auto_enable_for_vendor ?? true,
    auto_enable_for_enterprise: preferences?.auto_enable_for_enterprise ?? false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setRules({
        auto_enable_for_partner: preferences.auto_enable_for_partner,
        auto_enable_for_vendor: preferences.auto_enable_for_vendor,
        auto_enable_for_enterprise: preferences.auto_enable_for_enterprise,
      });
    }
  }, [preferences]);

  useEffect(() => {
    if (preferences) {
      const changed =
        rules.auto_enable_for_partner !== preferences.auto_enable_for_partner ||
        rules.auto_enable_for_vendor !== preferences.auto_enable_for_vendor ||
        rules.auto_enable_for_enterprise !== preferences.auto_enable_for_enterprise;
      setHasChanges(changed);
    }
  }, [rules, preferences]);

  const handleToggle = (key: keyof typeof rules) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(rules);
      toast({
        title: 'Success',
        description: 'Auto-enable rules updated successfully',
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update rules',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const showWarning =
    (currentAccountType === 'partner' && rules.auto_enable_for_partner) ||
    (currentAccountType === 'vendor' && rules.auto_enable_for_vendor) ||
    (currentAccountType === 'enterprise' && rules.auto_enable_for_enterprise);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Enable Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure when demo mode automatically activates based on your account type
        </p>

        <div className="space-y-3">
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="font-medium">Partner Accounts</div>
                  <div className="text-sm text-muted-foreground">
                    Auto-enable when you log in as a partner/agency user
                  </div>
                </div>
                <Switch
                  checked={rules.auto_enable_for_partner}
                  onCheckedChange={() => handleToggle('auto_enable_for_partner')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="font-medium">Vendor Accounts</div>
                  <div className="text-sm text-muted-foreground">
                    Auto-enable when you log in as a vendor/tool provider
                  </div>
                </div>
                <Switch
                  checked={rules.auto_enable_for_vendor}
                  onCheckedChange={() => handleToggle('auto_enable_for_vendor')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="font-medium">Enterprise Accounts</div>
                  <div className="text-sm text-muted-foreground">
                    Auto-enable when you log in as an enterprise compliance admin
                  </div>
                </div>
                <Switch
                  checked={rules.auto_enable_for_enterprise}
                  onCheckedChange={() => handleToggle('auto_enable_for_enterprise')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {showWarning && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are currently logged in as {currentAccountType}. Auto-enable is active for this type.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};
