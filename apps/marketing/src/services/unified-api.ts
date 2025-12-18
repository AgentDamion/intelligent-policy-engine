import { supabase } from '@/integrations/supabase/client';
import { getApiUrl, getWsUrl } from '@/config/api';
import { sampleDataService } from '@/services/sampleDataService';
import { platformIntegrationsApi } from '@/services/platform-integrations-api';

// Document Processing API
export const documentsApi = {
  upload: async (files: FileList, submissionId: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('submissionId', submissionId);

    const response = await fetch(getApiUrl('/api/documents/upload'), {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  process: async (documentId: string) => {
    const response = await fetch(getApiUrl(`/api/documents/${documentId}/process`), {
      method: 'POST'
    });
    return response.json();
  },

  getStatus: async (documentId: string) => {
    const response = await fetch(getApiUrl(`/api/documents/${documentId}/status`));
    return response.json();
  }
};

// Approval Workflow API
export const approvalsApi = {
  start: async (submissionId: string) => {
    const response = await fetch(getApiUrl('/api/approvals/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId })
    });
    return response.json();
  },

  getMetrics: async (submissionId: string) => {
    const response = await fetch(getApiUrl(`/api/approvals/metrics/${submissionId}`));
    return response.json();
  },

  updateStatus: async (approvalId: string, status: string, feedback?: string) => {
    const response = await fetch(getApiUrl(`/api/approvals/${approvalId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feedback })
    });
    return response.json();
  }
};

// Compliance Scoring API
export const complianceApi = {
  calculate: async (submissionId: string) => {
    const response = await fetch(getApiUrl(`/api/compliance/scores/${submissionId}/calculate`), {
      method: 'POST'
    });
    return response.json();
  },

  getScore: async (submissionId: string) => {
    const response = await fetch(getApiUrl(`/api/compliance/scores/${submissionId}`));
    return response.json();
  },

  getRiskAnalysis: async (submissionId: string) => {
    const response = await fetch(getApiUrl(`/api/compliance/risk-analysis/${submissionId}`));
    return response.json();
  }
};

// Audit Trail API
export const auditApi = {
  getEvents: async (submissionId: string) => {
    const response = await fetch(getApiUrl(`/api/audit/submissions/${submissionId}/events`));
    return response.json();
  },

  createEvent: async (submissionId: string, event: any) => {
    const response = await fetch(getApiUrl('/api/audit/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, ...event })
    });
    return response.json();
  }
};

// Live Governance API
export const governanceApi = {
  getLiveMetrics: async () => {
    const response = await fetch(getApiUrl('/api/governance/live-metrics'));
    return response.json();
  },

  getEvents: async (limit: number = 50) => {
    const response = await fetch(getApiUrl(`/api/governance/events?limit=${limit}`));
    return response.json();
  },

  subscribeToEvents: (callback: (event: any) => void) => {
    // WebSocket subscription for live events
    const ws = new WebSocket(getWsUrl('ws/governance'));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
    return () => ws.close();
  }
};

// Reports and Export API
export const reportsApi = {
  generate: async (submissionId: string, format: 'pdf' | 'excel' | 'json' = 'pdf') => {
    const response = await fetch(getApiUrl('/api/reports/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, format })
    });
    return response.json();
  },

  download: async (reportId: string) => {
    const response = await fetch(getApiUrl(`/api/reports/${reportId}/download`));
    return response.blob();
  },

  getHistory: async (submissionId: string) => {
    const response = await fetch(getApiUrl(`/api/reports/history/${submissionId}`));
    return response.json();
  }
};

// Enhanced Tools API that integrates with existing services
export const toolsApi = {
  // Core submission operations
  async createSubmission(data: any) {
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return submission;
  },

  async getSubmission(id: string) {
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return submission;
  },

  // Integrate with existing API methods
  async getPolicies() {
    const { data: policies, error } = await supabase
      .from('policies')
      .select('*');
    return error ? [] : policies;
  },

  async getAgencies() {
    const { data: enterprises, error } = await supabase
      .from('enterprises')
      .select('*')
      .eq('enterprise_type', 'agency');
    return error ? [] : enterprises;
  },

  async getSubmissions() {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*');
    return error ? [] : submissions;
  },

  async getLiveMetrics() {
    const result = await sampleDataService.getLiveMetrics();
    return result.metrics || {};
  },

  async getRecentDecisions(limit: number = 5) {
    return await sampleDataService.getRecentDecisions(limit);
  },

  // Enhanced submission workflow
  createSubmissionWithDocuments: async (files: FileList) => {
    // First create submission
    const submission = await fetch(getApiUrl('/api/submissions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' })
    }).then(res => res.json());

    // Then upload documents
    const documents = await documentsApi.upload(files, submission.id);

    return { submissionId: submission.id, documents };
  },

  submitWithFullWorkflow: async (submissionId: string) => {
    // Start submission
    const submission = await fetch(getApiUrl(`/api/submissions/${submissionId}/submit`), {
      method: 'POST'
    }).then(res => res.json());

    // Start approval workflow
    const approval = await approvalsApi.start(submissionId);

    // Calculate compliance score
    const compliance = await complianceApi.calculate(submissionId);

    // Create audit trail entry
    const auditTrail = await auditApi.createEvent(submissionId, {
      type: 'submission_started',
      timestamp: new Date().toISOString()
    });

    return { submissionId, approvalId: approval.id, complianceScore: compliance.score, auditTrailId: auditTrail.id };
  },

  getSubmissionDashboard: async (submissionId: string) => {
    const [submission, documents, approval, compliance, auditTrail, governance] = await Promise.all([
      fetch(getApiUrl(`/api/submissions/${submissionId}`)).then(res => res.json()),
      documentsApi.getStatus(submissionId),
      approvalsApi.getMetrics(submissionId),
      complianceApi.getScore(submissionId),
      auditApi.getEvents(submissionId),
      governanceApi.getLiveMetrics()
    ]);

    return { submission, documents, approval, compliance, auditTrail, governance };
  }
};

// WebSocket Integration for Real-time Updates
export const websocketApi = {
  subscribeToAllEvents: (callbacks: {
    onGovernanceEvent?: (event: any) => void;
    onApprovalUpdate?: (update: any) => void;
    onComplianceUpdate?: (update: any) => void;
    onProcessingUpdate?: (update: any) => void;
  }) => {
    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to governance events
    if (callbacks.onGovernanceEvent) {
      const unsubscribe = governanceApi.subscribeToEvents(callbacks.onGovernanceEvent);
      unsubscribeFunctions.push(unsubscribe);
    }

    // Subscribe to other event types
    const ws = new WebSocket(getWsUrl('ws/unified'));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'approval_update':
          callbacks.onApprovalUpdate?.(data);
          break;
        case 'compliance_update':
          callbacks.onComplianceUpdate?.(data);
          break;
        case 'processing_update':
          callbacks.onProcessingUpdate?.(data);
          break;
      }
    };

    unsubscribeFunctions.push(() => ws.close());

    // Return unified unsubscribe function
    return () => {
      unsubscribeFunctions.forEach(fn => fn());
    };
  }
};

// Policy Engine API
export const policyEngineApi = {
  async evaluate(event: any, rules: any[]): Promise<any> {
    const { data, error } = await supabase.functions.invoke('policy-evaluate', {
      body: { event, rules }
    });
    if (error) throw error;
    return data;
  }
};

// Compliance Copilot API
export const complianceCopilotApi = {
  async suggest(event: any, verdict: any, rules: any[], cfg?: any): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('copilot-suggest', {
      body: { event, verdict, rules, cfg }
    });
    if (error) throw error;
    return data;
  }
};

// Evidence API
export const evidenceApi = {
  async compile(event: any, verdict: any, extra?: Record<string, string>): Promise<any> {
    const { data, error } = await supabase.functions.invoke('evidence-compile', {
      body: { event, verdict, extra }
    });
    if (error) throw error;
    return data;
  }
};

// Orchestrator API
export const orchestratorApi = {
  async harmonize(rulesA: any[], rulesB: any[], strategy?: 'merge' | 'strict' | 'permissive') {
    const { data, error } = await supabase.functions.invoke('orchestrator-harmonize', {
      body: { rulesA, rulesB, strategy }
    });
    if (error) throw error;
    return data;
  },
  
  async scoreRisk(atoms: any[], options?: { region?: string, toolId?: string, timeWindow?: string }) {
    const { data, error } = await supabase.functions.invoke('orchestrator-score-risk', {
      body: { atoms, ...options }
    });
    if (error) throw error;
    return data;
  }
};

// Unified API Export
export const unifiedApi = {
  documents: documentsApi,
  approvals: approvalsApi,
  compliance: complianceApi,
  audit: auditApi,
  governance: governanceApi,
  reports: reportsApi,
  tools: toolsApi,
  websocket: websocketApi,
  platforms: platformIntegrationsApi,
  policyEngine: policyEngineApi,
  complianceCopilot: complianceCopilotApi,
  evidence: evidenceApi,
  orchestrator: orchestratorApi,
  supabase
};

export default unifiedApi;
