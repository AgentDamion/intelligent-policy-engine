import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ApprovalPipeline } from '@/components/enterprise/ApprovalPipeline';
import { SlaBadge } from './SlaBadge';
import { EditorLockBadge } from './EditorLockBadge';
import { reviewApi } from '@/lib/review/api';
import { 
  Clock, 
  User, 
  Building, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Submission, ReviewAction } from '@/pages/agency/review/SubmissionReview';

interface SubmissionDetailDrawerProps {
  submission: Submission;
  onClose: () => void;
  onReviewAction: (action: ReviewAction['type'], submissionId: string) => void;
}

export const SubmissionDetailDrawer: React.FC<SubmissionDetailDrawerProps> = ({
  submission,
  onClose,
  onReviewAction
}) => {
  const [isRequestingLock, setIsRequestingLock] = useState(false);
  const { toast } = useToast();

  const isLocked = Boolean(submission.lockedBy);
  const isLockedByMe = submission.lockedBy === 'current-user'; // This would be determined by actual auth
  const canEdit = !isLocked || isLockedByMe;

  const handleLockAction = async () => {
    setIsRequestingLock(true);
    try {
      if (isLockedByMe) {
        await reviewApi.releaseLock(submission.id);
        toast({ title: "Lock released", description: "Other reviewers can now edit this submission" });
      } else if (isLocked) {
        await reviewApi.requestControl(submission.id);
        toast({ title: "Control requested", description: "The current editor has been notified" });
      } else {
        await reviewApi.takeLock(submission.id);
        toast({ title: "Lock acquired", description: "You can now edit this submission" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change lock status", variant: "destructive" });
    } finally {
      setIsRequestingLock(false);
    }
  };

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'under_review': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'changes_requested': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {submission.toolName}
            {submission.atRisk && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(submission.status)}>
                {submission.status.replace('_', ' ')}
              </Badge>
              <SlaBadge 
                submittedAt={submission.submittedAt}
                slaHours={submission.slaHours}
                atRisk={submission.atRisk}
              />
              {isLocked && (
                <EditorLockBadge 
                  lockedBy={submission.lockedBy!}
                  expiresAt={submission.lockExpiresAt}
                  isLockedByMe={isLockedByMe}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Client:</span>
                <span>{submission.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Submitted:</span>
                <span>{format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              {submission.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Assigned to:</span>
                  <span>{submission.assignedTo}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Priority:</span>
                <Badge variant="outline">{submission.priority}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-medium text-sm">Compliance Frameworks:</span>
              <div className="flex gap-2 flex-wrap">
                {submission.complianceFrameworks.map(framework => (
                  <Badge key={framework} variant="outline" className="text-xs">
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Lock Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">Editor Lock</h3>
              <p className="text-sm text-muted-foreground">
                {isLocked 
                  ? isLockedByMe 
                    ? "You are currently editing this submission"
                    : `Locked by ${submission.lockedBy}. Request control to edit.`
                  : "Take lock to prevent conflicts while editing"
                }
              </p>
            </div>
            <Button
              variant={isLockedByMe ? "outline" : "default"}
              onClick={handleLockAction}
              disabled={isRequestingLock}
              className="flex items-center gap-2"
            >
              {isLockedByMe ? (
                <>
                  <Unlock className="h-4 w-4" />
                  Release Lock
                </>
              ) : isLocked ? (
                <>
                  <Lock className="h-4 w-4" />
                  Request Control
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Take Lock
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Review Actions */}
          {canEdit && (submission.status === 'pending' || submission.status === 'under_review') && (
            <div className="space-y-4">
              <h3 className="font-medium">Review Actions</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onReviewAction('request_changes', submission.id)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Request Changes
                </Button>
                <Button
                  onClick={() => onReviewAction('approve', submission.id)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Approval Pipeline */}
          <div className="space-y-4">
            <h3 className="font-medium">Approval Pipeline</h3>
            <ApprovalPipeline submissionId={submission.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};