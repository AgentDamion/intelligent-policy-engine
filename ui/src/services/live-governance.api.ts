import { get, post, put, del } from './api';

// Types for live governance
export interface GovernanceEvent {
  id: string;
  timestamp: Date;
  type: 'approval' | 'rejection' | 'processing' | 'compliance' | 'error' | 'milestone';
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  status: 'success' | 'warning' | 'error' | 'info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: {
    submissionId?: string;
    documentId?: string;
    processingTime?: number;
    confidence?: number;
    riskLevel?: string;
    complianceScore?: number;
    accelerationFactor?: number;
    timeSaved?: number;
    [key: string]: any;
  };
  impact: {
    approvalsAccelerated: number;
    timeSaved: number;
    complianceRate: number;
    riskReduction: number;
  };
}

export interface LiveMetrics {
  totalEvents: number;
  approvalsToday: number;
  timeSaved: number;
  complianceRate: number;
  accelerationFactor: number;
  activeRequests: number;
  processingQueue: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface GovernanceFilters {
  type?: string;
  status?: string;
  priority?: string;
  actor?: string;
  dateRange?: string;
}

// Live Governance API
export const liveGovernanceApi = {
  // Get live governance events
  async getGovernanceEvents(filters?: GovernanceFilters, limit?: number): Promise<GovernanceEvent[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    if (limit) queryParams.append('limit', limit.toString());
    
    const query = queryParams.toString();
    return get<GovernanceEvent[]>(`/api/governance/events${query ? `?${query}` : ''}`);
  },

  // Get live metrics
  async getLiveMetrics(): Promise<LiveMetrics> {
    return get<LiveMetrics>('/api/governance/live-metrics');
  },

  // Get recent events
  async getRecentEvents(limit: number = 50): Promise<GovernanceEvent[]> {
    return get<GovernanceEvent[]>(`/api/governance/recent-events?limit=${limit}`);
  },

  // Subscribe to live events (WebSocket)
  subscribeToLiveEvents(callback: (event: GovernanceEvent) => void): () => void {
    // Import WebSocket service
    const webSocketService = require('./websocket').default;
    
    // Subscribe to governance events
    webSocketService.subscribeToGovernance();
    
    // Listen for events
    const unsubscribe = webSocketService.on('governance_event', callback);
    
    return unsubscribe;
  },

  // Get governance statistics
  async getGovernanceStatistics(dateRange?: string): Promise<{
    totalApprovals: number;
    averageProcessingTime: number;
    accelerationFactor: number;
    complianceRate: number;
    timeSaved: number;
    riskReduction: number;
  }> {
    const query = dateRange ? `?dateRange=${dateRange}` : '';
    return get<{
      totalApprovals: number;
      averageProcessingTime: number;
      accelerationFactor: number;
      complianceRate: number;
      timeSaved: number;
      riskReduction: number;
    }>(`/api/governance/statistics${query}`);
  },

  // Get impact metrics
  async getImpactMetrics(): Promise<{
    approvalsAccelerated: number;
    timeSaved: number;
    valueUnlocked: number;
    riskMitigated: number;
    complianceImprovement: number;
  }> {
    return get<{
      approvalsAccelerated: number;
      timeSaved: number;
      valueUnlocked: number;
      riskMitigated: number;
      complianceImprovement: number;
    }>('/api/governance/impact-metrics');
  },

  // Create governance event (for manual logging)
  async createGovernanceEvent(event: Omit<GovernanceEvent, 'id' | 'timestamp'>): Promise<GovernanceEvent> {
    return post<GovernanceEvent>('/api/governance/events', event);
  },

  // Get event details
  async getEventDetails(eventId: string): Promise<GovernanceEvent> {
    return get<GovernanceEvent>(`/api/governance/events/${eventId}`);
  }
};

// Integration with existing tools API
export const integrateGovernanceWithTools = {
  // Get governance events for submission
  async getSubmissionGovernanceEvents(submissionId: string): Promise<GovernanceEvent[]> {
    return get<GovernanceEvent[]>(`/api/tools/submissions/${submissionId}/governance-events`);
  },

  // Log governance event for submission
  async logSubmissionGovernanceEvent(submissionId: string, event: Omit<GovernanceEvent, 'id' | 'timestamp' | 'metadata'> & {
    metadata?: {
      submissionId: string;
      [key: string]: any;
    };
  }): Promise<GovernanceEvent> {
    return post<GovernanceEvent>(`/api/tools/submissions/${submissionId}/governance-events`, {
      ...event,
      metadata: {
        submissionId,
        ...event.metadata
      }
    });
  },

  // Get submission impact metrics
  async getSubmissionImpactMetrics(submissionId: string): Promise<{
    timeSaved: number;
    accelerationFactor: number;
    complianceImprovement: number;
    riskReduction: number;
  }> {
    return get<{
      timeSaved: number;
      accelerationFactor: number;
      complianceImprovement: number;
      riskReduction: number;
    }>(`/api/tools/submissions/${submissionId}/impact-metrics`);
  }
};