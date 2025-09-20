import { get, post, put, del } from './api';

// Types for approval workflow
export interface ApprovalRequest {
  id: string;
  title: string;
  submitter: string;
  submitterRole: string;
  department: string;
  toolName: string;
  vendor: string;
  category: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: Date;
  currentStage: string;
  timeInStage: number; // hours
  expectedCompletion: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number;
  documents: number;
  reviewers: string[];
  lastActivity: Date;
}

export interface ApprovalMetrics {
  currentTime: number; // in hours
  targetTime: number; // in hours (4 days = 96 hours)
  traditionalTime: number; // in hours (47 days = 1128 hours)
  accelerationFactor: number;
  timeSaved: number; // in hours
  stages: ApprovalStage[];
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

export interface ApprovalStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in hours
  expectedDuration: number; // in hours
  assignee?: string;
  description: string;
}

export interface WorkflowMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedToday: number;
  averageProcessingTime: number; // hours
  accelerationFactor: number;
  complianceRate: number;
  timeSaved: number; // hours
}

// Approval Workflow API
export const approvalWorkflowApi = {
  // Get all approval requests
  async getApprovalRequests(filters?: {
    status?: string;
    priority?: string;
    department?: string;
    riskLevel?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApprovalRequest[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const query = queryParams.toString();
    return get<ApprovalRequest[]>(`/api/approvals${query ? `?${query}` : ''}`);
  },

  // Get single approval request
  async getApprovalRequest(requestId: string): Promise<ApprovalRequest> {
    return get<ApprovalRequest>(`/api/approvals/${requestId}`);
  },

  // Update approval request status
  async updateApprovalStatus(requestId: string, status: ApprovalRequest['status'], comment?: string): Promise<void> {
    return put<void>(`/api/approvals/${requestId}/status`, { status, comment });
  },

  // Assign reviewers
  async assignReviewers(requestId: string, reviewers: string[]): Promise<void> {
    return put<void>(`/api/approvals/${requestId}/reviewers`, { reviewers });
  },

  // Get approval metrics for a submission
  async getApprovalMetrics(submissionId: string): Promise<ApprovalMetrics> {
    return get<ApprovalMetrics>(`/api/approvals/metrics/${submissionId}`);
  },

  // Get workflow metrics
  async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    return get<WorkflowMetrics>('/api/approvals/workflow/metrics');
  },

  // Bulk approve/reject
  async bulkUpdateApprovals(requestIds: string[], action: 'approve' | 'reject', comment?: string): Promise<void> {
    return post<void>('/api/approvals/bulk-update', { requestIds, action, comment });
  },

  // Get approval timeline
  async getApprovalTimeline(requestId: string): Promise<ApprovalStage[]> {
    return get<ApprovalStage[]>(`/api/approvals/${requestId}/timeline`);
  },

  // Update stage progress
  async updateStageProgress(requestId: string, stageId: string, status: ApprovalStage['status']): Promise<void> {
    return put<void>(`/api/approvals/${requestId}/stages/${stageId}`, { status });
  }
};

// Integration with existing tools API
export const integrateApprovalWithTools = {
  // Create approval request from tool submission
  async createApprovalFromSubmission(submissionId: string): Promise<ApprovalRequest> {
    return post<ApprovalRequest>(`/api/tools/submissions/${submissionId}/create-approval`, {});
  },

  // Get approval status for submission
  async getSubmissionApprovalStatus(submissionId: string): Promise<{
    approvalId?: string;
    status: ApprovalRequest['status'];
    metrics?: ApprovalMetrics;
  }> {
    return get<{
      approvalId?: string;
      status: ApprovalRequest['status'];
      metrics?: ApprovalMetrics;
    }>(`/api/tools/submissions/${submissionId}/approval-status`);
  },

  // Link approval to existing submission
  async linkApprovalToSubmission(approvalId: string, submissionId: string): Promise<void> {
    return post<void>(`/api/approvals/${approvalId}/link-submission`, { submissionId });
  }
};