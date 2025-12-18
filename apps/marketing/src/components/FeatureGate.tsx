import React from 'react';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  children: React.ReactNode;
  feature: 'audit_export' | 'tool_intelligence' | 'advanced_workflows';
  enterpriseId?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  feature,
  enterpriseId,
  fallback,
  showUpgradePrompt = true,
}) => {
  const tierData = useSubscriptionTier(enterpriseId);

  if (tierData.loading) {
    return <div className="animate-pulse bg-muted h-8 rounded" />;
  }

  const hasFeature = tierData.features[feature];

  if (hasFeature) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        currentTier={tierData.tier}
        nextTier={tierData.nextTierRecommendation}
        feature={feature}
        context="feature_access"
      />
    );
  }

  return null;
};