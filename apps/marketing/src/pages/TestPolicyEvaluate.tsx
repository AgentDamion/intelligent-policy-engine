import React, { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { invokeWithAuth } from '@/lib/supabase/invokeWithAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Play, FileCode, RefreshCw } from 'lucide-react';

interface Verdict {
  status: 'Approved' | 'Prohibited' | 'RequiresReview';
  reason: string;
  rule_id?: string;
  policySnapshotId?: string;
}

const TestPolicyEvaluate = () => {
  const [loading, setLoading] = useState(false);
  const [loadingRules, setLoadingRules] = useState(true);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [rulesSource, setRulesSource] = useState<'database' | 'hardcoded'>('hardcoded');
  const { toast } = useToast();

  // Fetch rules from database on component mount
  useEffect(() => {
    fetchRulesFromDatabase();
  }, []);

  const fetchRulesFromDatabase = async () => {
    setLoadingRules(true);
    try {
      const { data, error } = await invokeWithAuth<{ rules: any[] }>('policy-rules-manage', {
        method: 'GET',
        context_id: 'global-media-tools'
      });
      
      if (error) throw error;
      
      if (data?.rules && data.rules.length > 0) {
        // Extract the 'rule' JSONB column from database records
        const fetchedRules = data.rules.map((r: any) => r.rule);
        setRules(fetchedRules);
        setRulesSource('database');
        toast({
          title: "Rules loaded from database",
          description: `Successfully loaded ${fetchedRules.length} rules`,
        });
      } else {
        // No rules in database, use hardcoded fallback
        setRules(sampleRules);
        setRulesSource('hardcoded');
        toast({
          title: "Using hardcoded rules",
          description: "No rules found in database. Using fallback sample rules.",
          variant: "default"
        });
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err);
      setRules(sampleRules);
      setRulesSource('hardcoded');
      toast({
        title: "Failed to load rules from database",
        description: "Using fallback hardcoded rules",
        variant: "destructive"
      });
    } finally {
      setLoadingRules(false);
    }
  };

  // Sample tool usage event
  const sampleEvent = {
    tool: { 
      id: "gpt-4", 
      name: "GPT-4", 
      version: "2024-01-01" 
    },
    actor: { 
      role: "researcher" 
    },
    action: { 
      type: "Research", 
      note: "Conducting background research on drug interactions" 
    },
    context: { 
      tenantId: "550e8400-e29b-41d4-a716-446655440001", 
      policySnapshotId: "policy-v1" 
    },
    ts: new Date().toISOString()
  };

  // Sample policy rules (fallback)
  const sampleRules = [
    {
      rule_id: "R1-PROHIBIT-OLD-MJ",
      name: "Prohibit Midjourney < 6.0.0",
      priority: 10,
      is_active: true,
      context_id: "global-media-tools",
      conditions: {
        operator: "AND",
        clauses: [
          { field: "tool.name", operator: "equals", value: "Midjourney" },
          { field: "tool.version", operator: "semver_less_than", value: "6.0.0" }
        ]
      },
      decision: {
        status: "Prohibited",
        reason: "Midjourney versions older than 6.0.0 are not compliant with current security standards.",
        audit_trigger: true
      }
    },
    {
      rule_id: "R2-REVIEW-UNKNOWN",
      name: "Review Unknown/Unversioned Tools",
      priority: 50,
      is_active: true,
      context_id: "global-media-tools",
      conditions: {
        operator: "OR",
        clauses: [
          { field: "tool.version", operator: "equals", value: "unknown" },
          { field: "tool.version", operator: "equals", value: "N/A" }
        ]
      },
      decision: {
        status: "RequiresReview",
        reason: "Tool version information is missing or unrecognized, requiring manual safety review.",
        audit_trigger: false
      }
    }
  ];

  // Test scenarios
  const testScenarios = [
    {
      name: "Old Midjourney → Should be Prohibited",
      event: {
        tool: { id: "mj-v5", name: "Midjourney", version: "5.2.0" },
        actor: { role: "designer" },
        action: { type: "FinalAssetGeneration" as const },
        context: { tenantId: "test-tenant", policySnapshotId: "v1" },
        ts: new Date().toISOString()
      },
      expectedStatus: "Prohibited" as const
    },
    {
      name: "Unknown Version → Should Require Review",
      event: {
        tool: { id: "dalle", name: "DALL-E", version: "unknown" },
        actor: { role: "marketer" },
        action: { type: "InternalConcept" as const },
        context: { tenantId: "test-tenant", policySnapshotId: "v1" },
        ts: new Date().toISOString()
      },
      expectedStatus: "RequiresReview" as const
    },
    {
      name: "New Midjourney → No Rule Match (Fallback)",
      event: {
        tool: { id: "mj-v6", name: "Midjourney", version: "6.1.0" },
        actor: { role: "designer" },
        action: { type: "FinalAssetGeneration" as const },
        context: { tenantId: "test-tenant", policySnapshotId: "v1" },
        ts: new Date().toISOString()
      },
      expectedStatus: "RequiresReview" as const
    }
  ];

  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const runTest = async (scenarioIndex?: number) => {
    if (loadingRules) {
      toast({
        title: "Rules not loaded",
        description: "Please wait for rules to load from database",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setVerdict(null);

    const scenario = scenarioIndex !== undefined ? testScenarios[scenarioIndex] : testScenarios[selectedScenario];

    try {
      const { data, error: invokeError } = await invokeWithAuth('policy-evaluate', {
        event: scenario.event,
        rules: rules
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to evaluate policy');
      }

      const verdictData = data as Verdict;
      setVerdict(verdictData);
      
      const isExpected = verdictData.status === scenario.expectedStatus;
      toast({
        title: isExpected ? "✅ Test Passed" : "⚠️ Unexpected Result",
        description: `Expected: ${scenario.expectedStatus}, Got: ${verdictData.status}`,
        variant: isExpected ? "default" : "destructive"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Evaluation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'Prohibited':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'RequiresReview':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Prohibited':
        return 'destructive';
      case 'RequiresReview':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <StandardPageLayout
      title="Policy Evaluate Test"
      subtitle="Test the policy-evaluate edge function with sample data"
    >
      <div className="container mx-auto py-8 space-y-6">
        {/* Policy Rules Card */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Rules</CardTitle>
            <CardDescription>
              Rules loaded from {rulesSource === 'database' ? 'database' : 'hardcoded fallback'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={rulesSource === 'database' ? 'default' : 'secondary'}>
                  {rulesSource === 'database' ? 'Database Rules' : 'Hardcoded Rules'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {rules.length} {rules.length === 1 ? 'rule' : 'rules'} loaded
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRulesFromDatabase}
                disabled={loadingRules}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingRules ? 'animate-spin' : ''}`} />
                Refresh Rules
              </Button>
            </div>

            {rules.map((rule, idx) => (
              <div key={idx} className="border rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">{rule.rule_id}</Badge>
                    <p className="text-sm font-medium">{rule.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Priority: {rule.priority}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Decision: <strong>{rule.decision.status}</strong> - {rule.decision.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Test Scenarios Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Scenarios
            </CardTitle>
            <CardDescription>
              Select a test scenario to validate policy evaluation logic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {testScenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    selectedScenario === idx ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedScenario(idx)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tool: {scenario.event.tool.name} v{scenario.event.tool.version}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Expected: {scenario.expectedStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => runTest(selectedScenario)} 
                disabled={loading || loadingRules}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Selected Test
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  for (let i = 0; i < testScenarios.length; i++) {
                    await runTest(i);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }}
                disabled={loading || loadingRules}
              >
                Run All Scenarios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {verdict && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(verdict.status)}
                Evaluation Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={getStatusVariant(verdict.status)}>
                  {verdict.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block mb-2">Reason:</span>
                <p className="text-sm bg-muted p-3 rounded-md">{verdict.reason}</p>
              </div>
              {verdict.rule_id && (
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Matched Rule:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{verdict.rule_id}</code>
                </div>
              )}
              {verdict.policySnapshotId && (
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Policy Snapshot:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{verdict.policySnapshotId}</code>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Card */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Sample Data Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sample Event */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode className="h-4 w-4" />
                Sample Tool Usage Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(sampleEvent, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Sample Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode className="h-4 w-4" />
                Sample Policy Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
                {JSON.stringify(sampleRules, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default TestPolicyEvaluate;
