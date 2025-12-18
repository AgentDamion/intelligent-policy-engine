export interface Client {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  policies: number;
  lastUpdate?: string;
  complianceScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface AgentActivityType {
  id: string;
  agent: string;
  action: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'running';
  details: {
    status?: string;
    description?: string;
  };
}

export interface DashboardStats {
  totalClients: number;
  activeCompliance: number;
  pendingReviews: number;
  conflictsDetected: number;
}