import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimulation } from "@/hooks/useSimulation";
import { useAgentThreads } from '@/hooks/useAgentThreads';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { monitoring } from '@/utils/monitoring';
import { Loader2, DollarSign, AlertTriangle, TrendingDown } from "lucide-react";
import type { SimulationResult } from "@/types/simulation";

interface WeaveViewProps {
  workspaceId: string;
  enterpriseId: string;
}

export function WeaveView({ workspaceId, enterpriseId }: WeaveViewProps) {
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get('t') || 't1';
  const { runCostOptimization, runHistoricalReplay, analyzeDeprecation, loading, result } = useSimulation(enterpriseId);
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
  
  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: threads = [] } = useAgentThreads();
  const { realtimeMessages, isTyping } = useAgentMessagesRealtime(threadId);

  const handleCostOptimization = async () => {
    setSelectedSimulation('cost_optimization');
    await runCostOptimization(1000);
  };

  const handleHistoricalReplay = async () => {
    setSelectedSimulation('historical_replay');
    // For demo, using a placeholder policy ID
    await runHistoricalReplay('placeholder-policy-id', 168);
  };

  const handleDeprecationAnalysis = async () => {
    setSelectedSimulation('deprecation_impact');
    // For demo, analyzing gpt-4 model
    await analyzeDeprecation('gpt-4');
  };

  const handleAgentQuery = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const query = inputValue;
    setInputValue('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user?.id || '')
        .limit(1)
        .single();

      const { error: functionError } = await supabase.functions.invoke(
        'cursor-agent-adapter',
        {
          body: {
            query,
            context: {
              threadId,
              workspaceId: workspaceMember?.workspace_id,
              mode: 'weave-chat'
            }
          }
        }
      );

      if (functionError) throw functionError;

      monitoring.info('Agent query sent from weave', {
        threadId,
        queryLength: query.length
      });
    } catch (err) {
      console.error('Failed to send query:', err);
      toast.error('Failed to send message to agents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgentQuery();
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Chat */}
      <div className="w-[240px] flex-shrink-0 border-r border-ink-100 bg-surface-0 flex flex-col">
        <div className="flex-1" />
        
        {/* Chat Input - fixed at bottom */}
        <div className="border-t border-ink-100 p-s3 bg-surface-50">
          <div className="mb-s2">
            <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide">
              Agent Chat
            </div>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask agents..."
            disabled={isSubmitting}
            className="w-full px-s3 py-s2 text-[14px] rounded-r1 border border-ink-200 bg-surface-0 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Policy Simulation & Optimization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Test policies against historical traffic and discover cost optimization opportunities
        </p>
      </div>

      {/* Simulation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Cost Optimization</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Detect expensive models serving low-risk queries
          </p>
          <Button
            onClick={handleCostOptimization}
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading && selectedSimulation === 'cost_optimization' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Analysis'
            )}
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Historical Replay</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Test draft policies against actual traffic
          </p>
          <Button
            onClick={handleHistoricalReplay}
            disabled={loading}
            className="w-full"
            size="sm"
            variant="secondary"
          >
            {loading && selectedSimulation === 'historical_replay' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              'Run Simulation'
            )}
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Deprecation Impact</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyze impact of removing models or assets
          </p>
          <Button
            onClick={handleDeprecationAnalysis}
            disabled={loading}
            className="w-full"
            size="sm"
            variant="outline"
          >
            {loading && selectedSimulation === 'deprecation_impact' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Impact'
            )}
          </Button>
        </Card>
      </div>

      {/* Results Display */}
      {result && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Simulation Results</h2>
              <p className="text-xs text-muted-foreground">
                Simulation ID: {result.simulation_id}
              </p>
            </div>
            <Badge variant="outline">{result.simulation_type}</Badge>
          </div>

          {/* Impact Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Requests Analyzed</p>
              <p className="text-2xl font-bold">{result.impact_summary.requests_analyzed.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Decision Flips</p>
              <p className="text-2xl font-bold">{result.impact_summary.decision_flips}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cost Impact</p>
              <p className="text-2xl font-bold text-green-600">
                ${Math.round(result.impact_summary.cost_impact_usd).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Flip Rate</p>
              <p className="text-2xl font-bold">
                {(result.impact_summary.decision_flip_rate * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Optimization Opportunities</h3>
              <div className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <Card key={idx} className="p-4 space-y-2 bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className="mb-2">{rec.type}</Badge>
                        <p className="text-sm font-medium">{rec.justification}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ${Math.round(rec.estimated_savings_usd_annual).toLocaleString()}/yr
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${Math.round(rec.estimated_savings_usd_monthly).toLocaleString()}/mo
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Current: {rec.current_state.model}</p>
                        <p className="text-muted-foreground">
                          {rec.current_state.request_volume_monthly.toLocaleString()} req/mo
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Suggested: {rec.suggested_state.model}</p>
                        <p className="text-muted-foreground">
                          +{(rec.suggested_state.risk_increase * 100).toFixed(1)}% risk
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-orange-600">Policy Conflicts</h3>
              <div className="space-y-2">
                {result.conflicts.map((conflict, idx) => (
                  <Card key={idx} className="p-4 border-orange-200 bg-orange-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="destructive">{conflict.severity}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {conflict.affected_requests} requests affected
                      </p>
                    </div>
                    <p className="text-sm font-medium">{conflict.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {conflict.conflict_type}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Deprecation Impact */}
          {result.deprecation_impact && (
            <div className="space-y-3">
              <h3 className="font-semibold">Deprecation Impact Analysis</h3>
              <Card className="p-4 space-y-3 bg-muted/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="font-semibold">{result.deprecation_impact.model_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Affected Partners</p>
                    <p className="font-semibold">{result.deprecation_impact.affected_partners}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Requests</p>
                    <p className="font-semibold">{result.deprecation_impact.total_requests.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="font-semibold">${result.deprecation_impact.total_cost_usd.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <Badge
                    variant={
                      result.deprecation_impact.recommendation.includes('HIGH')
                        ? 'destructive'
                        : result.deprecation_impact.recommendation.includes('MEDIUM')
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {result.deprecation_impact.recommendation}
                  </Badge>
                </div>
              </Card>
            </div>
          )}
        </Card>
      )}

        {/* Empty State */}
        {!result && !loading && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingDown className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No Simulation Results Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Run a simulation above to analyze your policies and discover optimization opportunities
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
