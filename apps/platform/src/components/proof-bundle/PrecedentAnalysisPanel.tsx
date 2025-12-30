import React from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { ExternalLink } from 'lucide-react';
import type { ProofBundle } from '@/services/vera/proofBundleService';

interface PrecedentAnalysisPanelProps {
  bundle: ProofBundle;
}

export const PrecedentAnalysisPanel: React.FC<PrecedentAnalysisPanelProps> = ({ bundle }) => {
  // TODO: Query similar decisions from API
  // For now, use mock data based on bundle
  const similarCount = 12; // Would come from API
  const approvalRate = 73; // Would come from API

  const tool = bundle.rationaleStructured?.inputs?.tool;
  const useCase = bundle.rationaleStructured?.inputs?.request_type;

  if (!tool || !useCase) {
    return null;
  }

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="section-label">Precedent Analysis</div>
      </EdgeCardHeader>
      <EdgeCardBody className="space-y-3">
        <div className="text-sm text-neutral-900">
          {similarCount} similar decisions
        </div>
        
        {/* Approval Rate Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-600">{approvalRate}% of similar requests were approved</span>
            <span className="font-semibold">{approvalRate}%</span>
          </div>
          <div className="h-2 bg-neutral-200">
            <div
              className="h-full bg-status-approved"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
        </div>

        <a
          href={`/decisions?tool=${encodeURIComponent(tool)}&useCase=${encodeURIComponent(useCase)}`}
          className="text-xs text-aicomplyr-black hover:underline flex items-center gap-1"
        >
          View all <ExternalLink className="w-3 h-3" />
        </a>
      </EdgeCardBody>
    </EdgeCard>
  );
};

