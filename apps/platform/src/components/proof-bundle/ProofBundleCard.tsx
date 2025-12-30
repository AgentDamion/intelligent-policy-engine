import React from 'react';
import { EdgeCard, EdgeCardBody, EdgeCardFooter, EdgeCardHeader } from '@/components/ui/edge-card';
import { StatusBanner } from '@/components/ui/status-badge';

interface ProofBundleCardProps {
  boundary: string;
  tool: string;
  useCase: string;
  riskLevel: 'low' | 'medium' | 'high';
  policyId: string;
  conditions?: string;
  approver?: string;
  authority?: string;
  timestamp?: string;
  decisionId?: string;
}

const riskBadge = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const ProofBundleCard: React.FC<ProofBundleCardProps> = ({
  boundary,
  tool,
  useCase,
  riskLevel,
  policyId,
  conditions = 'None',
  approver,
  authority,
  timestamp,
  decisionId,
}) => {
  return (
    <EdgeCard className="max-w-xl border border-neutral-200">
      <EdgeCardHeader className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-neutral-500">
            Decision Record
          </span>
          <span className="text-xs font-display tracking-[0.5px] text-neutral-900">
            AICOMPLYR
          </span>
        </div>
      </EdgeCardHeader>

      <StatusBanner variant="approved">Approved</StatusBanner>

      <EdgeCardBody className="space-y-4">
        <div>
          <div className="section-label">Boundary</div>
          <div className="text-sm text-neutral-900">{boundary}</div>
        </div>

        <div>
          <div className="section-label">Request</div>
          <div className="flex flex-col gap-2 text-sm text-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Tool</span>
              <span className="font-semibold">{tool}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Use Case</span>
              <span className="font-semibold">{useCase}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Risk Level</span>
              <span className="px-2 py-1 text-xs font-bold uppercase tracking-wide border border-neutral-800">
                {riskBadge[riskLevel]}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="section-label">Governance</div>
          <div className="flex items-center justify-between text-sm text-neutral-800">
            <span className="text-neutral-600">Policy</span>
            <span className="font-semibold">{policyId}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-800 mt-1">
            <span className="text-neutral-600">Conditions</span>
            <span className="font-semibold">{conditions}</span>
          </div>
        </div>

        <div>
          <div className="section-label">Accountability</div>
          <div className="flex items-center justify-between text-sm text-neutral-800">
            <span className="text-neutral-600">Approver</span>
            <span className="font-semibold">{approver || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-800 mt-1">
            <span className="text-neutral-600">Authority</span>
            <span className="font-semibold">{authority || '—'}</span>
          </div>
        </div>
      </EdgeCardBody>

      <EdgeCardFooter className="flex items-center justify-between">
        <span className="mono-id">
          {timestamp || '—'}
          <br />
          {decisionId || '—'}
        </span>
        <span className="text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-aicomplyr-yellow" />
          Boundary Governed.
        </span>
      </EdgeCardFooter>
    </EdgeCard>
  );
};

export default ProofBundleCard;

