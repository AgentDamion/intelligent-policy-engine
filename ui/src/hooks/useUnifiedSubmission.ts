import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unifiedApi } from '@/services/unified-api';
import type { ToolSubmission } from '@/app/tools/submit/types';

// Extended types for unified submission
export interface UnifiedSubmission extends ToolSubmission {
  documents?: any[];
  approval?: any;
  compliance?: any;
  auditTrail?: any[];
  governance?: any[];
}

export interface UnifiedSubmissionState {
  // Core submission data
  submission: UnifiedSubmission | null;
  
  // Document processing
  documents: any[];
  documentProcessing: {
    isProcessing: boolean;
    results: any[];
    error: string | null;
  };
  
  // Approval workflow
  approval: {
    request: any | null;
    metrics: any | null;
    isTracking: boolean;
  };
  
  // Compliance
  compliance: {
    score: any | null;
    recommendations: any[];
    isCalculating: boolean;
  };
  
  // Audit trail
  auditTrail: {
    events: any[];
    isLoading: boolean;
    error: string | null;
  };
  
  // Live governance
  governance: {
    events: any[];
    metrics: any | null;
    isLive: boolean;
  };
  
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: Date | null;
  completionPercentage: number;
}

export function useUnifiedSubmission(initialId?: string) {
  const [state, setState] = useState<UnifiedSubmissionState>({
    submission: null,
    documents: [],
    documentProcessing: {
      isProcessing: false,
      results: [],
      error: null
    },
    approval: {
      request: null,
      metrics: null,
      isTracking: false
    },
    compliance: {
      score: null,
      recommendations: [],
      isCalculating: false
    },
    auditTrail: {
      events: [],
      isLoading: false,
      error: null
    },
    governance: {
      events: [],
      metrics: null,
      isLive: false
    },
    loading: false,
    saving: false,
    error: null,
    lastSaved: null,
    completionPercentage: 0
  });

  const [id, setId] = useState<string | undefined>(initialId);
  const draftTimer = useRef<number | undefined>();
  const unsubscribeWebSocket = useRef<(() => void) | null>(null);

  // Initialize submission
  useEffect(() => {
    (async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        if (!initialId) {
          // Create new submission
          const { submissionId } = await unifiedApi.tools.createSubmission();
          setId(submissionId);
          
          // Fetch the new submission
          const submission = await unifiedApi.tools.fetchSubmission(submissionId);
          setState(prev => ({ ...prev, submission, loading: false }));
        } else {
          // Fetch existing submission with full dashboard data
          const dashboardData = await unifiedApi.tools.getSubmissionDashboard(initialId);
          
          setState(prev => ({
            ...prev,
            submission: dashboardData.submission,
            documents: dashboardData.documents,
            approval: {
              ...prev.approval,
              request: dashboardData.approval,
              metrics: dashboardData.approval?.metrics
            },
            compliance: {
              ...prev.compliance,
              score: dashboardData.compliance,
              recommendations: []
            },
            auditTrail: {
              ...prev.auditTrail,
              events: dashboardData.auditTrail
            },
            governance: {
              ...prev.governance,
              events: dashboardData.governance
            },
            loading: false
          }));
          
          setId(initialId);
        }
      } catch (e: any) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: e.message || 'Failed to load submission' 
        }));
      }
    })();
  }, [initialId]);

  // Set up WebSocket subscriptions
  useEffect(() => {
    if (id) {
      unsubscribeWebSocket.current = unifiedApi.websocket.subscribeToAllEvents({
        onGovernanceEvent: (event) => {
          setState(prev => ({
            ...prev,
            governance: {
              ...prev.governance,
              events: [event, ...prev.governance.events.slice(0, 49)]
            }
          }));
        },
        onApprovalUpdate: (update) => {
          setState(prev => ({
            ...prev,
            approval: {
              ...prev.approval,
              request: update.request || prev.approval.request,
              metrics: update.metrics || prev.approval.metrics
            }
          }));
        },
        onComplianceUpdate: (update) => {
          setState(prev => ({
            ...prev,
            compliance: {
              ...prev.compliance,
              score: update.score || prev.compliance.score
            }
          }));
        },
        onProcessingUpdate: (update) => {
          setState(prev => ({
            ...prev,
            documentProcessing: {
              ...prev.documentProcessing,
              results: update.results || prev.documentProcessing.results
            }
          }));
        }
      });

      setState(prev => ({
        ...prev,
        governance: { ...prev.governance, isLive: true }
      }));
    }

    return () => {
      if (unsubscribeWebSocket.current) {
        unsubscribeWebSocket.current();
      }
    };
  }, [id]);

  // Update submission data
  const update = useCallback((patch: Partial<ToolSubmission>) => {
    if (!id) return;
    
    setState(prev => ({
      ...prev,
      submission: prev.submission ? { ...prev.submission, ...patch } : null
    }));
    
    // Clear existing timer
    window.clearTimeout(draftTimer.current);
    
    // Set up new autosave
    draftTimer.current = window.setTimeout(async () => {
      try {
        setState(prev => ({ ...prev, saving: true }));
        await unifiedApi.tools.saveSubmission(id, patch);
        setState(prev => ({ ...prev, lastSaved: new Date(), saving: false }));
      } catch (e: any) {
        setState(prev => ({ 
          ...prev, 
          error: e.message || 'Failed to save changes',
          saving: false
        }));
      }
    }, 500);
  }, [id]);

  // Upload documents
  const uploadDocuments = useCallback(async (files: File[]) => {
    if (!id) return;
    
    try {
      setState(prev => ({
        ...prev,
        documentProcessing: { ...prev.documentProcessing, isProcessing: true, error: null }
      }));
      
      const { documents } = await unifiedApi.tools.createSubmissionWithDocuments(files);
      
      setState(prev => ({
        ...prev,
        documents,
        documentProcessing: { ...prev.documentProcessing, isProcessing: false }
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        documentProcessing: {
          ...prev.documentProcessing,
          isProcessing: false,
          error: e.message || 'Failed to upload documents'
        }
      }));
    }
  }, [id]);

  // Process documents
  const processDocuments = useCallback(async () => {
    if (!state.documents.length) return;
    
    try {
      setState(prev => ({
        ...prev,
        documentProcessing: { ...prev.documentProcessing, isProcessing: true, error: null }
      }));
      
      const results = await Promise.all(
        state.documents.map(doc => 
          unifiedApi.documents.processDocument(doc.id)
        )
      );
      
      setState(prev => ({
        ...prev,
        documentProcessing: {
          ...prev.documentProcessing,
          results,
          isProcessing: false
        }
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        documentProcessing: {
          ...prev.documentProcessing,
          isProcessing: false,
          error: e.message || 'Failed to process documents'
        }
      }));
    }
  }, [state.documents]);

  // Run compliance check
  const runComplianceCheck = useCallback(async () => {
    if (!id) return;
    
    try {
      setState(prev => ({
        ...prev,
        compliance: { ...prev.compliance, isCalculating: true }
      }));
      
      const [score, recommendations] = await Promise.all([
        unifiedApi.compliance.calculateComplianceScore(id),
        unifiedApi.compliance.getComplianceRecommendations(id)
      ]);
      
      setState(prev => ({
        ...prev,
        compliance: {
          ...prev.compliance,
          score,
          recommendations,
          isCalculating: false
        }
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        compliance: {
          ...prev.compliance,
          isCalculating: false
        },
        error: e.message || 'Failed to run compliance check'
      }));
    }
  }, [id]);

  // Submit for approval
  const submit = useCallback(async () => {
    if (!id) return;
    
    try {
      const result = await unifiedApi.tools.submitWithFullWorkflow(id);
      
      // Update state with submission result
      setState(prev => ({
        ...prev,
        approval: {
          ...prev.approval,
          request: { id: result.approvalId },
          isTracking: true
        },
        compliance: {
          ...prev.compliance,
          score: result.complianceScore
        }
      }));
      
      return true;
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e.message || 'Submission failed'
      }));
      return false;
    }
  }, [id]);

  // Start approval tracking
  const startApprovalTracking = useCallback(async () => {
    if (!id) return;
    
    try {
      const metrics = await unifiedApi.approvals.getApprovalMetrics(id);
      
      setState(prev => ({
        ...prev,
        approval: {
          ...prev.approval,
          metrics,
          isTracking: true
        }
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e.message || 'Failed to start approval tracking'
      }));
    }
  }, [id]);

  // Load audit trail
  const loadAuditTrail = useCallback(async () => {
    if (!id) return;
    
    try {
      setState(prev => ({
        ...prev,
        auditTrail: { ...prev.auditTrail, isLoading: true, error: null }
      }));
      
      const events = await unifiedApi.audit.getSubmissionAuditTrail(id);
      
      setState(prev => ({
        ...prev,
        auditTrail: { ...prev.auditTrail, events, isLoading: false }
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        auditTrail: {
          ...prev.auditTrail,
          isLoading: false,
          error: e.message || 'Failed to load audit trail'
        }
      }));
    }
  }, [id]);

  // Load governance events
  const loadGovernanceEvents = useCallback(async () => {
    if (!id) return;
    
    try {
      const events = await unifiedApi.governance.getSubmissionGovernanceEvents(id);
      
      setState(prev => ({
        ...prev,
        governance: { ...prev.governance, events }
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e.message || 'Failed to load governance events'
      }));
    }
  }, [id]);

  // Export everything
  const exportEverything = useCallback(async (format: 'csv' | 'pdf' | 'excel' | 'json' = 'pdf') => {
    if (!id) return;
    
    try {
      const result = await unifiedApi.exportEverything({
        submissionId: id,
        format,
        includeDocuments: true,
        includeAuditTrail: true,
        includeCompliance: true,
        includeApproval: true
      });
      
      // Open download URL
      window.open(result.downloadUrl, '_blank');
      
      return result;
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e.message || 'Failed to export data'
      }));
      return null;
    }
  }, [id]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Manual save
  const save = useCallback(async () => {
    if (!id || !state.submission) return;
    
    try {
      setState(prev => ({ ...prev, saving: true }));
      await unifiedApi.tools.saveSubmission(id, state.submission);
      setState(prev => ({ ...prev, lastSaved: new Date(), saving: false }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e.message || 'Save failed',
        saving: false
      }));
    }
  }, [id, state.submission]);

  // Validation and submission readiness
  const canSubmit = useMemo(() => {
    if (!state.submission) return false;
    
    const tool = state.submission.tool;
    const hasRequiredFields = Boolean(
      tool?.name && 
      tool?.vendor && 
      tool?.category
    );
    
    const hasAttestation = state.submission.attest === true;
    
    return hasRequiredFields && hasAttestation;
  }, [state.submission]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!state.submission) return 0;
    
    const sections = [
      state.submission.tool?.name && state.submission.tool?.vendor && state.submission.tool?.category,
      state.submission.model?.type || state.submission.model?.description,
      state.submission.purpose?.description,
      state.submission.privacy?.dataTypes?.length,
      state.submission.evidence?.files?.length,
      state.submission.tech?.hosting,
      state.submission.risk?.level,
      state.submission.vendor?.contact,
      state.submission.approval?.reviewers?.length,
      state.submission.attest,
    ];
    
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  }, [state.submission]);

  return {
    // State
    id,
    ...state,
    
    // Actions
    update,
    save,
    submit,
    clearError,
    uploadDocuments,
    processDocuments,
    runComplianceCheck,
    startApprovalTracking,
    loadAuditTrail,
    loadGovernanceEvents,
    exportEverything,
    
    // Computed
    canSubmit,
    completionPercentage,
  };
}