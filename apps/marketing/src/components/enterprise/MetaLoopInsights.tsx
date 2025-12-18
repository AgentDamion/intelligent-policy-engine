import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MetaLoopRecommendation {
  title: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  suggested_action: string;
}

interface MetaLoopInsight {
  id: number;
  created_at: string;
  details: {
    policy_version_id: string;
    total_responses: number;
    average_score: number;
    recurring_gaps: Array<{
      compliance_area: string;
      frequency: number;
      percentage: number;
    }>;
    recommendations: MetaLoopRecommendation[];
  };
}

export function MetaLoopInsights() {
  const [insights, setInsights] = useState<MetaLoopInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agent_decisions')
        .select('*')
        .eq('agent', 'Meta-Loop Analyzer')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setInsights((data || []) as any);
    } catch (error) {
      console.error('Failed to load Meta-Loop insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
      case 'low': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold">Loading Meta-Loop Insights...</h3>
        </div>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="p-6 border-dashed">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">No Insights Yet</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Meta-Loop insights will appear here after partners submit RFP responses.
        </p>
      </Card>
    );
  }

  const latestInsight = insights[0];
  const { details } = latestInsight;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Meta-Loop Policy Insights</h3>
            <p className="text-sm text-muted-foreground">
              AI-generated recommendations from {details.total_responses} partner responses
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-background">
          Avg Score: {details.average_score.toFixed(0)}%
        </Badge>
      </div>

      {/* Recurring Gaps */}
      {details.recurring_gaps && details.recurring_gaps.length > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-background/50 border border-border/50">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-brand-orange" />
            Recurring Compliance Gaps
          </h4>
          <div className="space-y-2">
            {details.recurring_gaps.slice(0, 3).map((gap, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{gap.compliance_area}</span>
                <Badge variant="secondary" className="text-xs">
                  {gap.percentage.toFixed(0)}% struggled
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-green" />
          Policy Refinement Recommendations
        </h4>
        {details.recommendations?.slice(0, 3).map((rec, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-1">
                <Badge className={getPriorityColor(rec.priority)}>
                  {getPriorityIcon(rec.priority)}
                  {rec.priority}
                </Badge>
                <h5 className="text-sm font-medium">{rec.title}</h5>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{rec.rationale}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-foreground/80">{rec.suggested_action}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  toast({
                    title: "Policy Editor",
                    description: "This will open the policy editor with suggested changes (coming soon)",
                  });
                }}
              >
                Apply
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => {
            toast({
              title: "View All Insights",
              description: "Full Meta-Loop analysis dashboard coming soon",
            });
          }}
        >
          View All Insights ({insights.length})
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
