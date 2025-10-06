// Platform Integration Service
// Frontend service for platform management

export type PlatformType = 'veeva' | 'sharepoint' | 'custom';
export type SyncType = 'upload' | 'metadata_update' | 'test';

export type PlatformConfig = {
  id: string;
  name: string;
  platform_type: PlatformType;
  status: 'active' | 'inactive' | 'error';
  sync_settings: {
    auto_sync?: boolean;
    sync_on_approval?: boolean;
    sync_on_submission?: boolean;
  };
  last_sync_at?: string;
  created_at: string;
};

export type IntegrationLog = {
  id: string;
  platform_config_id: string;
  submission_id?: string;
  sync_type: SyncType;
  status: 'success' | 'failed' | 'pending';
  file_name?: string;
  external_id?: string;
  error_message?: string;
  created_at: string;
};

export type PlatformHealth = {
  id: string;
  name: string;
  platform_type: PlatformType;
  status: string;
  filesThisMonth: number;
  successRate: number;
  lastError?: string;
  last_sync_at?: string;
};

export type SyncJob = {
  submissionId: string;
  platformIds: string[];
  syncType?: SyncType;
  metadata?: Record<string, any>;
};

export type LogFilters = {
  from?: string;
  to?: string;
  platform?: string;
  status?: string;
  limit?: number;
};

// API client using your existing pattern
class PlatformApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Platform Configurations
  async listConfigs(enterpriseId: string) {
    return this.request(`/api/platform-integrations/configs`, {
      headers: { 'x-enterprise-id': enterpriseId },
    });
  }

  async createConfig(enterpriseId: string, config: Partial<PlatformConfig> & { auth_config: any }) {
    return this.request(`/api/platform-integrations/configs`, {
      method: 'POST',
      headers: { 'x-enterprise-id': enterpriseId },
      body: JSON.stringify(config),
    });
  }

  async updateConfig(enterpriseId: string, id: string, updates: Partial<PlatformConfig>) {
    return this.request(`/api/platform-integrations/configs/${id}`, {
      method: 'PUT',
      headers: { 'x-enterprise-id': enterpriseId },
      body: JSON.stringify(updates),
    });
  }

  async deleteConfig(enterpriseId: string, id: string) {
    return this.request(`/api/platform-integrations/configs/${id}`, {
      method: 'DELETE',
      headers: { 'x-enterprise-id': enterpriseId },
    });
  }

  async testConfig(enterpriseId: string, id: string) {
    return this.request(`/api/platform-integrations/configs/${id}/test`, {
      method: 'POST',
      headers: { 'x-enterprise-id': enterpriseId },
    });
  }

  // Integration Logs
  async listLogs(enterpriseId: string, filters: LogFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value.toString());
      }
    });

    return this.request(`/api/platform-integrations/logs?${params.toString()}`, {
      headers: { 'x-enterprise-id': enterpriseId },
    });
  }

  // Sync Operations
  async triggerSync(enterpriseId: string, job: SyncJob) {
    return this.request(`/api/platform-integrations/sync`, {
      method: 'POST',
      headers: { 'x-enterprise-id': enterpriseId },
      body: JSON.stringify(job),
    });
  }

  async retryLog(enterpriseId: string, logId: string) {
    return this.request(`/api/platform-integrations/logs/${logId}/retry`, {
      method: 'POST',
      headers: { 'x-enterprise-id': enterpriseId },
    });
  }

  // Health Monitoring
  async getHealth(enterpriseId: string) {
    return this.request(`/api/platform-integrations/health`, {
      headers: { 'x-enterprise-id': enterpriseId },
    });
  }
}

export const platformApi = new PlatformApiClient();