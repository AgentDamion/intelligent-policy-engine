import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Building2, Users, Shield, Zap, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AgencySubscription {
  id: string;
  subscription_tier: string;
  is_enterprise_mode: boolean;
  enterprise_features_enabled: any;
  activated_at: string | null;
}

interface AgencyUpgradePathProps {
  agencyEnterpriseId: string;
}

const ENTERPRISE_FEATURES = [
  {
    key: 'policy_creation',
    name: 'Create Custom Policies',
    description: 'Design and distribute policies to your sub-contractors',
    icon: Shield
  },
  {
    key: 'sub_contractor_management',
    name: 'Sub-Contractor Network',
    description: 'Invite and manage your own agency partners',
    icon: Users
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Enterprise-grade compliance analytics and reporting',
    icon: Zap
  },
  {
    key: 'white_label',
    name: 'White Label Portal',
    description: 'Brand the platform with your agency identity',
    icon: Building2
  }
];

export const AgencyUpgradePath: React.FC<AgencyUpgradePathProps> = ({
  agencyEnterpriseId
}) => {
  const [subscription, setSubscription] = useState<AgencySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [agencyEnterpriseId]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_subscriptions')
        .select('*')
        .eq('agency_enterprise_id', agencyEnterpriseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      setSubscription(data || null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToEnterprise = async () => {
    setUpgrading(true);
    try {
      if (subscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('agency_subscriptions')
          .update({
            is_enterprise_mode: true,
            enterprise_features_enabled: {
              policy_creation: true,
              sub_contractor_management: true,
              advanced_analytics: true,
              white_label: false // Premium feature
            },
            activated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('agency_subscriptions')
          .insert({
            agency_enterprise_id: agencyEnterpriseId,
            subscription_tier: 'enterprise',
            is_enterprise_mode: true,
            enterprise_features_enabled: {
              policy_creation: true,
              sub_contractor_management: true,
              advanced_analytics: true,
              white_label: false
            },
            activated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success('Successfully upgraded to Enterprise mode!');
      fetchSubscription();
    } catch (error) {
      console.error('Error upgrading to enterprise:', error);
      toast.error('Failed to upgrade to Enterprise mode');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnterpriseMode = subscription?.is_enterprise_mode || false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Agency Enterprise Upgrade
          </h3>
          <p className="text-sm text-muted-foreground">
            Unlock enterprise capabilities to grow your agency network
          </p>
        </div>
        {isEnterpriseMode && (
          <Badge className="bg-yellow-100 text-yellow-800">
            Enterprise Mode Active
          </Badge>
        )}
      </div>

      {isEnterpriseMode ? (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Crown className="h-5 w-5" />
              Enterprise Mode Active
            </CardTitle>
            <CardDescription>
              Your agency now has full enterprise capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENTERPRISE_FEATURES.map(feature => {
                const Icon = feature.icon;
                const isEnabled = subscription?.enterprise_features_enabled?.[feature.key] || false;
                
                return (
                  <div key={feature.key} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-4 w-4 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{feature.name}</h4>
                        {isEnabled && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Enterprise Mode</CardTitle>
            <CardDescription>
              Transform your agency into a full enterprise with advanced capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Enterprise mode allows you to create policies, manage sub-contractors, 
                and access advanced analytics while maintaining your agency partnerships.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">Enterprise Features You'll Unlock:</h4>
              <div className="grid gap-3">
                {ENTERPRISE_FEATURES.map(feature => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.key} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{feature.name}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Ready to upgrade?</p>
                  <p className="text-sm text-muted-foreground">
                    Keep your current agency partnerships while gaining enterprise powers
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">$299</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </div>
              
              <Button 
                onClick={handleUpgradeToEnterprise} 
                disabled={upgrading}
                className="w-full"
                size="lg"
              >
                {upgrading ? (
                  'Upgrading...'
                ) : (
                  <>
                    Upgrade to Enterprise Mode
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};