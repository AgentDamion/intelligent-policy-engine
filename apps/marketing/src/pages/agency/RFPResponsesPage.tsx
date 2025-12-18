import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { routes } from '@/lib/routes';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

const RFPResponsesPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspace } = useAgencyWorkspace();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const { data: responses, isLoading } = useQuery({
    queryKey: ['rfp-responses', workspace?.id, filter],
    queryFn: async () => {
      if (!workspace?.id) return [];

      let query = supabase
        .from('submissions')
        .select('*, policy_versions(policy_id, policies(title, enterprises(name)))')
        .eq('workspace_id', workspace.id)
        .eq('submission_type', 'rfp_response')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!workspace?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'submitted':
      case 'under_review':
        return <AlertCircle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      under_review: 'default',
      approved: 'default',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RFP Responses</h1>
          <p className="text-muted-foreground">
            Manage your Request for Proposal submissions
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4">
        {responses?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RFP Responses</h3>
              <p className="text-muted-foreground mb-4">
                You haven't started any RFP responses yet.
              </p>
              <Button onClick={() => navigate(routes.agency.policyRequests)}>
                Go to Policy Requests Inbox
              </Button>
            </CardContent>
          </Card>
        ) : (
          responses?.map((response: any) => (
            <Card key={response.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(response.status)}
                    <div>
                      <CardTitle className="text-lg">
                        {response.policy_versions?.policies?.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {response.policy_versions?.policies?.enterprises?.name}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(response.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {format(new Date(response.created_at), 'MMM dd, yyyy')}</p>
                    {response.submitted_at && (
                      <p>Submitted: {format(new Date(response.submitted_at), 'MMM dd, yyyy')}</p>
                    )}
                  </div>
                  {response.status === 'draft' ? (
                    <Button onClick={() => navigate(routes.agency.policyRequestResponse(response.id))}>
                      Continue Draft
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => navigate(routes.agency.policyRequestResponse(response.id))}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RFPResponsesPage;
