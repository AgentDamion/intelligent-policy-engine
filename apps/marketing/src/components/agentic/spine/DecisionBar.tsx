import { useState } from 'react';
import { ACButton } from '@/components/agentic/ac/ACButton';
import { Checkbox } from '@/components/ui/checkbox';
import { emitSpineTelemetry } from '@/utils/spineTelemetry';

interface DecisionBarProps {
  threadId: string;
  policySnapshotId: string;
  onApprove: (reviewers: string[], conditions?: string[]) => void;
  onRequestChanges: (reviewers: string[], note: string) => void;
  onStartCanary: (reviewers: string[], canaryConfig?: { cohortPercent: number; durationDays: number }) => void;
  onEscalate: (reviewers: string[], to: string, reason: string) => void;
  onOpenConstellation?: () => void;
  isSubmitting: boolean;
}

export const DecisionBar = ({
  threadId,
  policySnapshotId,
  onApprove,
  onRequestChanges,
  onStartCanary,
  onEscalate,
  onOpenConstellation,
  isSubmitting
}: DecisionBarProps) => {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showConditionsInput, setShowConditionsInput] = useState(false);
  const [conditions, setConditions] = useState('');
  
  const canSubmit = selectedReviewers.length > 0 && hasReviewed && !isSubmitting;
  
  const reviewerOptions = [
    { id: 'compliance', label: 'Compliance Lead' },
    { id: 'brand', label: 'Brand Owner' },
    { id: 'legal', label: 'Legal' }
  ];
  
  return (
    <div className="border-t border-ink-100 bg-surface-0 p-s4 space-y-s3">
      <div className="flex items-center gap-s4">
        <label className="text-[12px] font-medium text-ink-700">Reviewers:</label>
        <div className="flex gap-s2">
          {reviewerOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-s1 px-s2 py-s1 border border-ink-200 rounded-r2 text-[12px] cursor-pointer hover:bg-surface-50"
            >
              <input
                type="checkbox"
                checked={selectedReviewers.includes(option.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedReviewers([...selectedReviewers, option.id]);
                  } else {
                    setSelectedReviewers(selectedReviewers.filter(r => r !== option.id));
                  }
                }}
                className="w-4 h-4"
                data-reviewer={option.id}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-s2">
        <Checkbox
          checked={hasReviewed}
          onCheckedChange={(checked) => setHasReviewed(checked === true)}
          id="reviewed"
        />
        <label htmlFor="reviewed" className="text-[12px] text-ink-700 cursor-pointer">
          I have reviewed the evidence
        </label>
      </div>
      
      {showConditionsInput && (
        <div className="space-y-s2 border border-ink-200 rounded-r2 p-s3 bg-surface-50">
          <label className="text-[12px] font-medium text-ink-700">
            Approval Conditions (optional)
          </label>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="e.g., Legal footer required for EU HCP"
            className="w-full h-20 px-s2 py-s2 text-[12px] border border-ink-200 rounded-r1 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ink-900"
            data-input="approval_conditions"
          />
          <div className="flex gap-s2">
            <ACButton
              onClick={() => {
                const conditionsArray = conditions.trim() 
                  ? conditions.split('\n').filter(c => c.trim())
                  : [];
                emitSpineTelemetry('ui_spine_cta_clicked', {
                  thread_id: threadId,
                  policy_snapshot_id: policySnapshotId,
                  decision_kind: 'approve'
                });
                onApprove(selectedReviewers, conditionsArray);
              }}
              variant="primary"
            >
              Submit Approval
            </ACButton>
            <ACButton
              onClick={() => {
                setShowConditionsInput(false);
                setConditions('');
              }}
              variant="ghost"
            >
              Cancel
            </ACButton>
          </div>
        </div>
      )}
      
      <div className="flex gap-s2 items-center" role="toolbar" aria-label="Decision actions">
        <ACButton
          onClick={() => {
            if (showConditionsInput) return;
            setShowConditionsInput(true);
          }}
          disabled={!canSubmit}
          variant="primary"
          data-decision-kind="approve"
        >
          Approve
        </ACButton>
        <ACButton
          onClick={() => {
            emitSpineTelemetry('ui_spine_cta_clicked', {
              thread_id: threadId,
              policy_snapshot_id: policySnapshotId,
              decision_kind: 'request_changes'
            });
            onRequestChanges(selectedReviewers, '');
          }}
          disabled={!canSubmit}
          variant="secondary"
          data-decision-kind="request_changes"
        >
          Request Changes
        </ACButton>
        <ACButton
          onClick={() => {
            emitSpineTelemetry('ui_spine_cta_clicked', {
              thread_id: threadId,
              policy_snapshot_id: policySnapshotId,
              decision_kind: 'start_canary'
            });
            onStartCanary(selectedReviewers);
          }}
          disabled={!canSubmit}
          variant="secondary"
          data-decision-kind="start_canary"
        >
          Start Canary
        </ACButton>
        <ACButton
          onClick={() => {
            emitSpineTelemetry('ui_spine_cta_clicked', {
              thread_id: threadId,
              policy_snapshot_id: policySnapshotId,
              decision_kind: 'escalate'
            });
            onEscalate(selectedReviewers, 'Legal', '');
          }}
          disabled={!canSubmit}
          variant="ghost"
          data-decision-kind="escalate"
        >
          Escalate
        </ACButton>
        
        {onOpenConstellation && (
          <button
            onClick={onOpenConstellation}
            className="text-sm text-ink-600 hover:text-ink-900 transition-colors ml-auto"
          >
            View Details →
          </button>
        )}
      </div>
    </div>
  );
};
