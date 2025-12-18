import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Sparkles } from "lucide-react";
import { monitoring } from '@/utils/monitoring';
import { routes } from '@/lib/routes';

// New navigation components
import { EnterpriseGlobalNav } from './EnterpriseGlobalNav';
import { EnterpriseSecondaryNav } from './EnterpriseSecondaryNav';
import { EnterpriseHeaderModule } from './EnterpriseHeaderModule';

// Enterprise components
import EnterpriseStatsOverview from './EnterpriseStatsOverview';
import PolicyManager from './PolicyManager';
import AgencyComplianceList from './AgencyComplianceList';
import SubmissionReview from './SubmissionReview';
import AIDecisionsFeed from './AIDecisionsFeed';
import NewPolicyModal from './NewPolicyModal';
import { InvitePartnerDialog } from './InvitePartnerDialog';
import LoadingSpinner from './LoadingSpinner';
import { MetaLoopInsights } from './MetaLoopInsights';
import { GovernanceEvidenceCenter } from './GovernanceEvidenceCenter';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useEnterpriseData } from '@/hooks/useEnterpriseData';

const EnterpriseDashboard: React.FC = () => {
  const { 
    agencies, 
    policies, 
    submissions, 
    stats, 
    loading,
    enterpriseId,
    createPolicy,
    updatePolicy,
    archivePolicy,
    distributePolicy,
    reviewSubmission 
  } = useEnterpriseData();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false);
  const [showInvitePartnerDialog, setShowInvitePartnerDialog] = useState(false);

  const handleAddPartner = () => {
    monitoring.trackUserAction('Add partner clicked', { source: 'enterprise-dashboard' });
    setShowInvitePartnerDialog(true);
  };

  const handleNewPolicy = () => {
    setShowNewPolicyModal(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading enterprise dashboard..." size="lg" />;
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Premium Agentic UI Teaser */}
          <div className="bg-gradient-to-r from-ink-900 to-ink-800 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">New: Agentic Governance UI</h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white/20 rounded">PREMIUM</span>
                </div>
                <p className="text-sm text-white/80 mb-4">Multi-agent policy orchestration with real-time conversation streams, decision networks, and proof bundles.</p>
                <a 
                  href="/agentic?tab=weave" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-ink-900 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Try Agentic UI
                  <Sparkles className="h-4 w-4" />
                </a>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-3xl font-bold mb-1">4</div>
                <div className="text-xs text-white/70">Agent-first tabs</div>
              </div>
            </div>
          </div>

          {/* Enterprise Header Module */}
          <EnterpriseHeaderModule 
            stats={{
              riskScore: stats?.complianceRate || 93,
              totalTools: stats?.activePolicies || 42,
              totalPartners: stats?.activeAgencies || 8,
              documentationRate: 93
            }}
            onAddPartner={handleAddPartner}
            onNewPolicy={handleNewPolicy}
          />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="policies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Policies
              </TabsTrigger>
              <TabsTrigger value="agencies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Partners
              </TabsTrigger>
              <TabsTrigger value="submissions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4 mr-2" />
                Review
              </TabsTrigger>
              <TabsTrigger value="evidence" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Evidence
              </TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <MetaLoopInsights />
            <AgencyComplianceList agencies={agencies} />
            <AIDecisionsFeed />
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <PolicyManager 
              policies={policies} 
              onCreatePolicy={createPolicy}
              onUpdatePolicy={updatePolicy}
              onArchivePolicy={archivePolicy}
              onDistributePolicy={distributePolicy}
            />
          </TabsContent>

          <TabsContent value="agencies" className="space-y-4">
            <AgencyComplianceList agencies={agencies} detailed={true} />
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <SubmissionReview submissions={submissions} onReviewSubmission={reviewSubmission} />
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <GovernanceEvidenceCenter />
          </TabsContent>
          </Tabs>

          <NewPolicyModal
            open={showNewPolicyModal}
            onClose={() => setShowNewPolicyModal(false)}
            onSuccess={() => {
              setShowNewPolicyModal(false);
              // Data will automatically refresh due to the createPolicy function updating state
            }}
            onCreatePolicy={createPolicy}
          />

          <InvitePartnerDialog
            open={showInvitePartnerDialog}
            onOpenChange={setShowInvitePartnerDialog}
            enterpriseId={enterpriseId}
          />
        </div>
    </ErrorBoundary>
  );
};

export default EnterpriseDashboard;