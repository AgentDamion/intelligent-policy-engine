import { get, post, put, del } from './api';

// Types for compliance scoring
export interface ComplianceScore {
  overall: number;
  categories: {
    dataSecurity: number;
    regulatoryCompliance: number;
    aiGovernance: number;
    auditTrail: number;
    riskManagement: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
  trends: {
    dataSecurity: 'up' | 'down' | 'stable';
    regulatoryCompliance: 'up' | 'down' | 'stable';
    aiGovernance: 'up' | 'down' | 'stable';
    auditTrail: 'up' | 'down' | 'stable';
    riskManagement: 'up' | 'down' | 'stable';
  };
}

export interface ComplianceRecommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  regulations: string[];
}

export interface ComplianceHistory {
  id: string;
  timestamp: Date;
  score: number;
  riskLevel: string;
  changes: {
    category: string;
    oldValue: number;
    newValue: number;
    reason: string;
  }[];
}

// Compliance API
export const complianceApi = {
  // Get compliance score for submission
  async getComplianceScore(submissionId: string): Promise<ComplianceScore> {
    return get<ComplianceScore>(`/api/compliance/scores/${submissionId}`);
  },

  // Calculate compliance score
  async calculateComplianceScore(submissionId: string): Promise<ComplianceScore> {
    return post<ComplianceScore>(`/api/compliance/scores/${submissionId}/calculate`, {});
  },

  // Get compliance recommendations
  async getComplianceRecommendations(submissionId: string): Promise<ComplianceRecommendation[]> {
    return get<ComplianceRecommendation[]>(`/api/compliance/recommendations/${submissionId}`);
  },

  // Get compliance history
  async getComplianceHistory(submissionId: string, limit?: number): Promise<ComplianceHistory[]> {
    const query = limit ? `?limit=${limit}` : '';
    return get<ComplianceHistory[]>(`/api/compliance/history/${submissionId}${query}`);
  },

  // Update compliance category score
  async updateCategoryScore(submissionId: string, category: string, score: number, reason: string): Promise<void> {
    return put<void>(`/api/compliance/scores/${submissionId}/categories/${category}`, { score, reason });
  },

  // Get regulatory compliance status
  async getRegulatoryCompliance(submissionId: string): Promise<{
    fda21cfr11: { compliant: boolean; score: number; issues: string[] };
    hipaa: { compliant: boolean; score: number; issues: string[] };
    gdpr: { compliant: boolean; score: number; issues: string[] };
    soc2: { compliant: boolean; score: number; issues: string[] };
  }> {
    return get<{
      fda21cfr11: { compliant: boolean; score: number; issues: string[] };
      hipaa: { compliant: boolean; score: number; issues: string[] };
      gdpr: { compliant: boolean; score: number; issues: string[] };
      soc2: { compliant: boolean; score: number; issues: string[] };
    }>(`/api/compliance/regulatory/${submissionId}`);
  },

  // Run compliance audit
  async runComplianceAudit(submissionId: string): Promise<{
    auditId: string;
    status: 'running' | 'completed' | 'failed';
    results?: ComplianceScore;
  }> {
    return post<{
      auditId: string;
      status: 'running' | 'completed' | 'failed';
      results?: ComplianceScore;
    }>(`/api/compliance/audit/${submissionId}`, {});
  },

  // Get audit status
  async getAuditStatus(auditId: string): Promise<{
    status: 'running' | 'completed' | 'failed';
    progress: number;
    results?: ComplianceScore;
    error?: string;
  }> {
    return get<{
      status: 'running' | 'completed' | 'failed';
      progress: number;
      results?: ComplianceScore;
      error?: string;
    }>(`/api/compliance/audit/${auditId}/status`);
  }
};

// Integration with existing tools API
export const integrateComplianceWithTools = {
  // Get compliance score for tool submission
  async getToolComplianceScore(submissionId: string): Promise<ComplianceScore> {
    return get<ComplianceScore>(`/api/tools/submissions/${submissionId}/compliance-score`);
  },

  // Run compliance check as part of precheck
  async runCompliancePrecheck(submissionId: string): Promise<{
    complianceScore: ComplianceScore;
    recommendations: ComplianceRecommendation[];
    regulatoryStatus: any;
  }> {
    return post<{
      complianceScore: ComplianceScore;
      recommendations: ComplianceRecommendation[];
      regulatoryStatus: any;
    }>(`/api/tools/submissions/${submissionId}/compliance-precheck`, {});
  },

  // Update tool submission with compliance data
  async updateSubmissionWithCompliance(submissionId: string, complianceData: Partial<ComplianceScore>): Promise<void> {
    return put<void>(`/api/tools/submissions/${submissionId}/compliance`, complianceData);
  }
};