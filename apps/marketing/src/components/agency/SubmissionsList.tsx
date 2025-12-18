import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SubmissionData } from '@/hooks/useSupabaseSubmissions';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionsListProps {
  submissions: SubmissionData[];
  loading: boolean;
  onNewSubmission: () => void;
}

const statusConfig = {
  draft: { 
    label: 'Draft', 
    variant: 'secondary' as const,
    icon: <FileText className="h-3 w-3" />
  },
  submitted: { 
    label: 'Submitted', 
    variant: 'default' as const,
    icon: <Clock className="h-3 w-3" />
  },
  under_review: { 
    label: 'Under Review', 
    variant: 'default' as const,
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: 'Approved', 
    variant: 'default' as const,
    icon: <CheckCircle className="h-3 w-3" />
  },
  rejected: { 
    label: 'Rejected', 
    variant: 'destructive' as const,
    icon: <XCircle className="h-3 w-3" />
  },
  changes_requested: { 
    label: 'Changes Requested', 
    variant: 'outline' as const,
    icon: <AlertCircle className="h-3 w-3" />
  }
};

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  loading,
  onNewSubmission
}) => {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Recent Submissions</h2>
          <p className="text-sm text-muted-foreground">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onNewSubmission}>
          <FileText className="h-4 w-4 mr-2" />
          New Submission
        </Button>
      </div>

      <div className="grid gap-4">
        {submissions.map((submission) => {
          const config = statusConfig[submission.status];
          return (
            <Card key={submission.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base">{submission.title}</CardTitle>
                    {submission.description && (
                      <CardDescription className="text-sm">
                        {submission.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={config.variant} className="ml-4 flex items-center gap-1">
                    {config.icon}
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>
                      Created {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                    </span>
                    {submission.risk_score && (
                      <span className="flex items-center gap-1">
                        Risk: <Badge variant="outline" className="text-xs">{submission.risk_score}/100</Badge>
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {submissions.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first submission to track AI tool compliance requests.
            </p>
            <Button onClick={onNewSubmission}>
              Create First Submission
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};