import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FileText, Building2, Clock, CheckCircle2, Shield, Code, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { routes } from '@/lib/routes';
import type { LaneStatistics } from '@/types/rfp';

interface PolicyRequestDistribution {
  id: string;
  policy_version_id: string;
  response_deadline: string;
  status: string;
  distributed_at: string;
  submission_status: string;
  submission_id?: string;
  compliance_score?: number;
  submitted_at?: string;
  lane_statistics?: LaneStatistics;
  policy_versions: {
    id: string;
    version_number: number;
    rfp_template_data: any;
    policies: {
      id: string;
      title: string;
      description: string;
      category: string;
      enterprises: {
        id: string;
        name: string;
      };
    };
  };
}

interface PolicyRequestsInboxProps {
  workspaceId: string;
}

const getLaneBadge = (laneCount: { governance?: number; security?: number; integration?: number; business?: number }) => {
  const badges = [];
  
  if (laneCount.governance) {
    badges.push(
      <Badge key="gov" variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        🤖 {laneCount.governance} Policy-Backed
      </Badge>
    );
  }
  if (laneCount.security) {
    badges.push(
      <Badge key="sec" variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        🤖 {laneCount.security} Security
      </Badge>
    );
  }
  if (laneCount.integration) {
    badges.push(
      <Badge key="int" variant="outline" className="gap-1">
        <Code className="h-3 w-3" />
        {laneCount.integration} Integration
      </Badge>
    );
  }
  if (laneCount.business) {
    badges.push(
      <Badge key="bus" variant="outline" className="gap-1 border-orange-500 text-orange-700 dark:text-orange-400">
        <Users className="h-3 w-3" />
        🚨 {laneCount.business} Human-Led
      </Badge>
    );
  }
  
  return badges;
};

export const PolicyRequestsInbox: React.FC<PolicyRequestsInboxProps> = ({ workspaceId }) => {
  const [distributions, setDistributions] = useState<PolicyRequestDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDistributions();
  }, [workspaceId]);

  const loadDistributions = async () => {
    try {
      setLoading(true);
      // Prefer SQL RPC to avoid Edge Function connectivity issues
      const { data, error } = await supabase.rpc('rpc_get_rfp_distributions', {
        p_workspace_id: workspaceId,
      });

      if (error) throw error as any;

      // Map RPC rows to the UI's expected shape
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        policy_version_id: row.policy_version_id,
        response_deadline: row.response_deadline,
        status: row.response_status,
        distributed_at: row.created_at,
        submission_status: row.response_status,
        submission_id: row.submission_id, // may be null from RPC
        compliance_score: row.overall_score, // may be null; safe
        submitted_at: row.submitted_at, // may be null; safe
        lane_statistics: undefined,
        policy_versions: {
          id: row.policy_version_id,
          version_number: row.policy_version,
          rfp_template_data: { questions: Array(row.questions_count || 0).fill({}) },
          policies: {
            id: row.policy_id || row.policy_version_id,
            title: row.policy_name,
            description: row.policy_description || '',
            category: row.policy_category || '',
            enterprises: { id: row.enterprise_id || '', name: row.enterprise_name || '' },
          },
        },
      }));

      setDistributions(mapped);
    } catch (error) {
      console.error('Error loading policy requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load policy requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (dist: PolicyRequestDistribution) => {
    if (dist.submission_status === 'submitted' || dist.submission_status === 'approved') {
      return <Badge className="bg-success/20 text-success">Submitted</Badge>;
    }
    if (dist.submission_status === 'draft') {
      return <Badge className="bg-warning/20 text-warning">In Progress</Badge>;
    }
    
    const deadline = new Date(dist.response_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return <Badge className="bg-destructive/20 text-destructive">Overdue</Badge>;
    }
    if (daysLeft <= 7) {
      return <Badge className="bg-warning/20 text-warning">Urgent ({daysLeft}d left)</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
  };

  const handleStartResponse = (dist: PolicyRequestDistribution) => {
    if (dist.submission_id) {
      navigate(routes.agency.policyRequestResponse(dist.submission_id));
    } else {
      navigate(`${routes.agency.policyRequestResponseNew}?policy_version_id=${dist.policy_version_id}`);
    }
  };

  const filteredDistributions = distributions.filter(dist => {
    if (filter === 'pending') {
      return dist.submission_status === 'not_started' || dist.submission_status === 'draft';
    }
    if (filter === 'completed') {
      return dist.submission_status === 'submitted' || dist.submission_status === 'approved';
    }
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading policy requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Policy Requests</h2>
          <p className="text-muted-foreground">Respond to policy compliance requests from clients</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({distributions.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending ({distributions.filter(d => d.submission_status === 'not_started' || d.submission_status === 'draft').length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed ({distributions.filter(d => d.submission_status === 'submitted' || d.submission_status === 'approved').length})
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDistributions.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {filter === 'all' ? 'No policy requests received yet' : `No ${filter} policy requests`}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDistributions.map(dist => {
            const laneCount = {
              governance: dist.lane_statistics?.governance_compliance || 0,
              security: dist.lane_statistics?.security_access || 0,
              integration: dist.lane_statistics?.integration_scalability || 0,
              business: dist.lane_statistics?.business_ops || 0
            };
            
            return (
              <Card key={dist.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle>{dist.policy_versions.policies.title}</CardTitle>
                        {getStatusBadge(dist)}
                      </div>
                      <CardDescription>{dist.policy_versions.policies.description}</CardDescription>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {getLaneBadge(laneCount)}
                      </div>
                    </div>
                    {dist.compliance_score && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{dist.compliance_score}%</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">From</div>
                        <div className="font-medium">{dist.policy_versions.policies.enterprises.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Received</div>
                        <div className="font-medium">{format(new Date(dist.distributed_at), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Deadline</div>
                        <div className="font-medium">{format(new Date(dist.response_deadline), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                    {dist.submitted_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <div>
                          <div className="text-muted-foreground">Submitted</div>
                          <div className="font-medium">{format(new Date(dist.submitted_at), 'MMM d, yyyy')}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>
                        {dist.lane_statistics 
                          ? `${Object.values(dist.lane_statistics).reduce((a, b) => a + b, 0)} questions across 4 lanes`
                          : `${dist.policy_versions.rfp_template_data?.questions?.length || 0} questions total`}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleStartResponse(dist)}
                      variant={dist.submission_status === 'submitted' ? 'outline' : 'default'}
                    >
                      {dist.submission_status === 'submitted' ? 'View Response' : 
                       dist.submission_status === 'draft' ? 'Continue Response' : 
                       'Start Response'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
