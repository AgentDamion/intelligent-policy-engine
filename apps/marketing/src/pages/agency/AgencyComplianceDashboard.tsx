import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  TrendingUp,
  Shield,
  AlertCircle,
  Activity,
  Brain
} from 'lucide-react';
import { ClientContextSwitcher } from '@/components/agency/ClientContextSwitcher';
import { SubmissionQueues } from '@/components/review/SubmissionQueues';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';
import { useClientsData } from '@/hooks/useClientsData';
import { demoMode, createPharmaDemoData } from '@/utils/demoMode';
import SpecBadge from '@/components/ui/SpecBadge';
import AgencyAIDecisionsFeed from '@/components/agency/AgencyAIDecisionsFeed';
import AgencyAIOrchestrator from '@/components/agency/AgencyAIOrchestrator';
import { AgencyAIAnalytics } from '@/components/agency/AgencyAIAnalytics';
import { PolicyRequestsInbox } from '@/components/agency/PolicyRequestsInbox';
import { KnowledgeBaseManager } from '@/components/agency/KnowledgeBaseManager';
import { RFPQuickAccess } from '@/components/agency/RFPQuickAccess';

const AgencyComplianceDashboard: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const { workspace, loading, error } = useAgencyWorkspace();
  const { clients, stats } = useClientsData();
  
  // Get pharmaceutical demo data for enhanced dashboard
  const pharmaData = demoMode.isEnabled() ? createPharmaDemoData() : null;

  // Fetch urgent RFPs for quick access widget
  const { data: urgentRFPs } = useQuery({
    queryKey: ['urgent-rfps', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data, error } = await supabase.functions.invoke('get-rfp-distributions', {
        body: { workspace_id: workspace.id }
      });

      if (error) throw error;

      const distributions = data?.distributions || [];
      const now = new Date();
      const dueSoonThreshold = addDays(now, 3);

      return distributions
        .filter((d: any) => d.submission_status !== 'submitted' && d.submission_status !== 'approved')
        .map((d: any) => {
          const deadline = new Date(d.response_deadline);
          let urgency: 'overdue' | 'due_soon' | 'new' = 'new';

          if (deadline < now) urgency = 'overdue';
          else if (deadline <= dueSoonThreshold) urgency = 'due_soon';

          return {
            id: d.id,
            distribution_id: d.id,
            enterprise_name: d.policy_versions?.policies?.enterprises?.name || 'Unknown',
            policy_name: d.policy_versions?.policies?.title || 'Untitled',
            version_number: d.policy_versions?.version_number?.toString() || '1',
            response_deadline: d.response_deadline,
            urgency,
            has_draft: d.submission_status === 'draft',
          };
        })
        .sort((a: any, b: any) => {
          // Sort by urgency: overdue > due_soon > new
          const urgencyOrder = { overdue: 0, due_soon: 1, new: 2 };
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });
    },
    enabled: !!workspace?.id,
  });

  const handleAddClient = () => {
    console.log('Add new pharmaceutical client');
  };

  const handleSubmissionSelect = (submission: any) => {
    console.log('Selected submission:', submission);
  };

  const handleReviewAction = (action: 'approve' | 'request_changes', submissionId: string) => {
    console.log('Review action:', action, 'for submission:', submissionId);
  };

  useEffect(() => {
    // Auto-select first client if none selected
    if (!selectedClient && !loading && clients.length > 0) {
      setSelectedClient(clients[0].id.toString());
    }
  }, [selectedClient, loading, clients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading pharmaceutical compliance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Agency Access Required</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedClientData = clients.find(c => c.id.toString() === selectedClient);

  return (
    <div className="space-y-6">
      {/* Agency Header */}
      {workspace && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-brand-teal to-brand-coral rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{workspace.enterprise_name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">Pharmaceutical Compliance Hub</p>
                <SpecBadge id="C1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCompliance}</p>
                <p className="text-sm text-muted-foreground">Compliant Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conflictsDetected}</p>
                <p className="text-sm text-muted-foreground">Risks Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Context Switcher */}
      <ClientContextSwitcher
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        onAddClient={handleAddClient}
      />

      {/* Quick Access Widget */}
      <RFPQuickAccess 
        items={urgentRFPs || []} 
      />
      
      {/* Main Dashboard Content */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="submissions">Submission Review</TabsTrigger>
          <TabsTrigger value="rfp-responses">RFP Responses</TabsTrigger>
          <TabsTrigger value="ai-orchestrator">AI Orchestrator</TabsTrigger>
          <TabsTrigger value="ai-intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI Tool Submission Review Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubmissionQueues 
                  onSubmissionSelect={handleSubmissionSelect}
                  onReviewAction={handleReviewAction}
                />
              </CardContent>
            </Card>
            
            <AgencyAIDecisionsFeed 
              selectedClientId={selectedClient} 
              className="mt-6"
            />
          </div>
        </TabsContent>

        <TabsContent value="rfp-responses">
          <Tabs defaultValue="inbox" className="space-y-6">
            <TabsList>
              <TabsTrigger value="inbox">Policy Request Inbox</TabsTrigger>
              <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox">
              {workspace && <PolicyRequestsInbox workspaceId={workspace.id} />}
            </TabsContent>
            <TabsContent value="knowledge-base">
              {workspace && <KnowledgeBaseManager workspaceId={workspace.id} />}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="ai-orchestrator">
          <AgencyAIOrchestrator selectedClientId={selectedClient} />
        </TabsContent>

        <TabsContent value="ai-intelligence">
          <AgencyAIDecisionsFeed selectedClientId={selectedClient} />
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedClientData && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedClientData.name} - Compliance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Compliance</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClientData.complianceScore}%
                      </span>
                    </div>
                    <Progress value={selectedClientData.complianceScore} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">21 CFR Part 11</span>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GDPR Requirements</span>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HIPAA Safeguards</span>
                      <Badge variant="secondary">Under Review</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Regulatory Framework Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">FDA 21 CFR Part 820 - Quality Systems</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">ICH E6 - Good Clinical Practice</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm">EU MDR - Medical Device Regulation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">ISO 13485 - Action Required</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sla">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  SLA Performance Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">94%</div>
                      <div className="text-sm text-muted-foreground">On-Time Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">18h</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">2.3d</div>
                      <div className="text-sm text-muted-foreground">Avg Resolution</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered SLA Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-300">Predicted Breaches</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">5</div>
                    <div className="text-sm text-yellow-600/80">Next 48 hours</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">Optimization Potential</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">23%</div>
                    <div className="text-sm text-blue-600/80">Efficiency gain</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {workspace && <AgencyAIAnalytics enterpriseId={workspace.enterprise_id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyComplianceDashboard;