import { get, post, put, del } from './api';

// Types for audit trail
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'document_upload' | 'processing_start' | 'ai_analysis' | 'compliance_check' | 'approval' | 'rejection' | 'error';
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  status: 'success' | 'warning' | 'error';
  metadata: {
    documentId?: string;
    submissionId?: string;
    processingTime?: number;
    confidence?: number;
    riskLevel?: string;
    complianceScore?: number;
    [key: string]: any;
  };
  beforeState?: any;
  afterState?: any;
  changes?: AuditChange[];
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

export interface AuditFilters {
  eventType?: string;
  status?: string;
  actor?: string;
  dateRange?: string;
  submissionId?: string;
  documentId?: string;
}

export interface AuditExport {
  format: 'csv' | 'json' | 'pdf';
  filters?: AuditFilters;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Audit Trail API
export const auditTrailApi = {
  // Get audit events
  async getAuditEvents(filters?: AuditFilters, limit?: number, offset?: number): Promise<AuditEvent[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    
    const query = queryParams.toString();
    return get<AuditEvent[]>(`/api/audit/events${query ? `?${query}` : ''}`);
  },

  // Get single audit event
  async getAuditEvent(eventId: string): Promise<AuditEvent> {
    return get<AuditEvent>(`/api/audit/events/${eventId}`);
  },

  // Get audit events for submission
  async getSubmissionAuditTrail(submissionId: string): Promise<AuditEvent[]> {
    return get<AuditEvent[]>(`/api/audit/submissions/${submissionId}/events`);
  },

  // Get audit events for document
  async getDocumentAuditTrail(documentId: string): Promise<AuditEvent[]> {
    return get<AuditEvent[]>(`/api/audit/documents/${documentId}/events`);
  },

  // Create audit event (for manual logging)
  async createAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
    return post<AuditEvent>('/api/audit/events', event);
  },

  // Export audit trail
  async exportAuditTrail(exportConfig: AuditExport): Promise<{
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
  }> {
    return post<{
      exportId: string;
      downloadUrl: string;
      expiresAt: Date;
    }>('/api/audit/export', exportConfig);
  },

  // Get export status
  async getExportStatus(exportId: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    error?: string;
  }> {
    return get<{
      status: 'processing' | 'completed' | 'failed';
      downloadUrl?: string;
      error?: string;
    }>(`/api/audit/export/${exportId}/status`);
  },

  // Get audit statistics
  async getAuditStatistics(filters?: AuditFilters): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    eventsByActor: Record<string, number>;
    averageProcessingTime: number;
    complianceRate: number;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const query = queryParams.toString();
    return get<{
      totalEvents: number;
      eventsByType: Record<string, number>;
      eventsByStatus: Record<string, number>;
      eventsByActor: Record<string, number>;
      averageProcessingTime: number;
      complianceRate: number;
    }>(`/api/audit/statistics${query ? `?${query}` : ''}`);
  }
};

// Integration with existing tools API
export const integrateAuditWithTools = {
  // Get audit trail for tool submission
  async getToolSubmissionAuditTrail(submissionId: string): Promise<AuditEvent[]> {
    return get<AuditEvent[]>(`/api/tools/submissions/${submissionId}/audit-trail`);
  },

  // Log tool submission event
  async logToolSubmissionEvent(submissionId: string, event: Omit<AuditEvent, 'id' | 'timestamp' | 'metadata'> & {
    metadata?: {
      submissionId: string;
      [key: string]: any;
    };
  }): Promise<AuditEvent> {
    return post<AuditEvent>(`/api/tools/submissions/${submissionId}/audit-events`, {
      ...event,
      metadata: {
        submissionId,
        ...event.metadata
      }
    });
  },

  // Export tool submission audit trail
  async exportToolSubmissionAuditTrail(submissionId: string, format: 'csv' | 'json' | 'pdf'): Promise<{
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
  }> {
    return post<{
      exportId: string;
      downloadUrl: string;
      expiresAt: Date;
    }>(`/api/tools/submissions/${submissionId}/audit-export`, { format });
  }
};