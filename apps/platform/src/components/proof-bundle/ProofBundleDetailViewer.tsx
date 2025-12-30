import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody, EdgeCardFooter } from '@/components/ui/edge-card';
import { StatusBanner, StatusBadge } from '@/components/ui/status-badge';
import { AICOMPLYRButton as Button } from '@/components/ui/aicomplyr-button';
import { getProofBundle, type ProofBundle, type DecisionType } from '@/services/vera/proofBundleService';
import { proofBundleVerifier, type VerificationResult } from '@/services/vera/proofBundleVerifier';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { TriggeredRuleCard } from './TriggeredRuleCard';
import { ConditionList } from './ConditionList';
import { CryptographicVerificationPanel } from './CryptographicVerificationPanel';
import { PrecedentAnalysisPanel } from './PrecedentAnalysisPanel';
import { AgentReasoningTrace } from './AgentReasoningTrace';
import { VerificationModal } from './VerificationModal';

interface ProofBundleDetailViewerProps {
  proofBundleId: string;
  onClose?: () => void;
  className?: string;
}

// Map DecisionType to StatusVariant
const decisionToStatus = (decision: DecisionType | null): 'approved' | 'conditional' | 'denied' | 'escalated' | 'pending' => {
  if (!decision) return 'pending';
  switch (decision) {
    case 'approved':
    case 'auto_cleared':
      return 'approved';
    case 'rejected':
      return 'denied';
    case 'escalated':
      return 'escalated';
    case 'needs_review':
      return 'conditional';
    default:
      return 'pending';
  }
};

// Format decision ID
const formatDecisionId = (id: string): string => {
  // If already formatted, return as-is
  if (id.startsWith('DEC-')) return id;
  // Otherwise, try to format from UUID or other format
  const date = new Date();
  const year = date.getFullYear();
  const shortId = id.substring(0, 8).toUpperCase();
  return `DEC-${year}-${shortId}-EC-AP`;
};

// Format timestamp
const formatTimestamp = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

// Get confidence color
const getConfidenceColor = (score?: number): string => {
  if (!score) return 'bg-neutral-400';
  const percentage = score * 100;
  if (percentage > 90) return 'bg-status-approved';
  if (percentage >= 70) return 'bg-status-escalated';
  return 'bg-status-denied';
};

// Get boundary context from bundle and enterprise context
const getBoundaryContext = (bundle: ProofBundle, enterpriseName?: string): { enterprise: string; partner: string } => {
  // TODO: Fetch partner name from submission/relationship data
  // For now, use enterprise from context and placeholder partner
  return {
    enterprise: enterpriseName || 'Enterprise',
    partner: 'Partner Agency', // Would come from partner_enterprise_relationships or submission data
  };
};

export const ProofBundleDetailViewer: React.FC<ProofBundleDetailViewerProps> = ({
  proofBundleId,
  onClose,
  className,
}) => {
  const navigate = useNavigate();
  const { currentEnterprise } = useEnterprise();
  const [bundle, setBundle] = useState<ProofBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProofBundle();
  }, [proofBundleId]);

  const loadProofBundle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProofBundle(proofBundleId);
      setBundle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proof bundle');
      toast.error('Failed to load proof bundle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      const result = await proofBundleVerifier.verifyBundle(proofBundleId);
      setVerificationResult(result);
      setShowVerificationModal(true);
      if (result.isValid) {
        toast.success('Proof bundle verified successfully');
      } else {
        toast.error('Verification failed');
      }
    } catch (err) {
      toast.error('Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExport = async () => {
    if (!bundle) return;
    try {
      // Export JSON (primary)
      const exportData = {
        ...bundle,
        verificationResult,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proof-bundle-${formatDecisionId(bundle.id)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Proof bundle exported');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/proof?bundle=${proofBundleId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleReplay = () => {
    navigate(`/lab/replay?bundle=${proofBundleId}`);
  };

  if (isLoading) {
    return <ProofBundleSkeleton />;
  }

  if (error || !bundle) {
    return (
      <EdgeCard className={cn('max-w-2xl mx-auto', className)}>
        <EdgeCardBody>
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">{error || 'Proof bundle not found'}</p>
            <Button variant="secondary" onClick={loadProofBundle}>
              Retry
            </Button>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    );
  }

  const status = decisionToStatus(bundle.decision);
  const boundary = getBoundaryContext(bundle, currentEnterprise?.name);
  const confidence = bundle.rationaleStructured?.confidence_score;
  const confidenceColor = getConfidenceColor(confidence);

  return (
    <div className={cn('min-h-screen bg-neutral-100', className)}>
      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>AICOMPLYR</span>
              <span>/</span>
              <span>{boundary.enterprise}</span>
              <span>/</span>
              <span>Decisions</span>
              <span>/</span>
              <span className="text-aicomplyr-black font-semibold">{formatDecisionId(bundle.id)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <StatusBadge variant={status}>{status.toUpperCase()}</StatusBadge>
              {confidence !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn('w-2 h-2', confidenceColor)} />
                  <span className="font-semibold">{Math.round(confidence * 100)}% confidence</span>
                </div>
              )}
              <Button variant="secondary-light" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="secondary-light" onClick={handleVerify} disabled={isVerifying}>
                <Shield className="w-4 h-4" />
                Verify
              </Button>
              <Button variant="secondary-light" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="primary-yellow" onClick={handleReplay}>
                <RotateCcw className="w-4 h-4" />
                Replay Decision
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <StatusBanner variant={status}>{status.toUpperCase()}</StatusBanner>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mobile Notice */}
        <div className="lg:hidden mb-6">
          <EdgeCard variant="attention">
            <EdgeCardBody>
              <p className="text-sm text-neutral-700">
                View on desktop for full regulatory review experience. This interface is optimized for professional audit workflows.
              </p>
            </EdgeCardBody>
          </EdgeCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Decision Record */}
          <div className="lg:col-span-2">
            <DecisionRecordCard bundle={bundle} boundary={boundary} />
          </div>

          {/* Right Panel: Policy Context */}
          <div className="lg:col-span-1 space-y-6">
            <PolicyContextPanel bundle={bundle} />
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && verificationResult && (
        <VerificationModal
          result={verificationResult}
          onClose={() => setShowVerificationModal(false)}
        />
      )}
    </div>
  );
};

// Decision Record Card Component
interface DecisionRecordCardProps {
  bundle: ProofBundle;
  boundary: { enterprise: string; partner: string };
}

const DecisionRecordCard: React.FC<DecisionRecordCardProps> = ({ bundle, boundary }) => {
  const toolName = bundle.rationaleStructured?.inputs?.tool || bundle.atomStatesSnapshot?.toolUsage?.[0]?.toolKey || 'Unknown';
  const toolVersion = bundle.rationaleStructured?.inputs?.tool_version;
  const useCase = bundle.rationaleStructured?.inputs?.request_type || 'N/A';
  const riskLevel = bundle.atomStatesSnapshot?.riskScore
    ? bundle.atomStatesSnapshot.riskScore > 0.7 ? 'high' : bundle.atomStatesSnapshot.riskScore > 0.4 ? 'medium' : 'low'
    : 'medium';

  return (
    <EdgeCard>
      <EdgeCardHeader className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="section-label">Decision Record</span>
          <span className="text-xs font-display tracking-[0.5px] text-neutral-900">AICOMPLYR</span>
        </div>
      </EdgeCardHeader>

      <EdgeCardBody className="space-y-4">
        {/* Boundary */}
        <div>
          <div className="section-label">Boundary</div>
          <div className="text-sm text-neutral-900">
            {boundary.enterprise} → {boundary.partner}
          </div>
        </div>

        {/* Request */}
        <div>
          <div className="section-label">Request</div>
          <div className="flex flex-col gap-2 text-sm text-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Tool</span>
              <span className="font-semibold">
                {toolName}
                {toolVersion && ` v${toolVersion}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Use Case</span>
              <span className="font-semibold">{useCase}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Risk Level</span>
              <span className="px-2 py-1 text-xs font-bold uppercase tracking-wide border border-neutral-800">
                {riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Governance */}
        <div>
          <div className="section-label">Governance</div>
          <div className="flex items-center justify-between text-sm text-neutral-800">
            <span className="text-neutral-600">Policy</span>
            <span className="font-semibold">
              {bundle.rationaleStructured?.policy_id || bundle.policyReference || 'N/A'}
              {bundle.rationaleStructured?.policy_version && ` v${bundle.rationaleStructured.policy_version}`}
            </span>
          </div>
          {bundle.rationaleHuman && (
            <div className="mt-2 text-sm text-neutral-600">{bundle.rationaleHuman}</div>
          )}
        </div>

        {/* Accountability */}
        <div>
          <div className="section-label">Accountability</div>
          <div className="flex items-center justify-between text-sm text-neutral-800">
            <span className="text-neutral-600">Decided by</span>
            <span className="font-semibold">
              {bundle.rationaleStructured?.actor?.name || bundle.rationaleStructured?.actor?.role || 'VERA+ Engine'}
            </span>
          </div>
          {bundle.rationaleStructured?.actor?.role && (
            <div className="flex items-center justify-between text-sm text-neutral-800 mt-1">
              <span className="text-neutral-600">Authority</span>
              <span className="font-semibold">{bundle.rationaleStructured.actor.role}</span>
            </div>
          )}
        </div>
      </EdgeCardBody>

      <EdgeCardFooter className="flex items-center justify-between">
        <span className="mono-id">
          {formatTimestamp(bundle.createdAt)}
          <br />
          {formatDecisionId(bundle.id)}
        </span>
        <span className="text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-aicomplyr-yellow" />
          Boundary Governed.
        </span>
      </EdgeCardFooter>
    </EdgeCard>
  );
};

// Policy Context Panel Component
interface PolicyContextPanelProps {
  bundle: ProofBundle;
}

const PolicyContextPanel: React.FC<PolicyContextPanelProps> = ({ bundle }) => {
  return (
    <div className="space-y-6">
      {/* Active Policy */}
      {bundle.rationaleStructured?.policy_id && (
        <EdgeCard>
          <EdgeCardHeader>
            <div className="section-label">Policy Context</div>
          </EdgeCardHeader>
          <EdgeCardBody>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Active Policy</span>
                <span className="font-semibold">
                  {bundle.rationaleStructured.policy_id} v{bundle.rationaleStructured.policy_version}
                </span>
              </div>
              <a href={`/policies/${bundle.rationaleStructured.policy_id}`} className="text-xs text-aicomplyr-black hover:underline flex items-center gap-1">
                View Full Policy <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </EdgeCardBody>
        </EdgeCard>
      )}

      {/* Triggered Rules */}
      {bundle.rationaleStructured && (
        <div className="space-y-3">
          <div className="section-label">Triggered Rules</div>
          {bundle.rationaleStructured.secondary_rules && bundle.rationaleStructured.secondary_rules.length > 0 ? (
            bundle.rationaleStructured.secondary_rules.map((rule, idx) => (
              <TriggeredRuleCard
                key={idx}
                title={`Rule ${idx + 1}`}
                description={rule}
                match="Policy evaluation"
                action="Applied"
                variant={idx === 0 ? 'conditional' : 'informational'}
              />
            ))
          ) : (
            <TriggeredRuleCard
              title={bundle.rationaleStructured.rule_matched}
              description={`Policy: ${bundle.rationaleStructured.policy_id} v${bundle.rationaleStructured.policy_version}`}
              match="Tool type + Use case"
              action={bundle.decision === 'approved' ? 'Allow' : bundle.decision === 'rejected' ? 'Deny' : 'Escalate'}
              variant="informational"
            />
          )}
        </div>
      )}

      {/* Policy Snapshot */}
      {bundle.epsSnapshotId && (
        <EdgeCard>
          <EdgeCardHeader>
            <div className="section-label">Policy Snapshot</div>
          </EdgeCardHeader>
          <EdgeCardBody className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Snapshot ID</span>
              <span className="mono-id">{bundle.epsSnapshotId}</span>
            </div>
            {bundle.epsHash && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Hash</span>
                <span className="mono-id">
                  sha256:{bundle.epsHash.substring(0, 6)}...{bundle.epsHash.substring(bundle.epsHash.length - 4)}
                </span>
              </div>
            )}
            <a href={`/policies/snapshot/${bundle.epsSnapshotId}`} className="text-xs text-aicomplyr-black hover:underline flex items-center gap-1">
              View Snapshot <ExternalLink className="w-3 h-3" />
            </a>
          </EdgeCardBody>
        </EdgeCard>
      )}

      {/* Conditions */}
      <ConditionList bundle={bundle} />

      {/* Precedent Analysis */}
      <PrecedentAnalysisPanel bundle={bundle} />

      {/* Agent Reasoning Trace */}
      <AgentReasoningTrace bundle={bundle} />

      {/* Cryptographic Verification */}
      <CryptographicVerificationPanel bundle={bundle} />
    </div>
  );
};

// Skeleton Loading Component
const ProofBundleSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="bg-white border-l-4 border-l-aicomplyr-black mb-6 p-6">
          <div className="h-6 bg-neutral-200 w-64 mb-4" />
          <div className="h-4 bg-neutral-200 w-48" />
        </div>

        {/* Status Banner Skeleton */}
        <div className="h-16 bg-neutral-200 mb-6" />

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-l-4 border-l-aicomplyr-black p-6">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 w-32" />
                <div className="h-4 bg-neutral-200 w-full" />
                <div className="h-4 bg-neutral-200 w-3/4" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border-l-4 border-l-aicomplyr-black p-6">
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 w-24" />
                <div className="h-4 bg-neutral-200 w-full" />
                <div className="h-4 bg-neutral-200 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofBundleDetailViewer;

