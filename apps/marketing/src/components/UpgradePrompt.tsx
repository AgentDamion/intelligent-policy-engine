import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, Zap, Shield, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  currentTier: 'foundation' | 'enterprise' | 'network_command';
  nextTier: string;
  feature?: string;
  context: 'partner_limit' | 'workspace_limit' | 'feature_access';
  currentUsage?: number;
  maxUsage?: number;
}

const getFeatureIcon = (feature?: string) => {
  switch (feature) {
    case 'audit_export':
      return <Shield className="h-5 w-5" />;
    case 'tool_intelligence':
      return <Brain className="h-5 w-5" />;
    case 'advanced_workflows':
      return <Zap className="h-5 w-5" />;
    default:
      return <ArrowUpCircle className="h-5 w-5" />;
  }
};

const getFeatureName = (feature?: string) => {
  switch (feature) {
    case 'audit_export':
      return 'Audit Package Export';
    case 'tool_intelligence':
      return 'Tool Intelligence Analyzer';
    case 'advanced_workflows':
      return 'Advanced Workflows';
    default:
      return 'Premium Feature';
  }
};

const getContextMessage = (context: string, currentUsage?: number, maxUsage?: number, feature?: string) => {
  switch (context) {
    case 'partner_limit':
      return {
        title: 'Partner Limit Reached',
        description: `You've reached your limit of ${maxUsage} partners. Upgrade to add more team members.`,
      };
    case 'workspace_limit':
      return {
        title: 'Workspace Limit Reached',
        description: `You've reached your limit of ${maxUsage} workspaces. Upgrade to create more projects.`,
      };
    case 'feature_access':
      return {
        title: `${getFeatureName(feature)} Required`,
        description: `This feature is available in higher tiers. Upgrade to unlock ${getFeatureName(feature)}.`,
      };
    default:
      return {
        title: 'Upgrade Required',
        description: 'Upgrade your plan to access this feature.',
      };
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'foundation':
      return 'bg-blue-500';
    case 'enterprise':
      return 'bg-purple-500';
    case 'network_command':
      return 'bg-gold-500';
    default:
      return 'bg-brand-teal';
  }
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentTier,
  nextTier,
  feature,
  context,
  currentUsage,
  maxUsage,
}) => {
  const navigate = useNavigate();
  const { title, description } = getContextMessage(context, currentUsage, maxUsage, feature);

  const handleUpgrade = () => {
    // Navigate to pricing page with pre-selected tier
    navigate(`/pricing?recommended=${nextTier}&from=${currentTier}`);
  };

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10">
            {getFeatureIcon(feature)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              Current: {currentTier.replace('_', ' ')}
            </Badge>
            {currentUsage !== undefined && maxUsage !== undefined && (
              <span className="text-sm text-muted-foreground">
                {currentUsage}/{maxUsage} used
              </span>
            )}
          </div>
          <Button onClick={handleUpgrade} size="sm" className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Upgrade to {nextTier.replace('_', ' ')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};