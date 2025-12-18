import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureGate } from '@/components/FeatureGate';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Brain, Zap, Users, Building } from 'lucide-react';
import InvitePartnerForm from '@/components/InvitePartnerForm';

const TierDemo = () => {
  // Using a demo enterprise ID for testing
  const demoEnterpriseId = 'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6';
  const tierData = useSubscriptionTier(demoEnterpriseId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Tier Enforcement Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating subscription tier validation and feature gating
        </p>
      </div>

      {/* Current Tier Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Current Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2 capitalize">
                {tierData.tier.replace('_', ' ')}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Current Tier</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{tierData.currentPartners}/{tierData.maxPartners}</div>
              <p className="text-sm text-muted-foreground">Partners Used</p>
              <Progress value={(tierData.currentPartners / tierData.maxPartners) * 100} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{tierData.currentWorkspaces}/{tierData.maxWorkspaces}</div>
              <p className="text-sm text-muted-foreground">Workspaces Used</p>
              <Progress value={(tierData.currentWorkspaces / tierData.maxWorkspaces) * 100} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Gates Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Export Feature */}
        <FeatureGate feature="audit_export" enterpriseId={demoEnterpriseId}>
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Shield className="h-5 w-5" />
                Audit Package Export
              </CardTitle>
              <CardDescription>
                Generate regulatory-ready audit packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ✅ Available in your {tierData.tier.replace('_', ' ')} plan
              </p>
            </CardContent>
          </Card>
        </FeatureGate>

        {/* Tool Intelligence Feature */}
        <FeatureGate feature="tool_intelligence" enterpriseId={demoEnterpriseId}>
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Brain className="h-5 w-5" />
                Tool Intelligence Analyzer
              </CardTitle>
              <CardDescription>
                AI-powered tool risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ✅ Available in your {tierData.tier.replace('_', ' ')} plan
              </p>
            </CardContent>
          </Card>
        </FeatureGate>

        {/* Advanced Workflows Feature */}
        <FeatureGate feature="advanced_workflows" enterpriseId={demoEnterpriseId}>
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Zap className="h-5 w-5" />
                Advanced Workflows
              </CardTitle>
              <CardDescription>
                Custom automation and approval flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ✅ Available in your {tierData.tier.replace('_', ' ')} plan
              </p>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>

      {/* Partner Invitation with Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partner Invitation (With Limits)
          </h2>
          <InvitePartnerForm enterpriseId={demoEnterpriseId} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upgrade Prompts Preview</h2>
          
          <UpgradePrompt
            currentTier="foundation"
            nextTier="enterprise"
            context="partner_limit"
            currentUsage={10}
            maxUsage={10}
          />

          <UpgradePrompt
            currentTier="foundation"
            nextTier="enterprise"
            context="feature_access"
            feature="tool_intelligence"
          />

          <UpgradePrompt
            currentTier="enterprise"
            nextTier="network_command"
            context="feature_access"
            feature="advanced_workflows"
          />
        </div>
      </div>

      {/* Tier Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Comparison</CardTitle>
          <CardDescription>See what's available in each subscription tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <Badge variant="outline" className="text-lg px-4 py-2">Foundation</Badge>
              <div className="space-y-2 text-sm">
                <div>🏢 10 Partners</div>
                <div>📁 5 Workspaces</div>
                <div>❌ No Audit Export</div>
                <div>❌ No Tool Intelligence</div>
                <div>❌ No Advanced Workflows</div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Badge variant="secondary" className="text-lg px-4 py-2">Enterprise</Badge>
              <div className="space-y-2 text-sm">
                <div>🏢 50 Partners</div>
                <div>📁 25 Workspaces</div>
                <div>✅ Audit Export</div>
                <div>❌ No Tool Intelligence</div>
                <div>✅ Advanced Workflows</div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Badge variant="default" className="text-lg px-4 py-2">Network Command</Badge>
              <div className="space-y-2 text-sm">
                <div>🏢 1000 Partners</div>
                <div>📁 100 Workspaces</div>
                <div>✅ Audit Export</div>
                <div>✅ Tool Intelligence</div>
                <div>✅ Advanced Workflows</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TierDemo;