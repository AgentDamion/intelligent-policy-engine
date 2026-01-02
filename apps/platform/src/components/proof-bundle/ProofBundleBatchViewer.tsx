import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Copy,
} from 'lucide-react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AICOMPLYRButton as Button } from '@/components/ui/aicomplyr-button';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  getBatchBundle,
  verifyBatchBundle,
  exportBatchBundlePDF,
  exportBatchBundleZIP,
  type BatchProofBundle,
  type BatchDecision,
  type ApprovalStep,
  type TriggeredRule,
  type ContextSnapshot,
} from '@/services/proofBundleBatchService';
import { VerificationAnimation } from './VerificationAnimation';

// =============================================================================
// Types (re-exported from service for convenience)
// =============================================================================

export type { BatchProofBundle, BatchDecision } from '@/services/proofBundleBatchService';

// =============================================================================
// Main Component
// =============================================================================

interface ProofBundleBatchViewerProps {
  bundleId: string;
  onClose?: () => void;
  className?: string;
}

type TabType = 'decisions' | 'verification' | 'policy';

export const ProofBundleBatchViewer: React.FC<ProofBundleBatchViewerProps> = ({
  bundleId,
  onClose,
  className,
}) => {
  const navigate = useNavigate();
  const { currentEnterprise } = useEnterprise();
  const [bundle, setBundle] = useState<BatchProofBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('decisions');
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    hashValid: boolean;
    signatureValid: boolean;
    chainValid: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBundle();
  }, [bundleId]);

  const loadBundle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBatchBundle(bundleId);
      setBundle(data);
      if (data && data.decisions.length > 0) {
        setSelectedDecisionId(data.decisions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proof bundle');
      toast.error('Failed to load proof bundle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!bundle) return;
    try {
      setIsVerifying(true);
      const result = await verifyBatchBundle(bundleId);
      setVerificationResult({
        hashValid: result.hashValid,
        signatureValid: result.signatureValid,
        chainValid: result.chainValid,
      });
      if (result.hashValid && result.signatureValid && result.chainValid) {
        toast.success('Proof bundle verified successfully');
      } else {
        toast.error('Verification failed');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportPDF = async () => {
    if (!bundle) return;
    setIsExporting(true);
    try {
      const blob = await exportBatchBundlePDF(bundleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bundle.bundleNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show export ceremony toast
      toast.success(
        `BUNDLE SEALED - Immutable record generated. Export count: ${bundle.metadata.exportCount + 1}`,
        {
          duration: 4000,
          style: {
            borderLeft: '4px solid #FFE500',
            background: '#FFFFFF',
            color: '#000000',
          },
        }
      );
      
      // Reload bundle to get updated export count
      await loadBundle();
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZIP = async () => {
    if (!bundle) return;
    setIsExporting(true);
    try {
      const blob = await exportBatchBundleZIP(bundleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bundle.bundleNumber}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show export ceremony toast
      toast.success(
        `BUNDLE SEALED - Immutable record generated. Export count: ${bundle.metadata.exportCount + 1}`,
        {
          duration: 4000,
          style: {
            borderLeft: '4px solid #FFE500',
            background: '#FFFFFF',
            color: '#000000',
          },
        }
      );
      
      // Reload bundle to get updated export count
      await loadBundle();
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const truncateHash = (hash: string, length: number = 8): string => {
    if (hash.length <= length * 2) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  if (isLoading) {
    return <BatchViewerSkeleton className={className} />;
  }

  if (error || !bundle) {
    return (
      <EdgeCard className={cn('max-w-2xl mx-auto', className)}>
        <EdgeCardBody>
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">{error || 'Proof bundle not found'}</p>
            <Button variant="secondary" onClick={loadBundle}>
              Retry
            </Button>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    );
  }

  const selectedDecision = bundle.decisions.find(d => d.id === selectedDecisionId) || bundle.decisions[0];

  return (
    <div className={cn('min-h-screen bg-neutral-100', className)}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b-4 border-b-aicomplyr-black">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-black/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="square" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                )}
                <h1 className="text-xl font-display text-aicomplyr-black tracking-tight">
                  {bundle.bundleNumber}
                </h1>
                <StatusBadge variant={bundle.status === 'finalized' ? 'approved' : bundle.status === 'exported' ? 'conditional' : 'pending'}>
                  {bundle.status.toUpperCase()}
                </StatusBadge>
                {bundle.verification.signatureValid !== null && (
                  <StatusBadge variant={bundle.verification.signatureValid ? 'approved' : 'denied'}>
                    {bundle.verification.signatureValid ? 'VERIFIED' : 'INVALID'}
                  </StatusBadge>
                )}
              </div>
              <p className="text-sm text-neutral-500">
                {bundle.enterpriseName} • {bundle.scope.brands.join(', ')} • 
                {formatDate(bundle.scope.dateRange.start)} – {formatDate(bundle.scope.dateRange.end)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="secondary-light" onClick={handleExportPDF} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export PDF
              </Button>
              <Button variant="primary-yellow" onClick={handleExportZIP} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Export ZIP
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex px-6 border-t border-neutral-200">
          {(['decisions', 'verification', 'policy'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors',
                activeTab === tab
                  ? 'text-aicomplyr-black border-b-4 border-b-aicomplyr-yellow -mb-px'
                  : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              {tab === 'decisions' && `Decisions (${bundle.decisions.length})`}
              {tab === 'verification' && 'Verification'}
              {tab === 'policy' && 'Policy Snapshot'}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Decisions Tab */}
        {activeTab === 'decisions' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Decision List */}
            <div className="space-y-3">
              <h3 className="section-label mb-4">Decision Catalog</h3>
              {bundle.decisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onClick={() => setSelectedDecisionId(decision.id)}
                  isSelected={selectedDecisionId === decision.id}
                />
              ))}
            </div>
            
            {/* Decision Detail */}
            <div className="col-span-2 space-y-6">
              {selectedDecision ? (
                <>
                  <DecisionDetailCard decision={selectedDecision} />
                  <ContextSnapshotCard snapshot={selectedDecision.contextSnapshot} />
                  <TriggeredRulesCard rules={selectedDecision.triggeredRules} />
                  <ApprovalChainCard steps={selectedDecision.approvalChain} />
                </>
              ) : (
                <EdgeCard>
                  <EdgeCardBody>
                    <div className="text-center py-8 text-neutral-400">
                      Select a decision to view details
                    </div>
                  </EdgeCardBody>
                </EdgeCard>
              )}
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <VerificationTab 
            bundle={bundle}
            verificationResult={verificationResult}
            isVerifying={isVerifying}
            onVerify={handleVerify}
            truncateHash={truncateHash}
            formatDateTime={formatDateTime}
          />
        )}

        {/* Policy Tab */}
        {activeTab === 'policy' && (
          <PolicyTab 
            bundle={bundle}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Sub-Components
// =============================================================================

// Decision Card (compact list item)
interface DecisionCardProps {
  decision: BatchDecision;
  onClick: () => void;
  isSelected: boolean;
}

const DecisionCard: React.FC<DecisionCardProps> = ({ decision, onClick, isSelected }) => {
  const edgeColor = decision.outcome === 'denied' ? 'border-l-status-denied' : 
                    decision.outcome === 'escalated' ? 'border-l-status-escalated' : 
                    'border-l-status-approved';
  
  return (
    <button
      onClick={onClick}
      className={cn('w-full text-left transition-all', isSelected && 'ring-2 ring-aicomplyr-yellow')}
    >
      <EdgeCard className={cn('hover:bg-neutral-50', edgeColor)}>
        <EdgeCardBody className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <code className="text-[10px] font-mono text-neutral-400 block mb-1">{decision.decisionNumber}</code>
              <h4 className="text-sm font-bold text-aicomplyr-black truncate">
                {decision.toolName} {decision.toolVersion}
              </h4>
            </div>
            <StatusBadge 
              variant={decision.outcome === 'approved' ? 'approved' : 
                      decision.outcome === 'approved_with_conditions' ? 'conditional' :
                      decision.outcome === 'denied' ? 'denied' : 'escalated'}
            >
              {decision.outcome.replace('_', ' ').toUpperCase()}
            </StatusBadge>
          </div>
          
          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span>{decision.brandName}</span>
            <span>•</span>
            <span className="font-mono">{decision.confidenceScore}%</span>
            <span>•</span>
            <span>{new Date(decision.timestamp).toLocaleDateString()}</span>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </button>
  );
};

// Decision Detail Card
interface DecisionDetailCardProps {
  decision: BatchDecision;
}

const DecisionDetailCard: React.FC<DecisionDetailCardProps> = ({ decision }) => {
  return (
    <EdgeCard variant="selected">
      <EdgeCardBody className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <code className="text-xs font-mono text-neutral-400 block mb-1">{decision.decisionNumber}</code>
            <h2 className="text-lg font-display text-aicomplyr-black">
              {decision.toolName} {decision.toolVersion}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {decision.brandName} • {new Date(decision.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <StatusBadge 
              variant={decision.outcome === 'approved' ? 'approved' : 
                      decision.outcome === 'approved_with_conditions' ? 'conditional' :
                      decision.outcome === 'denied' ? 'denied' : 'escalated'}
            >
              {decision.outcome.replace('_', ' ').toUpperCase()}
            </StatusBadge>
            <p className="text-xs text-neutral-400 mt-1">
              Confidence: <span className="font-mono font-bold">{decision.confidenceScore}%</span>
            </p>
          </div>
        </div>
        
        <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 p-4 mb-4">
          <span className="section-label">Rationale</span>
          <p className="text-sm text-aicomplyr-black mt-1">{decision.rationale}</p>
        </div>
        
        {decision.conditions.length > 0 && (
          <div>
            <span className="section-label">Conditions</span>
            <ul className="mt-2 space-y-1">
              {decision.conditions.map((condition, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="text-aicomplyr-yellow mt-0.5">•</span>
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        )}
      </EdgeCardBody>
    </EdgeCard>
  );
};

// Context Snapshot Card
interface ContextSnapshotCardProps {
  snapshot: ContextSnapshot;
}

const ContextSnapshotCard: React.FC<ContextSnapshotCardProps> = ({ snapshot }) => {
  return (
    <EdgeCard>
      <EdgeCardHeader>
        <span className="section-label">Context at Decision Time</span>
      </EdgeCardHeader>
      <EdgeCardBody>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 px-3 py-2">
            <span className="section-label">Policy Version</span>
            <p className="text-sm font-mono font-bold text-aicomplyr-black mt-1">{snapshot.policyVersion}</p>
          </div>
          <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 px-3 py-2">
            <span className="section-label">Partner</span>
            <p className="text-sm font-bold text-aicomplyr-black mt-1">{snapshot.partnerName}</p>
          </div>
          <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 px-3 py-2">
            <span className="section-label">Tool Risk Tier</span>
            <p className={cn(
              'text-sm font-bold mt-1',
              snapshot.toolRiskTier === 'high' ? 'text-status-denied' :
              snapshot.toolRiskTier === 'medium' ? 'text-status-escalated' : 'text-status-approved'
            )}>
              {snapshot.toolRiskTier.toUpperCase()}
            </p>
          </div>
          <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 px-3 py-2">
            <span className="section-label">Compliance Score</span>
            <p className="text-sm font-bold text-aicomplyr-black mt-1">{snapshot.partnerComplianceScore}/100</p>
          </div>
        </div>
      </EdgeCardBody>
    </EdgeCard>
  );
};

// Triggered Rules Card
interface TriggeredRulesCardProps {
  rules: TriggeredRule[];
}

const TriggeredRulesCard: React.FC<TriggeredRulesCardProps> = ({ rules }) => {
  return (
    <EdgeCard>
      <EdgeCardHeader>
        <span className="section-label">Triggered Rules</span>
      </EdgeCardHeader>
      <EdgeCardBody>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                'border-l-4 bg-neutral-50 px-3 py-2',
                rule.outcome === 'pass' ? 'border-l-status-approved' :
                rule.outcome === 'fail' ? 'border-l-status-denied' :
                'border-l-status-escalated'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-aicomplyr-black">{rule.name}</span>
                <span className={cn(
                  'text-xs font-bold',
                  rule.outcome === 'pass' ? 'text-status-approved' :
                  rule.outcome === 'fail' ? 'text-status-denied' :
                  'text-status-escalated'
                )}>
                  {rule.outcome === 'pass' ? '✓' : rule.outcome === 'fail' ? '✗' : '!'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-600">{rule.details}</p>
            </div>
          ))}
        </div>
      </EdgeCardBody>
    </EdgeCard>
  );
};

// Approval Chain Card
interface ApprovalChainCardProps {
  steps: ApprovalStep[];
}

const ApprovalChainCard: React.FC<ApprovalChainCardProps> = ({ steps }) => {
  return (
    <EdgeCard>
      <EdgeCardHeader>
        <span className="section-label">Approval Chain</span>
      </EdgeCardHeader>
      <EdgeCardBody>
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const actionConfig = {
              approved: { bg: 'bg-status-approved', icon: '✓' },
              denied: { bg: 'bg-status-denied', icon: '✗' },
              escalated: { bg: 'bg-status-escalated', icon: '↑' },
              pending: { bg: 'bg-neutral-400', icon: '○' },
            };
            const { bg, icon } = actionConfig[step.action];
            
            return (
              <div key={step.stepNumber} className="relative flex gap-3 pb-4">
                {!isLast && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-neutral-200" />
                )}
                
                <div className={cn('relative z-10 w-6 h-6 flex items-center justify-center flex-shrink-0', bg)}>
                  <span className="text-white text-xs font-bold">{icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-aicomplyr-black">{step.role}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">{step.actorName}</p>
                  {step.notes && (
                    <p className="text-[11px] text-neutral-500 mt-1 italic">"{step.notes}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </EdgeCardBody>
    </EdgeCard>
  );
};

// Verification Tab
interface VerificationTabProps {
  bundle: BatchProofBundle;
  verificationResult: { hashValid: boolean; signatureValid: boolean; chainValid: boolean } | null;
  isVerifying: boolean;
  onVerify: () => void;
  truncateHash: (hash: string) => string;
  formatDateTime: (date: string) => string;
}

const VerificationTab: React.FC<VerificationTabProps> = ({
  bundle,
  verificationResult,
  isVerifying,
  onVerify,
  truncateHash,
  formatDateTime,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
    toast.success('Hash copied to clipboard');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <EdgeCard variant={bundle.verification.signatureValid ? 'selected' : undefined}>
        <EdgeCardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-display text-aicomplyr-black mb-1">Cryptographic Verification</h2>
              <p className="text-sm text-neutral-500">{bundle.regulatoryFramework} compliant proof bundle</p>
            </div>
            <Button 
              variant="primary-yellow" 
              onClick={onVerify} 
              disabled={isVerifying}
              className="focus:outline-none focus:ring-2 focus:ring-aicomplyr-yellow focus:ring-offset-2"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isVerifying ? 'Verifying...' : 'Re-verify Now'}
            </Button>
          </div>
          
          {verificationResult && (
            <div className="mb-6" key={`verify-${verificationResult.hashValid}-${verificationResult.signatureValid}-${verificationResult.chainValid}`}>
              <VerificationAnimation
                hashValid={verificationResult.hashValid}
                signatureValid={verificationResult.signatureValid}
                chainValid={verificationResult.chainValid}
                bundleHash={bundle.verification.bundleHash}
                signatureKeyId={bundle.verification.signatureKeyId}
                previousEntryHash={bundle.verification.previousEntryHash}
              />
            </div>
          )}
          
          <div className="space-y-1 border-t border-neutral-200 pt-4">
            <HashDisplay 
              label="Bundle Hash (SHA-256)" 
              hash={bundle.verification.bundleHash}
              onCopy={() => handleCopyHash(bundle.verification.bundleHash)}
              copied={copiedHash === bundle.verification.bundleHash}
              truncateHash={truncateHash}
            />
            <HashDisplay 
              label="Ledger Entry Hash" 
              hash={bundle.verification.ledgerEntryHash}
              onCopy={() => handleCopyHash(bundle.verification.ledgerEntryHash)}
              copied={copiedHash === bundle.verification.ledgerEntryHash}
              truncateHash={truncateHash}
            />
            {bundle.verification.previousEntryHash && (
              <HashDisplay 
                label="Previous Entry Hash" 
                hash={bundle.verification.previousEntryHash}
                onCopy={() => handleCopyHash(bundle.verification.previousEntryHash!)}
                copied={copiedHash === bundle.verification.previousEntryHash}
                truncateHash={truncateHash}
              />
            )}
          </div>
        </EdgeCardBody>
      </EdgeCard>
      
      <EdgeCard>
        <EdgeCardHeader>
          <span className="section-label">Signature Details</span>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="space-y-3">
            <DetailRow label="Algorithm" value={bundle.verification.signatureAlgorithm || 'Not signed'} />
            <DetailRow label="Key ID" value={bundle.verification.signatureKeyId || 'N/A'} />
            <DetailRow 
              label="Finalized At" 
              value={bundle.verification.finalizedAt ? formatDateTime(bundle.verification.finalizedAt) : 'Not finalized'} 
            />
            <DetailRow label="Finalized By" value={bundle.verification.finalizedBy || 'N/A'} />
          </div>
        </EdgeCardBody>
      </EdgeCard>
      
      <EdgeCard variant="selected">
        <EdgeCardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label">Public Verification URL</span>
              <p className="text-sm font-mono text-aicomplyr-black mt-1">{bundle.metadata.verificationUrl}</p>
            </div>
            <Button 
              variant="secondary-light" 
              onClick={() => {
                navigator.clipboard.writeText(bundle.metadata.verificationUrl);
                toast.success('Link copied');
              }}
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  );
};


interface HashDisplayProps {
  label: string;
  hash: string;
  onCopy: () => void;
  copied: boolean;
  truncateHash: (hash: string) => string;
}

const HashDisplay: React.FC<HashDisplayProps> = ({ 
  label, 
  hash, 
  onCopy, 
  copied,
  truncateHash,
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-xs text-neutral-500">{label}</span>
    <div className="flex items-center gap-2">
      <code className="font-mono text-xs text-neutral-700">{truncateHash(hash)}</code>
      <button
        onClick={onCopy}
        className="p-1 hover:bg-neutral-100 transition-colors"
        title="Copy full hash"
      >
        {copied ? (
          <CheckCircle className="w-3.5 h-3.5 text-status-approved" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-neutral-400" />
        )}
      </button>
    </div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0">
    <span className="text-sm text-neutral-500">{label}</span>
    <span className={cn('text-sm font-mono text-aicomplyr-black', !value.includes('N/A') && 'font-bold')}>
      {value}
    </span>
  </div>
);

// Policy Tab
interface PolicyTabProps {
  bundle: BatchProofBundle;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
}

const PolicyTab: React.FC<PolicyTabProps> = ({ bundle, formatDate, formatDateTime }) => {
  return (
    <div className="max-w-2xl space-y-6">
      <EdgeCard>
        <EdgeCardHeader>
          <span className="section-label">Policy Snapshot at Bundle Generation</span>
        </EdgeCardHeader>
        <EdgeCardBody className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border-l-4 border-l-aicomplyr-yellow bg-neutral-50 px-4 py-3">
              <span className="section-label">Version</span>
              <p className="text-lg font-display font-mono text-aicomplyr-black mt-1">{bundle.policySnapshot.version}</p>
            </div>
            <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 px-4 py-3">
              <span className="section-label">Effective Since</span>
              <p className="text-lg font-bold text-aicomplyr-black mt-1">{formatDate(bundle.policySnapshot.effectiveDate)}</p>
            </div>
          </div>
          
          <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 px-4 py-3 mb-4">
            <span className="section-label">Policy Digest</span>
            <p className="text-sm font-mono text-neutral-700 mt-1">{bundle.policySnapshot.policyDigest}</p>
          </div>
          
          <div className="flex items-center justify-between py-3 border-t border-neutral-200">
            <span className="text-sm text-neutral-500">Total Rules in Policy</span>
            <span className="text-sm font-bold text-aicomplyr-black">{bundle.policySnapshot.ruleCount}</span>
          </div>
        </EdgeCardBody>
      </EdgeCard>
      
      <EdgeCard>
        <EdgeCardHeader>
          <span className="section-label">Bundle Metadata</span>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="space-y-3">
            <DetailRow label="Generated By" value={`${bundle.generatedBy.name} (${bundle.generatedBy.role})`} />
            <DetailRow label="Generated At" value={formatDateTime(bundle.generatedAt)} />
            <DetailRow label="Total Decisions" value={bundle.scope.decisionCount.toString()} />
            <DetailRow label="Export Count" value={bundle.metadata.exportCount.toString()} />
            <DetailRow 
              label="Last Exported" 
              value={bundle.metadata.lastExportedAt ? formatDateTime(bundle.metadata.lastExportedAt) : 'Never'} 
            />
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  );
};

// Skeleton Loading Component
const BatchViewerSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('min-h-screen bg-neutral-100 p-8', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border-l-4 border-l-aicomplyr-black mb-6 p-6">
          <div className="h-6 bg-neutral-200 w-64 mb-4 animate-pulse" />
          <div className="h-4 bg-neutral-200 w-48 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-l-4 border-l-aicomplyr-black p-6">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 w-32 animate-pulse" />
                <div className="h-4 bg-neutral-200 w-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border-l-4 border-l-aicomplyr-black p-6">
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 w-24 animate-pulse" />
                <div className="h-4 bg-neutral-200 w-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofBundleBatchViewer;

