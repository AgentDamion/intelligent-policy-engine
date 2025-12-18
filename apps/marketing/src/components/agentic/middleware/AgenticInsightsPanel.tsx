import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePolicyInsights, PolicyInsight, Recommendation } from '@/hooks/usePolicyInsights';
import { 
  Brain, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  X,
  CheckCircle2,
  Play,
  Sparkles,
  TrendingUp,
  Shield,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgenticInsightsPanelProps {
  enterpriseId: string;
}

export const AgenticInsightsPanel = ({ enterpriseId }: AgenticInsightsPanelProps) => {
  const {
    insights,
    healthSummary,
    isLoading,
    isAnalyzing,
    runAnalysis,
    dismissInsight,
    resolveInsight,
    executeRecommendation
  } = usePolicyInsights(enterpriseId);

  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  if (isLoading) {
    return null;
  }

  // Don't show panel if no active insights
  if (!insights || insights.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive border-destructive/20 bg-destructive/5';
      case 'warning':
        return 'text-warning border-warning/20 bg-warning/5';
      case 'info':
        return 'text-muted-foreground border-border bg-muted/30';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'optimization':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'compliance':
        return <Shield className="h-3.5 w-3.5" />;
      case 'cleanup':
        return <Archive className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const toggleInsight = (id: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExecuteRecommendation = async (rec: Recommendation) => {
    const success = await executeRecommendation(rec);
    if (!success && !rec.auto_executable) {
      // Navigate to appropriate screen based on action type
      const actionRoutes: Record<string, string> = {
        review_policy: '/agentic?tab=workbench',
        adjust_policy: '/agentic?tab=workbench',
        add_rule: '/agentic?tab=workbench'
      };
      
      const route = actionRoutes[rec.action_type];
      if (route) {
        window.location.hash = route;
      }
    }
  };

  const criticalInsights = insights.filter(i => i.severity === 'critical');
  const warningInsights = insights.filter(i => i.severity === 'warning');
  const infoInsights = insights.filter(i => i.severity === 'info');

  return (
    <Card className="border-l-4 border-l-brand-purple shadow-sm">
      <Collapsible open={!isPanelCollapsed} onOpenChange={setIsPanelCollapsed}>
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-purple/10">
              <Brain className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Agentic Policy Insights
                {isAnalyzing && (
                  <Sparkles className="h-3.5 w-3.5 text-brand-purple animate-pulse" />
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {criticalInsights.length > 0 && (
                  <span className="text-destructive font-medium">
                    {criticalInsights.length} critical
                  </span>
                )}
                {criticalInsights.length > 0 && warningInsights.length > 0 && ' • '}
                {warningInsights.length > 0 && (
                  <span className="text-warning font-medium">
                    {warningInsights.length} warning{warningInsights.length !== 1 ? 's' : ''}
                  </span>
                )}
                {(criticalInsights.length > 0 || warningInsights.length > 0) && infoInsights.length > 0 && ' • '}
                {infoInsights.length > 0 && (
                  <span>
                    {infoInsights.length} suggestion{infoInsights.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAnalysis('all')}
              disabled={isAnalyzing}
              className="h-8"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isPanelCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <ScrollArea className="max-h-[400px]">
            <div className="px-4 pb-4 space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    getSeverityColor(insight.severity)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getSeverityIcon(insight.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm leading-tight">
                              {insight.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs h-5 px-2">
                              <span className="mr-1">{getTypeIcon(insight.insight_type)}</span>
                              {insight.insight_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleInsight(insight.id)}
                            className="h-7 w-7 p-0"
                          >
                            {expandedInsights.has(insight.id) ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissInsight(insight.id)}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {expandedInsights.has(insight.id) && (
                        <div className="mt-3 pt-3 border-t space-y-3">
                          {/* Data Evidence */}
                          <div className="bg-background/50 rounded p-2 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Metric:</span>
                              <span className="font-medium">{insight.data_evidence.metric}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Current:</span>
                              <span className="font-medium">{insight.data_evidence.current_value.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Threshold:</span>
                              <span className="font-medium">{insight.data_evidence.threshold.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Trend:</span>
                              <Badge variant="secondary" className="text-xs h-5">
                                {insight.data_evidence.trend}
                              </Badge>
                            </div>
                          </div>

                          {/* Recommendations */}
                          {insight.recommendations && insight.recommendations.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium">Recommended Actions:</p>
                              {insight.recommendations.map((rec, idx) => (
                                <div
                                  key={idx}
                                  className="bg-background/50 rounded p-2 space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium">{rec.title}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {rec.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <Badge variant="secondary" className="text-xs h-5">
                                          Impact: {rec.impact}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs h-5">
                                          Effort: {rec.effort}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={rec.auto_executable ? "default" : "outline"}
                                    className="w-full h-7 text-xs"
                                    onClick={() => handleExecuteRecommendation(rec)}
                                  >
                                    {rec.auto_executable ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                        Apply Fix
                                      </>
                                    ) : (
                                      <>
                                        Review Manually
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
