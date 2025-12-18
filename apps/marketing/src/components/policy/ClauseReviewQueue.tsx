import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Code, Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviewItem {
  id: number;
  policy_id: string;
  clause_id: string;
  lane_suggested: string;
  lane_confidence: number;
  reason: string;
  clause_text?: string;
  resolved: boolean;
}

interface ClauseReviewQueueProps {
  enterpriseId: string;
}

const LANE_INFO = {
  governance_compliance: {
    icon: Shield,
    label: 'Governance & Compliance',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'HITL, MLR, audit, retention, legal review'
  },
  security_access: {
    icon: Shield,
    label: 'Security & Access',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'API keys, MFA, SSO, PHI/PII, encryption'
  },
  integration_scalability: {
    icon: Code,
    label: 'Integration & Scalability',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'UAT, connectors, version pinning, rate limits'
  },
  business_ops: {
    icon: Users,
    label: 'Business & Operations',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'KPIs, training, budget, RACI, processes'
  }
};

export const ClauseReviewQueue: React.FC<ClauseReviewQueueProps> = ({ enterpriseId }) => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReviewQueue();
  }, [enterpriseId]);

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clause_review_queue')
        .select(`
          *,
          clause:policy_clauses!clause_id(clause_text)
        `)
        .eq('enterprise_id', enterpriseId)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems((data || []).map((item: any) => ({
        ...item,
        clause_text: item.clause?.clause_text
      })));
    } catch (error) {
      console.error('Error loading review queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to load review queue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (itemId: number, resolvedLane: string) => {
    try {
      // Update review queue item
      const { error: queueError } = await supabase
        .from('clause_review_queue')
        .update({
          resolved: true,
          resolved_lane: resolvedLane,
          resolved_at: new Date().toISOString(),
          reviewer_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', itemId);

      if (queueError) throw queueError;

      // Update the clause itself
      const item = items.find(i => i.id === itemId);
      if (item) {
        const { error: clauseError } = await supabase
          .from('policy_clauses')
          .update({
            lane: resolvedLane,
            lane_confidence: 1.0 // HITL review gives 100% confidence
          })
          .eq('id', item.clause_id);

        if (clauseError) throw clauseError;
      }

      toast({
        title: 'Review Complete',
        description: 'Clause lane has been updated'
      });

      loadReviewQueue();
    } catch (error) {
      console.error('Error resolving review:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve review',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('clause_review_queue')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Review Rejected',
        description: 'Clause will be flagged for rewrite'
      });

      loadReviewQueue();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject review',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading review queue...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
          <div className="font-medium">All Clear!</div>
          <div className="text-sm text-muted-foreground">No clauses need review</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clause Review Queue</CardTitle>
              <CardDescription>
                Review and assign lanes to clauses with low confidence scores
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {items.length} Pending
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {items.map((item) => {
        const LaneIcon = LANE_INFO[item.lane_suggested as keyof typeof LANE_INFO]?.icon || AlertTriangle;
        const laneInfo = LANE_INFO[item.lane_suggested as keyof typeof LANE_INFO];

        return (
          <Card key={item.id}>
            <CardContent className="pt-6 space-y-4">
              {/* Confidence Badge */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Confidence: {(item.lane_confidence * 100).toFixed(0)}%
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Policy: {item.policy_id}
                </div>
              </div>

              {/* Clause Text */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Clause Text</div>
                <div className="text-sm">{item.clause_text || 'Loading...'}</div>
              </div>

              {/* Suggested Lane */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <LaneIcon className={`h-5 w-5 ${laneInfo?.color || ''} mt-0.5`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">Suggested Lane</div>
                  <div className="text-sm">{laneInfo?.label || item.lane_suggested}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {laneInfo?.description || 'No description'}
                  </div>
                </div>
              </div>

              {/* Lane Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Lane</label>
                <Select onValueChange={(value) => handleResolve(item.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct lane..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANE_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <info.icon className={`h-4 w-4 ${info.color}`} />
                          {info.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(item.id, item.lane_suggested)}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Suggestion
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(item.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject & Flag
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
