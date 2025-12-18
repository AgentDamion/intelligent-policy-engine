import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSpine } from '@/hooks/useSpine';
import { KeyFactsPanel } from './KeyFactsPanel';
import { SpineNarrativeContent } from './SpineNarrativeContent';
import { ConversationPanel } from './ConversationPanel';
import { DecisionBar } from './DecisionBar';
import { ProofBundleModal } from './ProofBundleModal';
import { ConstellationModal } from '@/components/agentic/constellation/ConstellationModal';
import { toast } from 'sonner';
import { SPINE_LAYOUT } from '@/constants/spine';
import { emitSpineTelemetry } from '@/utils/spineTelemetry';
import { ACChatWidget } from '@/components/agentic/ac/ACChatWidget';
import { clsx } from 'clsx';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';
import { useDemoMode } from '@/hooks/useDemoMode';

interface SpineLayoutProps {
  threadId?: string;
  isStandalone?: boolean;
}

export const SpineLayout = ({ 
  threadId: propThreadId, 
  isStandalone = false 
}: SpineLayoutProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const threadId = propThreadId || searchParams.get('t') || 't1';
  const attestedId = searchParams.get('attested');
  
  const { state, data, error, attestation, approve, requestChanges, startCanary, escalate, openProof, isLoading, isDeciding, isAttested } = useSpine(threadId);
  
  // ✅ All hooks must be called before any conditional returns
  const { isDemoMode } = useDemoMode();
  const { realtimeMessages } = useAgentMessagesRealtime(threadId || '');
  
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofBundle, setProofBundle] = useState<any>(null);
  const [constellationOpen, setConstellationOpen] = useState(false);
  const [editingCanary, setEditingCanary] = useState(false);
  const [canaryParams, setCanaryParams] = useState({
    cohortPercent: 15,
    durationDays: 7
  });
  const [activeView, setActiveView] = useState<'narrative' | 'conversation'>('narrative');
  
  // Update canary params when data loads
  useEffect(() => {
    if (data?.narrative) {
      setCanaryParams({
        cohortPercent: data.narrative.resolution.canaryPlan.cohortPercent,
        durationDays: data.narrative.resolution.canaryPlan.durationDays
      });
    }
  }, [data]);
  
  // Persist attestation in URL
  useEffect(() => {
    if (attestation && !attestedId) {
      setSearchParams({ 
        tab: 'spine', 
        t: threadId, 
        attested: attestation.proofBundleId 
      });
    }
  }, [attestation, attestedId, threadId, setSearchParams]);
  
  const handleOpenProof = async () => {
    const bundle = await openProof();
    if (bundle) {
      setProofBundle(bundle);
      setProofModalOpen(true);
    } else {
      toast.info('No proof bundle available yet');
    }
  };
  
  const handleViewWeave = () => {
    if (isStandalone) {
      window.location.href = `/agentic?tab=weave&t=${threadId}`;
    } else {
      setSearchParams({ tab: 'weave', t: threadId });
    }
  };
  
  const handleOpenWorkbench = () => {
    if (!data) return;
    
    emitSpineTelemetry('ui_spine_open_workbench', {
      thread_id: threadId,
      policy_snapshot_id: data.facts.policySnapshotId,
      tool_id: data.facts.tool.id
    });
    
    if (isStandalone) {
      window.location.href = `/agentic?tab=workbench&eps=${data.facts.policySnapshotId}&tool=${data.facts.tool.id}&focus=watermark`;
    } else {
      setSearchParams({ 
        tab: 'workbench', 
        eps: data.facts.policySnapshotId,
        tool: data.facts.tool.id,
        focus: 'watermark'
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="border-r border-ink-100 p-s4 space-y-s4" style={{ width: `${SPINE_LAYOUT.LEFT_RAIL_WIDTH}px` }}>
          <div className="h-[60px] bg-ink-100 rounded-r2 animate-pulse" />
          <div className="space-y-s2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-[40px] bg-ink-100 rounded-r1 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-s6 space-y-s6">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-s3" style={{ maxWidth: `${SPINE_LAYOUT.NARRATIVE_MAX_WIDTH}px` }}>
              <div className="h-[30px] bg-ink-100 rounded-r2 w-[200px] animate-pulse" />
              <div className="h-[100px] bg-ink-100 rounded-r2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-s6">
        <div className="text-center space-y-s3">
          <div className="text-[14px] font-mono text-ink-900 bg-surface-50 border border-ink-200 p-s4 rounded-r2">
            Error: {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[12px] text-ink-500 hover:text-ink-900 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-s6">
        <div className="text-center space-y-s2">
          <p className="text-[14px] text-ink-700">No narrative available yet.</p>
          <button
            onClick={handleViewWeave}
            className="text-[12px] text-ink-500 hover:text-ink-900 underline"
          >
            Return to Weave →
          </button>
        </div>
      </div>
    );
  }
  
  if (isAttested && (attestation || attestedId)) {
    const displayAttestation = attestation || { proofBundleId: attestedId, attestationId: 'restored', timestamp: '' };
    return (
      <div className="flex items-center justify-center h-full p-s6">
        <div className="text-center space-y-s4 max-w-md">
          <div className="text-[20px] font-semibold text-ink-900">
            <span className="inline-block mr-s2">✓</span>
            Decision Attested
          </div>
          <div className="text-[14px] text-ink-700 space-y-s2">
            <div>
              <span className="text-ink-500">Proof Bundle:</span>{' '}
              <span className="font-mono">{displayAttestation.proofBundleId}</span>
            </div>
            {displayAttestation.attestationId !== 'restored' && (
              <div>
                <span className="text-ink-500">Attestation:</span>{' '}
                <span className="font-mono">{displayAttestation.attestationId}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleViewWeave}
            className="text-[12px] text-ink-500 hover:text-ink-900 underline"
          >
            {isStandalone ? 'Open in Agentic Suite →' : 'Return to Weave →'}
          </button>
        </div>
      </div>
    );
  }
  
  const { facts, narrative } = data;
  const exchangeCount = realtimeMessages.length;
  
  return (
    <div className="flex h-full" data-thread-id={threadId} data-policy-snapshot-id={facts.policySnapshotId} data-spine-mode={isStandalone ? 'standalone' : 'tabbed'}>
      {/* Key Facts as collapsible right sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-ink-100 bg-surface-50">
          <button
            onClick={() => setActiveView('narrative')}
            className={clsx(
              'px-s4 py-s3 text-[14px] font-medium transition-colors',
              activeView === 'narrative' 
                ? 'border-b-2 border-ink-900 text-ink-900 -mb-px' 
                : 'text-ink-500 hover:text-ink-900'
            )}
            data-tab="narrative"
          >
            Narrative
          </button>
          <button
            onClick={() => setActiveView('conversation')}
            className={clsx(
              'px-s4 py-s3 text-[14px] font-medium transition-colors',
              activeView === 'conversation' 
                ? 'border-b-2 border-ink-900 text-ink-900 -mb-px' 
                : 'text-ink-500 hover:text-ink-900'
            )}
            data-tab="conversation"
          >
            Conversation {exchangeCount > 0 && `(${exchangeCount})`}
          </button>
        </div>
        
        {/* Tab Content */}
        {activeView === 'narrative' ? (
          <SpineNarrativeContent
            narrative={narrative}
            canaryParams={canaryParams}
            editingCanary={editingCanary}
            onEditCanaryToggle={() => setEditingCanary(!editingCanary)}
            onCanaryParamsChange={setCanaryParams}
            onOpenWorkbench={handleOpenWorkbench}
          />
        ) : (
          <ConversationPanel threadId={threadId} />
        )}
        
        <DecisionBar
          threadId={threadId}
          policySnapshotId={facts.policySnapshotId}
          onApprove={approve}
          onRequestChanges={requestChanges}
          onStartCanary={(reviewers) => startCanary(reviewers, canaryParams)}
          onEscalate={escalate}
          onOpenConstellation={() => setConstellationOpen(true)}
          isSubmitting={isDeciding}
        />
      </div>
      
      {/* Key Facts Panel on Right */}
      <KeyFactsPanel facts={facts} onOpenProof={handleOpenProof} onViewWeave={handleViewWeave} />
      
      <ProofBundleModal
        open={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        bundle={proofBundle}
      />
      
      <ConstellationModal
        threadId={threadId}
        policySnapshotId={facts.policySnapshotId}
        isOpen={constellationOpen}
        onClose={() => setConstellationOpen(false)}
      />
    </div>
  );
};
