import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SlaBadge } from './SlaBadge';
import { EditorLockBadge } from './EditorLockBadge';
import { Clock, User, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Submission, ReviewAction } from '@/pages/agency/review/SubmissionReview';

interface SubmissionRowProps {
  submission: Submission;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onView: () => void;
  onReviewAction: (action: ReviewAction['type'], submissionId: string) => void;
}

export const SubmissionRow: React.FC<SubmissionRowProps> = ({
  submission,
  isSelected,
  onSelect,
  onView,
  onReviewAction
}) => {
  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'under_review': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'changes_requested': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: Submission['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const isLocked = Boolean(submission.lockedBy);
  const isLockedByMe = submission.lockedBy === 'current-user'; // This would be determined by actual auth

  return (
    <Card className={`p-4 transition-all hover:shadow-md ${submission.atRisk ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="flex items-center gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{submission.toolName}</h4>
                {submission.atRisk && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {isLocked && (
                  <EditorLockBadge 
                    lockedBy={submission.lockedBy!}
                    expiresAt={submission.lockExpiresAt}
                    isLockedByMe={isLockedByMe}
                  />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{submission.clientName}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</span>
                {submission.assignedTo && (
                  <>
                    <span>•</span>
                    <User className="h-3 w-3" />
                    <span>Assigned to {submission.assignedTo}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(submission.priority)}>
                  {submission.priority}
                </Badge>
                <SlaBadge 
                  submittedAt={submission.submittedAt}
                  slaHours={submission.slaHours}
                  atRisk={submission.atRisk}
                />
                {submission.complianceFrameworks.map(framework => (
                  <Badge key={framework} variant="outline" className="text-xs">
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              
              {submission.status === 'pending' || submission.status === 'under_review' ? (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReviewAction('request_changes', submission.id)}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Request Changes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onReviewAction('approve', submission.id)}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReviewAction('approve', submission.id)}
                  className="flex items-center gap-1"
                >
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};