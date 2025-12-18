import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ReviewAction } from '@/pages/agency/review/SubmissionReview';

interface RationaleModalProps {
  isOpen: boolean;
  action: ReviewAction['type'] | null;
  onSubmit: (rationale: string) => void;
  onClose: () => void;
}

export const RationaleModal: React.FC<RationaleModalProps> = ({
  isOpen,
  action,
  onSubmit,
  onClose
}) => {
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (rationale.trim().length < 15) {
      setError('Rationale must be at least 15 characters long');
      return;
    }
    
    onSubmit(rationale);
    setRationale('');
    setError('');
  };

  const handleClose = () => {
    setRationale('');
    setError('');
    onClose();
  };

  const isApproval = action === 'approve';
  const title = isApproval ? 'Approve Submission' : 'Request Changes';
  const description = isApproval 
    ? 'Please provide your rationale for approving this AI tool submission. This will be recorded in the audit trail.'
    : 'Please explain what changes are needed for this submission to be approved.';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproval ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rationale">
              Rationale <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rationale"
              placeholder={isApproval 
                ? "Explain why this tool meets compliance requirements..."
                : "Describe the specific changes needed..."
              }
              value={rationale}
              onChange={(e) => {
                setRationale(e.target.value);
                if (error) setError('');
              }}
              className="min-h-24"
            />
            <div className="text-xs text-muted-foreground">
              {rationale.length}/15 minimum characters
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This decision will be permanently recorded in the audit trail and cannot be undone.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant={isApproval ? "default" : "destructive"}
            disabled={rationale.trim().length < 15}
          >
            {isApproval ? 'Approve Submission' : 'Request Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};