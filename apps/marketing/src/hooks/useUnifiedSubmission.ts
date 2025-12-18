import { useState, useEffect, useCallback } from 'react';
import { unifiedApi } from '@/services/unified-api';
import { useToast } from '@/hooks/use-toast';

interface SubmissionData {
  id: string;
  status: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentData {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
}

interface ApprovalData {
  id: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  metrics?: {
    avgApprovalTime: string;
    accelerationFactor: number;
    timeSaved: string;
  };
}

interface ComplianceData {
  score: number;
  band: string;
  riskLevel: 'low' | 'medium' | 'high';
  violations: any[];
}

interface AuditTrailData {
  events: Array<{
    id: string;
    type: string;
    timestamp: string;
    details: any;
  }>;
}

interface GovernanceData {
  liveMetrics: {
    activeDecisions: number;
    avgResponseTime: string;
    complianceRate: number;
  };
  events: any[];
}

export const useUnifiedSubmission = (submissionId?: string) => {
  const { toast } = useToast();
  
  // Core submission state
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document processing state
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Approval workflow state
  const [approval, setApproval] = useState<ApprovalData | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Compliance state
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Audit trail state
  const [auditTrail, setAuditTrail] = useState<AuditTrailData | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Governance state
  const [governance, setGovernance] = useState<GovernanceData | null>(null);
  const [governanceLoading, setGovernanceLoading] = useState(false);

  // Load submission data
  const loadSubmission = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await unifiedApi.tools.getSubmissionDashboard(id);
      
      setSubmission(dashboardData.submission);
      setDocuments(dashboardData.documents || []);
      setApproval(dashboardData.approval);
      setCompliance(dashboardData.compliance);
      setAuditTrail(dashboardData.auditTrail);
      setGovernance(dashboardData.governance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submission';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Document operations
  const uploadDocuments = useCallback(async (files: FileList) => {
    if (!submissionId) return;

    setDocumentsLoading(true);
    try {
      const result = await unifiedApi.documents.upload(files, submissionId);
      setDocuments(prev => [...prev, ...result.documents]);
      
      toast({
        title: "Success",
        description: `${files.length} document(s) uploaded successfully`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive"
      });
    } finally {
      setDocumentsLoading(false);
    }
  }, [submissionId, toast]);

  const processDocument = useCallback(async (documentId: string) => {
    try {
      const response = await unifiedApi.documents.process(documentId);
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, processingStatus: 'processing' }
            : doc
        )
      );
      
      return response;
    } catch (error) {
      console.error('Failed to process document:', error);
      throw error;
    }
  }, []);

  const processDocuments = useCallback(async () => {
    if (!submissionId) return;

    setDocumentsLoading(true);
    try {
      const processPromises = documents.map(doc =>
        unifiedApi.documents.process(doc.id)
      );
      await Promise.all(processPromises);
      
      // Reload documents to get updated status
      if (submissionId) {
        const updatedDocs = await unifiedApi.documents.getStatus(submissionId);
        setDocuments(updatedDocs);
      }

      toast({
        title: "Success",
        description: "Documents processed successfully"
      });
    } catch (err) {
      toast({
        title: "Error", 
        description: "Failed to process documents",
        variant: "destructive"
      });
    } finally {
      setDocumentsLoading(false);
    }
  }, [submissionId, documents, toast]);

  // Approval operations
  const startApprovalTracking = useCallback(async () => {
    if (!submissionId) return;

    setApprovalLoading(true);
    try {
      const result = await unifiedApi.approvals.start(submissionId);
      setApproval(result);
      
      toast({
        title: "Success",
        description: "Approval tracking started"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start approval tracking",
        variant: "destructive"
      });
    } finally {
      setApprovalLoading(false);
    }
  }, [submissionId, toast]);

  // Compliance operations
  const runComplianceCheck = useCallback(async () => {
    if (!submissionId) return;

    setComplianceLoading(true);
    try {
      const result = await unifiedApi.compliance.calculate(submissionId);
      setCompliance(result);
      
      toast({
        title: "Success",
        description: `Compliance score: ${result.score}% (${result.band})`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to calculate compliance score",
        variant: "destructive"
      });
    } finally {
      setComplianceLoading(false);
    }
  }, [submissionId, toast]);

  // Audit trail operations
  const loadAuditTrail = useCallback(async () => {
    if (!submissionId) return;

    setAuditLoading(true);
    try {
      const events = await unifiedApi.audit.getEvents(submissionId);
      setAuditTrail({ events });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load audit trail",
        variant: "destructive"
      });
    } finally {
      setAuditLoading(false);
    }
  }, [submissionId, toast]);

  // Governance operations
  const loadGovernanceEvents = useCallback(async () => {
    setGovernanceLoading(true);
    try {
      const [metrics, events] = await Promise.all([
        unifiedApi.governance.getLiveMetrics(),
        unifiedApi.governance.getEvents()
      ]);
      setGovernance({ liveMetrics: metrics, events });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load governance data",
        variant: "destructive"
      });
    } finally {
      setGovernanceLoading(false);
    }
  }, [toast]);

  // Export operations
  const exportEverything = useCallback(async (format: 'pdf' | 'excel' | 'json' = 'pdf') => {
    if (!submissionId) return;

    try {
      const result = await unifiedApi.reports.generate(submissionId, format);
      const blob = await unifiedApi.reports.download(result.reportId);
      
      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission-${submissionId}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Report exported as ${format.toUpperCase()}`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  }, [submissionId, toast]);

  // Existing submission operations (backward compatibility)
  const update = useCallback(async (data: Partial<SubmissionData>) => {
    if (!submissionId) return;

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const updatedSubmission = await response.json();
      setSubmission(updatedSubmission);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update submission",
        variant: "destructive"
      });
    }
  }, [submissionId, toast]);

  const save = useCallback(async () => {
    if (!submission) return;
    await update(submission);
  }, [submission, update]);

  const submit = useCallback(async () => {
    if (!submissionId) return;

    try {
      const result = await unifiedApi.tools.submitWithFullWorkflow(submissionId);
      
      // Update all states with new data
      setApproval({ id: result.approvalId, status: 'pending' });
      setCompliance({ score: result.complianceScore, band: '', riskLevel: 'low', violations: [] });
      
      toast({
        title: "Success",
        description: "Submission completed successfully"
      });
      
      return result;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit",
        variant: "destructive"
      });
      throw err;
    }
  }, [submissionId, toast]);

  // Computed properties
  const canSubmit = documents.length > 0 && documents.every(doc => doc.status === 'completed');
  const completionPercentage = documents.length === 0 ? 0 : 
    (documents.filter(doc => doc.status === 'completed').length / documents.length) * 100;

  // Load data when submissionId changes
  useEffect(() => {
    if (submissionId) {
      loadSubmission(submissionId);
    }
  }, [submissionId, loadSubmission]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!submissionId) return;

    const unsubscribe = unifiedApi.websocket.subscribeToAllEvents({
      onApprovalUpdate: (update) => {
        if (update.submissionId === submissionId) {
          setApproval(prev => ({ ...prev, ...update }));
        }
      },
      onComplianceUpdate: (update) => {
        if (update.submissionId === submissionId) {
          setCompliance(prev => ({ ...prev, ...update }));
        }
      },
      onProcessingUpdate: (update) => {
        if (update.submissionId === submissionId) {
          setDocuments(prev => 
            prev.map(doc => doc.id === update.documentId ? { ...doc, ...update } : doc)
          );
        }
      },
      onGovernanceEvent: (event) => {
        setGovernance(prev => prev ? {
          ...prev,
          events: [event, ...prev.events.slice(0, 49)]
        } : null);
      }
    });

    return unsubscribe;
  }, [submissionId]);

  return {
    // Core submission data
    submission,
    loading,
    error,

    // Document processing
    documents,
    documentsLoading,
    uploadDocuments,
    processDocuments,

    // Approval workflow
    approval,
    approvalLoading,
    startApprovalTracking,

    // Compliance
    compliance,
    complianceLoading,
    runComplianceCheck,

    // Audit trail
    auditTrail,
    auditLoading,
    loadAuditTrail,

    // Live governance
    governance,
    governanceLoading,
    loadGovernanceEvents,

    // Export
    exportEverything,

    // Existing functionality (backward compatibility)
    update,
    save,
    submit,
    canSubmit,
    completionPercentage,

    // Utility functions
    reload: () => submissionId && loadSubmission(submissionId)
  };
};
