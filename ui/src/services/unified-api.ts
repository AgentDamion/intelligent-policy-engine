/**
 * Unified API Service
 * 
 * Integrates all new document processing, approval workflow, compliance, 
 * audit trail, live governance, and reporting services with the existing
 * Lovable frontend infrastructure.
 */

import { get, post, put, del } from './api';
import webSocketService from './websocket';

// Import all the new API services
import { documentProcessingApi } from './document-processing.api';
import { approvalWorkflowApi } from './approval-workflow.api';
import { complianceApi } from './compliance.api';
import { auditTrailApi } from './audit-trail.api';
import { liveGovernanceApi } from './live-governance.api';
import { reportsApi } from './reports.api';

// Import existing services
import { 
  createSubmission, 
  fetchSubmission, 
  saveSubmission, 
  submitSubmission, 
  precheck, 
  policyHints,
  trackSubmissionEvent
} from './tools.api';

// Re-export all services for easy access
export {
  documentProcessingApi,
  approvalWorkflowApi,
  complianceApi,
  auditTrailApi,
  liveGovernanceApi,
  reportsApi
};

// Unified API that combines all services
export const unifiedApi = {
  // Document Processing
  documents: documentProcessingApi,
  
  // Approval Workflow
  approvals: approvalWorkflowApi,
  
  // Compliance
  compliance: complianceApi,
  
  // Audit Trail
  audit: auditTrailApi,
  
  // Live Governance
  governance: liveGovernanceApi,
  
  // Reports
  reports: reportsApi,
  
  // Existing Tools API (enhanced)
  tools: {
    // Existing methods
    createSubmission,
    fetchSubmission,
    saveSubmission,
    submitSubmission,
    precheck,
    policyHints,
    trackSubmissionEvent,
    
    // Enhanced methods that integrate with new services
    async createSubmissionWithDocuments(files: File[]): Promise<{
      submissionId: string;
      documents: any[];
    }> {
      // Upload documents first
      const documents = await Promise.all(
        files.map(file => documentProcessingApi.uploadDocument(file))
      );

      // Create submission with document references
      const submissionData = {
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          status: doc.status
        }))
      };

      return post<{
        submissionId: string;
        documents: any[];
      }>('/api/tools/submissions/with-documents', submissionData);
    },

    async submitWithFullWorkflow(submissionId: string): Promise<{
      submissionId: string;
      approvalId: string;
      complianceScore: any;
      auditTrailId: string;
    }> {
      // Submit the tool submission
      await submitSubmission(submissionId);
      
      // Create approval request
      const approval = await approvalWorkflowApi.createApprovalFromSubmission(submissionId);
      
      // Run compliance check
      const complianceScore = await complianceApi.getComplianceScore(submissionId);
      
      // Log audit event
      await auditTrailApi.createAuditEvent({
        eventType: 'approval',
        actor: 'System',
        actorRole: 'System',
        action: 'Submission Submitted',
        description: `Tool submission ${submissionId} submitted for approval`,
        status: 'success',
        metadata: {
          submissionId,
          approvalId: approval.id,
          complianceScore: complianceScore.overall
        }
      });

      return {
        submissionId,
        approvalId: approval.id,
        complianceScore,
        auditTrailId: 'audit-trail-' + submissionId
      };
    },

    async getSubmissionDashboard(submissionId: string): Promise<{
      submission: any;
      documents: any[];
      approval: any;
      compliance: any;
      auditTrail: any[];
      governance: any[];
    }> {
      const [
        submission,
        approval,
        compliance,
        auditTrail,
        governance
      ] = await Promise.all([
        fetchSubmission(submissionId),
        approvalWorkflowApi.getSubmissionApprovalStatus(submissionId),
        complianceApi.getComplianceScore(submissionId),
        auditTrailApi.getSubmissionAuditTrail(submissionId),
        liveGovernanceApi.getSubmissionGovernanceEvents(submissionId)
      ]);

      // Get documents if they exist
      const documents = submission.documents || [];

      return {
        submission,
        documents,
        approval,
        compliance,
        auditTrail,
        governance
      };
    }
  },

  // WebSocket integration
  websocket: {
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    isConnected: () => webSocketService.isConnected(),
    
    // Subscribe to all live events
    subscribeToAllEvents(callbacks: {
      onGovernanceEvent?: (event: any) => void;
      onApprovalUpdate?: (update: any) => void;
      onComplianceUpdate?: (update: any) => void;
      onProcessingUpdate?: (update: any) => void;
    }): () => void {
      const unsubscribers: (() => void)[] = [];

      if (callbacks.onGovernanceEvent) {
        webSocketService.subscribeToGovernance();
        unsubscribers.push(
          webSocketService.on('governance_event', callbacks.onGovernanceEvent)
        );
      }

      if (callbacks.onApprovalUpdate) {
        unsubscribers.push(
          webSocketService.on('approval_update', callbacks.onApprovalUpdate)
        );
      }

      if (callbacks.onComplianceUpdate) {
        unsubscribers.push(
          webSocketService.on('compliance_update', callbacks.onComplianceUpdate)
        );
      }

      if (callbacks.onProcessingUpdate) {
        unsubscribers.push(
          webSocketService.on('processing_update', callbacks.onProcessingUpdate)
        );
      }

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }
  },

  // Dashboard data aggregation
  async getDashboardData(): Promise<{
    metrics: any;
    recentActivity: any[];
    complianceStatus: any;
    approvalQueue: any[];
    liveEvents: any[];
  }> {
    const [
      metrics,
      recentActivity,
      complianceStatus,
      approvalQueue,
      liveEvents
    ] = await Promise.all([
      liveGovernanceApi.getLiveMetrics(),
      auditTrailApi.getAuditEvents({}, 10),
      complianceApi.getComplianceScore('dashboard'),
      approvalWorkflowApi.getApprovalRequests({ status: 'pending', limit: 10 }),
      liveGovernanceApi.getRecentEvents(20)
    ]);

    return {
      metrics,
      recentActivity,
      complianceStatus,
      approvalQueue,
      liveEvents
    };
  },

  // Export everything
  async exportEverything(config: {
    submissionId?: string;
    format: 'csv' | 'pdf' | 'excel' | 'json';
    includeDocuments?: boolean;
    includeAuditTrail?: boolean;
    includeCompliance?: boolean;
    includeApproval?: boolean;
  }): Promise<{
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
  }> {
    return post<{
      exportId: string;
      downloadUrl: string;
      expiresAt: Date;
    }>('/api/export/everything', config);
  }
};

// Default export for easy importing
export default unifiedApi;

// Export individual services for specific use cases
export {
  documentProcessingApi as documents,
  approvalWorkflowApi as approvals,
  complianceApi as compliance,
  auditTrailApi as audit,
  liveGovernanceApi as governance,
  reportsApi as reports
};