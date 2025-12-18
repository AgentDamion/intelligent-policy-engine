import React, { useState, useEffect } from 'react';
import { SubmissionQueues } from '@/components/review/SubmissionQueues';
import { SubmissionDetailDrawer } from '@/components/review/SubmissionDetailDrawer';
import { RationaleModal } from '@/components/review/RationaleModal';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { useToast } from '@/hooks/use-toast';
import { reviewApi } from '@/lib/review/api';

export interface Submission {
  id: string;
  clientId: string;
  clientName: string;
  toolName: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'under_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  assignedTo?: string;
  lockedBy?: string;
  lockExpiresAt?: string;
  slaHours: number;
  complianceFrameworks: string[];
  atRisk?: boolean;
}

export interface ReviewAction {
  type: 'approve' | 'request_changes';
  submissionId: string;
  rationale: string;
}

const SubmissionReview: React.FC = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rationaleModal, setRationaleModal] = useState<{
    isOpen: boolean;
    action: ReviewAction['type'] | null;
    submissionId: string | null;
  }>({
    isOpen: false,
    action: null,
    submissionId: null
  });
  const { toast } = useToast();

  const handleSubmissionSelect = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleReviewAction = (action: ReviewAction['type'], submissionId: string) => {
    setRationaleModal({
      isOpen: true,
      action,
      submissionId
    });
  };

  const handleRationaleSubmit = async (rationale: string) => {
    if (!rationaleModal.action || !rationaleModal.submissionId) return;

    try {
      if (rationaleModal.action === 'approve') {
        await reviewApi.approve(rationaleModal.submissionId, rationale, {
          agencyId: 'current-agency',
          userId: 'current-user'
        });
        toast({ title: "Submission approved", description: "Decision recorded successfully" });
      } else {
        await reviewApi.requestChanges(rationaleModal.submissionId, rationale, {
          agencyId: 'current-agency', 
          userId: 'current-user'
        });
        toast({ title: "Changes requested", description: "Feedback sent to client" });
      }
      
      setRationaleModal({ isOpen: false, action: null, submissionId: null });
      setSelectedSubmission(null);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to record decision", 
        variant: "destructive" 
      });
    }
  };

  return (
    <StandardPageLayout
      title="Submission Review"
      description="Review client AI tool submissions with SLA tracking and approval workflows"
    >
      <div className="flex h-full gap-6">
        <div className="flex-1">
          <SubmissionQueues 
            onSubmissionSelect={handleSubmissionSelect}
            onReviewAction={handleReviewAction}
          />
        </div>
        
        {selectedSubmission && (
          <SubmissionDetailDrawer
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
            onReviewAction={handleReviewAction}
          />
        )}
      </div>

      <RationaleModal
        isOpen={rationaleModal.isOpen}
        action={rationaleModal.action}
        onSubmit={handleRationaleSubmit}
        onClose={() => setRationaleModal({ isOpen: false, action: null, submissionId: null })}
      />
    </StandardPageLayout>
  );
};

export default SubmissionReview;