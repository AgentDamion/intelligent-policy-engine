import { get, post, put, del } from './api';

// Types for reports
export interface ReportConfig {
  type: 'compliance' | 'approval' | 'processing' | 'audit' | 'summary';
  format: 'csv' | 'pdf' | 'excel' | 'json';
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  filters: {
    status?: string[];
    department?: string[];
    riskLevel?: string[];
    actor?: string[];
    submissionId?: string;
  };
  includeCharts: boolean;
  includeDetails: boolean;
}

export interface ReportExport {
  id: string;
  name: string;
  type: string;
  format: string;
  createdAt: Date;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  fileSize?: number;
  error?: string;
}

export interface ReportData {
  compliance?: {
    overallScore: number;
    categoryScores: Record<string, number>;
    riskLevel: string;
    recommendations: string[];
    trends: Record<string, 'up' | 'down' | 'stable'>;
  };
  approval?: {
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    averageProcessingTime: number;
    accelerationFactor: number;
    timeSaved: number;
    complianceRate: number;
  };
  processing?: {
    totalDocuments: number;
    successRate: number;
    averageConfidence: number;
    processingMethods: Record<string, number>;
    averageProcessingTime: number;
    errorRate: number;
  };
  audit?: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    averageProcessingTime: number;
    complianceRate: number;
  };
  summary?: {
    totalApprovals: number;
    medianTime: number;
    parsingSuccess: number;
    valueUnlocked: number;
    accelerationFactor: number;
    complianceRate: number;
  };
}

// Reports API
export const reportsApi = {
  // Generate report
  async generateReport(config: ReportConfig): Promise<ReportExport> {
    return post<ReportExport>('/api/reports/generate', config);
  },

  // Get report status
  async getReportStatus(reportId: string): Promise<ReportExport> {
    return get<ReportExport>(`/api/reports/${reportId}/status`);
  },

  // Download report
  async downloadReport(reportId: string): Promise<Blob> {
    const response = await fetch(`/api/reports/${reportId}/download`);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    return response.blob();
  },

  // Get recent exports
  async getRecentExports(limit: number = 10): Promise<ReportExport[]> {
    return get<ReportExport[]>(`/api/reports/recent?limit=${limit}`);
  },

  // Delete report
  async deleteReport(reportId: string): Promise<void> {
    return del<void>(`/api/reports/${reportId}`);
  },

  // Get report data (preview)
  async getReportData(config: Omit<ReportConfig, 'format'>): Promise<ReportData> {
    return post<ReportData>('/api/reports/data', config);
  },

  // Get report templates
  async getReportTemplates(): Promise<{
    id: string;
    name: string;
    description: string;
    type: ReportConfig['type'];
    defaultConfig: Partial<ReportConfig>;
  }[]> {
    return get<{
      id: string;
      name: string;
      description: string;
      type: ReportConfig['type'];
      defaultConfig: Partial<ReportConfig>;
    }[]>('/api/reports/templates');
  },

  // Schedule report
  async scheduleReport(config: ReportConfig, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    recipients: string[];
  }): Promise<{
    scheduleId: string;
    nextRun: Date;
  }> {
    return post<{
      scheduleId: string;
      nextRun: Date;
    }>('/api/reports/schedule', { config, schedule });
  },

  // Get scheduled reports
  async getScheduledReports(): Promise<{
    id: string;
    name: string;
    config: ReportConfig;
    schedule: any;
    nextRun: Date;
    status: 'active' | 'paused' | 'failed';
  }[]> {
    return get<{
      id: string;
      name: string;
      config: ReportConfig;
      schedule: any;
      nextRun: Date;
      status: 'active' | 'paused' | 'failed';
    }[]>('/api/reports/scheduled');
  }
};

// Integration with existing tools API
export const integrateReportsWithTools = {
  // Generate report for specific submission
  async generateSubmissionReport(submissionId: string, config: Omit<ReportConfig, 'filters'> & {
    filters?: ReportConfig['filters'] & { submissionId: string };
  }): Promise<ReportExport> {
    return post<ReportExport>(`/api/tools/submissions/${submissionId}/reports`, {
      ...config,
      filters: {
        ...config.filters,
        submissionId
      }
    });
  },

  // Get submission report data
  async getSubmissionReportData(submissionId: string): Promise<{
    compliance: ReportData['compliance'];
    approval: ReportData['approval'];
    processing: ReportData['processing'];
    audit: ReportData['audit'];
  }> {
    return get<{
      compliance: ReportData['compliance'];
      approval: ReportData['approval'];
      processing: ReportData['processing'];
      audit: ReportData['audit'];
    }>(`/api/tools/submissions/${submissionId}/report-data`);
  },

  // Get submission reports
  async getSubmissionReports(submissionId: string): Promise<ReportExport[]> {
    return get<ReportExport[]>(`/api/tools/submissions/${submissionId}/reports`);
  }
};