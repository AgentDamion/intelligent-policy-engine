import React, { useState } from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProofBundle } from '@/services/vera/proofBundleService';

interface ConditionListProps {
  bundle: ProofBundle;
}

interface Condition {
  text: string;
  source: string;
  verification: 'Manual attestation' | 'Automated scanning' | 'Submission tracking';
  status: 'verified' | 'pending' | 'required';
}

export const ConditionList: React.FC<ConditionListProps> = ({ bundle }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract conditions from bundle
  const conditions: Condition[] = [];
  
  if (bundle.rationaleHuman?.includes('Human review required')) {
    conditions.push({
      text: 'Human review required for all generated assets before client submission',
      source: 'Rule 4.2',
      verification: 'Manual attestation',
      status: 'required',
    });
  }

  if (bundle.rationaleStructured?.inputs?.dataset_class === 'patient_data') {
    conditions.push({
      text: 'No patient-identifiable information in prompts',
      source: 'Rule 2.1',
      verification: 'Automated scanning',
      status: 'verified',
    });
  }

  if (bundle.decision === 'approved' && bundle.rationaleHuman?.includes('MLR')) {
    conditions.push({
      text: 'Final assets require separate MLR submission',
      source: 'Approver condition',
      verification: 'Submission tracking',
      status: 'pending',
    });
  }

  if (conditions.length === 0) {
    return null;
  }

  const statusIcon = {
    verified: <CheckCircle className="w-4 h-4 text-status-approved" />,
    pending: <Clock className="w-4 h-4 text-status-escalated" />,
    required: <AlertTriangle className="w-4 h-4 text-status-denied" />,
  };

  const statusColor = {
    verified: 'text-status-approved',
    pending: 'text-status-escalated',
    required: 'text-status-denied',
  };

  return (
    <EdgeCard>
      <EdgeCardHeader
        className="cursor-pointer hover:bg-neutral-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="section-label">Conditions & Requirements</div>
            <div className="text-sm font-semibold text-neutral-900">{conditions.length} conditions attached</div>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </EdgeCardHeader>
      {isOpen && (
        <EdgeCardBody className="space-y-3 bg-neutral-50">
          {conditions.map((condition, idx) => (
            <div key={idx} className="flex items-start justify-between py-2 border-b border-neutral-200 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon[condition.status]}
                  <span className="text-sm font-semibold text-neutral-900">{idx + 1}. {condition.text}</span>
                </div>
                <div className="text-xs text-neutral-500 ml-6">
                  Source: {condition.source} • Verification: {condition.verification}
                </div>
              </div>
              <span className={cn('text-xs font-semibold uppercase', statusColor[condition.status])}>
                {condition.status}
              </span>
            </div>
          ))}
        </EdgeCardBody>
      )}
    </EdgeCard>
  );
};

