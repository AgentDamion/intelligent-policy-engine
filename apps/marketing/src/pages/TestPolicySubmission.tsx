/**
 * Test page for Policy Submission - demonstrates Lovable → Cursor integration
 */
import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { PolicyWizard } from '@/components/policy/wizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTimeAIDecisions } from '@/hooks/useRealTimeAIDecisions';
import { Brain, Zap, FileText, Activity } from 'lucide-react';

const TestPolicySubmission = () => {
  // Sample enterprise ID for testing
  const testEnterpriseId = '550e8400-e29b-41d4-a716-446655440001';
  
  const { decisions, isConnected } = useRealTimeAIDecisions(testEnterpriseId);
  const recentDecisions = decisions.slice(0, 5);

  const handleSubmissionComplete = (result: any) => {
    console.log('Policy submission completed:', result);
  };

  return (
    <StandardPageLayout
      title="Test Policy Submission"
      subtitle="Lovable ↔ Cursor AI Integration Demo"
      description="Submit a policy document to test the end-to-end integration between Lovable frontend and Cursor AI processing system"
      metaLoopBanner={{
        title: "Integration Test Mode",
        description: `Testing Lovable → Cursor AI → Supabase data flow • Status: ${isConnected ? 'Connected' : 'Reconnecting'}`,
        status: isConnected ? "active" : "warning",
        lastUpdate: `Real-time updates ${isConnected ? 'enabled' : 'disabled'}`
      }}
      actions={[
        {
          label: "View Source Code",
          onClick: () => window.open('https://github.com/your-repo', '_blank'),
          variant: "outline",
          icon: <FileText className="h-4 w-4 mr-2" />
        }
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Wizard - 2/3 width */}
        <div className="lg:col-span-2">
          <PolicyWizard 
            enterpriseId={testEnterpriseId}
            onComplete={handleSubmissionComplete}
          />
        </div>

        {/* Live Activity Feed - 1/3 width */}
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-brand-teal" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cursor AI Agents</span>
                <Badge className={isConnected ? 'bg-brand-green' : 'bg-brand-orange'}>
                  {isConnected ? 'Online' : 'Connecting'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Real-time Updates</span>
                <Badge variant="outline" className="text-brand-teal">
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Decisions Processed</span>
                <Badge variant="secondary">
                  {decisions.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent AI Decisions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-brand-purple" />
                Live AI Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDecisions.length > 0 ? (
                <div className="space-y-3">
                  {recentDecisions.map((decision) => (
                    <div key={decision.id} className="p-3 rounded-lg bg-muted/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{decision.agent}</span>
                        <Badge className={
                          decision.outcome === 'approved' ? 'bg-brand-green/10 text-brand-green' :
                          decision.outcome === 'flagged' ? 'bg-destructive/10 text-destructive' :
                          'bg-brand-orange/10 text-brand-orange'
                        }>
                          {decision.outcome}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {decision.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(decision.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent decisions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submit a policy to see AI processing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-brand-orange" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-brand-teal">1</span>
                </div>
                <p className="text-muted-foreground">
                  Lovable UI sends policy to Cursor API
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-brand-purple">2</span>
                </div>
                <p className="text-muted-foreground">
                  Cursor AI agents process and analyze
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-brand-green">3</span>
                </div>
                <p className="text-muted-foreground">
                  Results stored in Supabase for real-time display
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default TestPolicySubmission;