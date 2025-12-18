import { useState, useEffect } from 'react';
import { spineService } from '@/services/spineService';
import type { SpineData, SpineDecision, SpineDecisionResult } from '@/types/spine';
import { emitSpineTelemetry } from '@/utils/spineTelemetry';

type SpineState = 'idle' | 'loading' | 'ready' | 'error' | 'deciding' | 'attested';

export const useSpine = (threadId: string) => {
  const [state, setState] = useState<SpineState>('idle');
  const [data, setData] = useState<SpineData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attestation, setAttestation] = useState<SpineDecisionResult | null>(null);
  
  useEffect(() => {
    if (!threadId) return;
    
    const loadNarrative = async () => {
      setState('loading');
      setError(null);
      
      try {
        const narrative = await spineService.fetchNarrative(threadId);
        setData(narrative);
        setState('ready');
        
        // Telemetry
        emitSpineTelemetry('ui_spine_opened', {
          thread_id: threadId,
          policy_snapshot_id: narrative.facts.policySnapshotId
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load narrative');
        setState('error');
      }
    };
    
    loadNarrative();
  }, [threadId]);
  
  const submitDecision = async (decision: SpineDecision) => {
    if (!data) return;
    
    setState('deciding');
    setError(null);
    
    try {
      const result = await spineService.submitDecision(decision);
      setAttestation(result);
      setState('attested');
      
      emitSpineTelemetry('ui_spine_attested', {
        thread_id: decision.threadId,
        policy_snapshot_id: decision.policySnapshotId,
        bundle_id: result.proofBundleId,
        decision_kind: decision.kind
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
      setState('error');
    }
  };
  
  const approve = (reviewers: string[], conditions?: string[]) => {
    submitDecision({
      kind: 'Approve',
      threadId,
      policySnapshotId: data!.facts.policySnapshotId,
      reviewers,
      conditions
    });
  };
  
  const requestChanges = (reviewers: string[], rationale: string) => {
    submitDecision({
      kind: 'RequestChanges',
      threadId,
      policySnapshotId: data!.facts.policySnapshotId,
      reviewers,
      rationale
    });
  };
  
  const startCanary = (reviewers: string[], canaryConfig?: any) => {
    submitDecision({
      kind: 'StartCanary',
      threadId,
      policySnapshotId: data!.facts.policySnapshotId,
      reviewers,
      canaryConfig
    });
  };
  
  const escalate = (reviewers: string[], escalateTo: any, rationale: string) => {
    submitDecision({
      kind: 'Escalate',
      threadId,
      policySnapshotId: data!.facts.policySnapshotId,
      reviewers,
      escalateTo,
      rationale
    });
  };
  
  const openProof = async () => {
    if (!data?.proofBundleId) {
      console.warn('[Spine] No proof bundle available yet');
      return null;
    }
    
    emitSpineTelemetry('ui_spine_proof_opened', {
      thread_id: threadId,
      policy_snapshot_id: data.facts.policySnapshotId
    });
    
    return await spineService.fetchProofBundle(data.proofBundleId);
  };
  
  return {
    state,
    data,
    error,
    attestation,
    approve,
    requestChanges,
    startCanary,
    escalate,
    openProof,
    isLoading: state === 'loading',
    isDeciding: state === 'deciding',
    isAttested: state === 'attested',
    isReady: state === 'ready'
  };
};
