import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { monitoring } from '@/utils/monitoring';
import { useRealTimeAIDecisions } from '@/hooks/useRealTimeAIDecisions';
import { useCursorAIIntegration } from '@/hooks/useCursorAIIntegration';
import { 
  Shield, 
  Users, 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  Settings,
  Brain,
  Target,
  Zap,
  Eye,
  ArrowRight,
  RefreshCw,
  Download,
  Clock,
  CheckCircle
} from 'lucide-react';

const ComplianceDashboard = () => {
  // Connect to real Cursor AI system
  const { decisions: aiDecisions, loading: decisionsLoading, isConnected } = useRealTimeAIDecisions();
  const { processing, getCursorProcessingStats } = useCursorAIIntegration();

  // Calculate real metrics from AI decisions
  const recentDecisions = aiDecisions.slice(0, 10);
  const approvedCount = aiDecisions.filter(d => d.outcome === 'approved').length;
  const flaggedCount = aiDecisions.filter(d => d.outcome === 'flagged').length;
  const activeDecisions = aiDecisions.length;
  const complianceScore = Math.round((approvedCount / Math.max(activeDecisions, 1)) * 100);

  return (
    <StandardPageLayout
      title="Enterprise Compliance Dashboard"
      subtitle="AI Governance & Policy Management"
      description="Monitor partner compliance, manage policies, and track AI decision governance across your organization"
      metaLoopBanner={{
        title: "Cursor AI Agent Status",
        description: `AI governance system monitoring ${activeDecisions} active decisions • ${isConnected ? 'Connected' : 'Reconnecting'}`,
        status: isConnected ? "active" : "warning",
        lastUpdate: `${processing ? 'Processing...' : 'Connected'} • Last update: ${new Date().toLocaleTimeString()}`
      }}
      actions={[
        {
          label: "Settings",
          onClick: () => {
            // TODO: Navigate to settings page
            monitoring.trackUserAction('Settings clicked', { source: 'compliance-dashboard' });
          },
          variant: "outline",
          icon: <Settings className="h-4 w-4 mr-2" />
        },
        {
          label: "Create Policy",
          onClick: () => {
            // TODO: Open policy creation modal
            monitoring.trackUserAction('Create policy clicked', { source: 'compliance-dashboard' });
          },
          icon: <Plus className="h-4 w-4 mr-2" />
        }
      ]}
    >
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="AI Approved"
          value={approvedCount}
          change={{ value: approvedCount > 0 ? 12 : 0, type: 'increase', period: 'today' }}
          icon={<Shield className="h-4 w-4 text-brand-teal" />}
          status="success"
        />
        
        <MetricCard
          title="Flagged Items"
          value={flaggedCount}
          change={{ value: flaggedCount > 0 ? -8 : 0, type: 'decrease', period: 'today' }}
          icon={<AlertTriangle className="h-4 w-4 text-brand-coral" />}
          status={flaggedCount > 5 ? "warning" : "success"}
        />
        
        <MetricCard
          title="Compliance Score"
          value={`${complianceScore}%`}
          change={{ value: 3, type: 'increase', period: 'last hour' }}
          icon={<CheckCircle2 className="h-4 w-4 text-brand-green" />}
          status={complianceScore >= 90 ? "success" : "warning"}
        />
        
        <MetricCard
          title="Active Decisions"
          value={activeDecisions}
          change={{ value: 15, type: 'increase', period: 'real-time' }}
          icon={<Activity className="h-4 w-4 text-brand-purple" />}
          status="success"
        />
      </div>

      {/* Three Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-brand-teal" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Submit new AI tool</span>
              </div>
              <p className="text-xs text-muted-foreground ml-7">Add a new AI tool for compliance review</p>
            </div>
            <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Review flagged policies</span>
              </div>
              <p className="text-xs text-muted-foreground ml-7">Review and approve flagged policy violations</p>
            </div>
            <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Revalidate expired tools</span>
              </div>
              <p className="text-xs text-muted-foreground ml-7">Refresh compliance status for expired tools</p>
            </div>
            <div className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Export audit package</span>
              </div>
              <p className="text-xs text-muted-foreground ml-7">Generate comprehensive audit documentation</p>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-brand-green" />
              Agent Status Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <span className="text-sm font-medium">Context Agent</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Idle
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                  <span className="text-sm font-medium">Policy Agent</span>
                </div>
                <Badge className="bg-brand-teal text-white text-xs">
                  Active
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-purple"></div>
                  <span className="text-sm font-medium">Negotiation Agent</span>
                </div>
                <Badge variant="outline" className="bg-brand-purple/10 text-brand-purple text-xs">
                  Monitoring
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <span className="text-sm font-medium">Audit Agent</span>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs flex items-center gap-1">
                  Flagged <AlertTriangle className="w-3 h-3" />
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Workflows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-brand-orange" />
              Active Workflows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">MLR Review: Diabetes Campaign</span>
                <Badge variant="outline" className="text-xs">
                  Running
                </Badge>
              </div>
              <Progress value={75} className="h-2" />
              <span className="text-xs text-muted-foreground">75% complete</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">FDA Update Response</span>
                <Badge className="bg-brand-green/10 text-brand-green text-xs flex items-center gap-1">
                  Completed <CheckCircle className="w-3 h-3" />
                </Badge>
              </div>
              <Progress value={100} className="h-2" />
              <span className="text-xs text-muted-foreground">100% complete</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Tool Compliance Check</span>
                <Badge variant="outline" className="text-xs">
                  Running
                </Badge>
              </div>
              <Progress value={45} className="h-2" />
              <span className="text-xs text-muted-foreground">45% complete</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                <span className="text-sm">View Full Reports</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-teal" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest compliance actions and decisions from your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {decisionsLoading ? (
                // Loading state
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-muted mt-2"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                // Real AI decisions from Cursor system
                recentDecisions.map((decision) => (
                  <div key={decision.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      decision.outcome === 'approved' ? 'bg-brand-green' :
                      decision.outcome === 'flagged' ? 'bg-destructive' :
                      'bg-brand-orange'
                    }`}></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{decision.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {decision.details?.documentTitle || decision.agency || 'AI Agent Processing'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(decision.created_at).toLocaleTimeString()}
                      </p>
                      {decision.details?.reasoning && (
                        <p className="text-xs text-muted-foreground italic">
                          {decision.details.reasoning}
                        </p>
                      )}
                    </div>
                    <Badge className={
                      decision.outcome === 'approved' ? 'bg-brand-green/10 text-brand-green' :
                      decision.outcome === 'flagged' ? 'bg-destructive/10 text-destructive' :
                      'bg-brand-orange/10 text-brand-orange'
                    }>
                      {decision.outcome}
                    </Badge>
                  </div>
                ))
              )}
              
              {!decisionsLoading && recentDecisions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent AI decisions</p>
                  <p className="text-xs text-muted-foreground">Submit a policy for AI processing to see activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Policy Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-teal" />
              Policy Management
            </CardTitle>
            <CardDescription>
              Manage and create compliance policies for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Policy Management Coming Soon"
              description="Enhanced policy creation and management tools are being developed. Get started by creating your first policy or importing existing ones."
              icon={<Shield />}
              actions={[
                {
                  label: "Create First Policy",
                  onClick: () => {
                    // TODO: Open policy creation modal
                    monitoring.trackUserAction('Create first policy clicked', { source: 'empty-state' });
                  },
                  icon: <Plus className="h-4 w-4 mr-2" />
                },
                {
                  label: "Import Policies",
                  onClick: () => {
                    // TODO: Open import dialog
                    monitoring.trackUserAction('Import policies clicked', { source: 'empty-state' });
                  },
                  variant: "outline",
                  icon: <FileText className="h-4 w-4 mr-2" />
                }
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-brand-green" />
            Compliance Overview
          </CardTitle>
          <CardDescription>
            Organization-wide compliance metrics and status summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-green mb-2">{approvedCount}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                AI Approved
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-orange mb-2">{flaggedCount}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4 text-brand-orange" />
                AI Flagged
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-teal mb-2">{isConnected ? 'LIVE' : 'OFF'}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Brain className="w-4 h-4 text-brand-teal" />
                Cursor AI System
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-green mb-2">{complianceScore}%</div>
              <div className="text-sm text-muted-foreground mb-2">Live Compliance Score</div>
              <Progress value={complianceScore} className="h-2" />
            </div>
          </div>
          <div className="text-center">
            <Button className="bg-brand-teal hover:bg-brand-teal/90 px-6">
              <Eye className="h-4 w-4 mr-2" />
              View Full Compliance Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
};

export default ComplianceDashboard;