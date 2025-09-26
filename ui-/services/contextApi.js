// API Service Layer for Context Management
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Authentication helper
const getAuthToken = () => {
  return localStorage.getItem('aicomplyr_token') || sessionStorage.getItem('aicomplyr_token');
};

// API request helper with authentication
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle token refresh or redirect to login
      localStorage.removeItem('aicomplyr_token');
      sessionStorage.removeItem('aicomplyr_token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Context Management API
export const contextApi = {
  // Fetch all contexts for current user
  getUserContexts: async () => {
    return apiRequest('/user/contexts');
  },

  // Switch to a different context
  switchContext: async (contextId) => {
    return apiRequest('/user/context/switch', {
      method: 'POST',
      body: JSON.stringify({ contextId }),
    });
  },

  // Get dashboard data for current context
  getDashboardData: async (contextType, contextId) => {
    return apiRequest(`/dashboard/${contextType}/${contextId}`);
  },

  // Get notifications for current context
  getNotifications: async (contextId, filter = 'all') => {
    return apiRequest(`/notifications/${contextId}?filter=${filter}`);
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  // Mark all notifications as read
  markAllNotificationsRead: async (contextId) => {
    return apiRequest(`/notifications/${contextId}/read-all`, {
      method: 'PUT',
    });
  },

  // Get enterprise data
  getEnterpriseData: async (enterpriseId) => {
    return apiRequest(`/enterprises/${enterpriseId}`);
  },

  // Get agency seat data
  getAgencySeatData: async (seatId) => {
    return apiRequest(`/agency-seats/${seatId}`);
  },

  // Get user profile
  getUserProfile: async () => {
    return apiRequest('/user/profile');
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get compliance metrics
  getComplianceMetrics: async (contextId) => {
    return apiRequest(`/compliance/metrics/${contextId}`);
  },

  // Get audit events
  getAuditEvents: async (contextId, limit = 50) => {
    return apiRequest(`/audit/events/${contextId}?limit=${limit}`);
  },

  // Get policy data
  getPolicies: async (contextId) => {
    return apiRequest(`/policies/${contextId}`);
  },

  // Get submissions
  getSubmissions: async (contextId, status = 'all') => {
    return apiRequest(`/submissions/${contextId}?status=${status}`);
  },

  // Get tool requests
  getToolRequests: async (contextId) => {
    return apiRequest(`/tool-requests/${contextId}`);
  },

  // Seat Management API endpoints
  // Get all seats for an enterprise
  getEnterpriseSeats: async (enterpriseId) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats`);
  },

  // Create a new seat
  createSeat: async (enterpriseId, seatData) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats`, {
      method: 'POST',
      body: JSON.stringify(seatData),
    });
  },

  // Update a seat
  updateSeat: async (enterpriseId, seatId, seatData) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats/${seatId}`, {
      method: 'PUT',
      body: JSON.stringify(seatData),
    });
  },

  // Delete a seat
  deleteSeat: async (enterpriseId, seatId) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats/${seatId}`, {
      method: 'DELETE',
    });
  },

  // Bulk policy assignment to seats
  bulkAssignPolicies: async (enterpriseId, seatIds, policyIds, options) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats/bulk-policy-assignment`, {
      method: 'POST',
      body: JSON.stringify({ seatIds, policyIds, options }),
    });
  },

  // Invite user to seat
  inviteUserToSeat: async (enterpriseId, seatId, userData) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats/${seatId}/invite-user`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get seat analytics
  getSeatAnalytics: async (enterpriseId, timeRange = '30d') => {
    return apiRequest(`/enterprise/${enterpriseId}/seats/analytics?timeRange=${timeRange}`);
  },

  // Get available policies for assignment
  getAvailablePolicies: async (enterpriseId) => {
    return apiRequest(`/enterprise/${enterpriseId}/policies/available`);
  },

  // Get seat compliance report
  getSeatComplianceReport: async (enterpriseId, seatId) => {
    return apiRequest(`/enterprise/${enterpriseId}/seats/${seatId}/compliance-report`);
  },

  // AI-Powered Policy Automation API endpoints
  // Generate AI policy based on intent
  generatePolicyWithAI: async (policyIntent) => {
    return apiRequest('/ai/generate-policy-with-ai', {
      method: 'POST',
      body: JSON.stringify(policyIntent),
    });
  },

  // Analyze policy conflicts
  analyzePolicyConflicts: async (conflictAnalysis) => {
    return apiRequest('/ai/analyze-conflicts', {
      method: 'POST',
      body: JSON.stringify(conflictAnalysis),
    });
  },

  // Analyze regulatory impact
  analyzeRegulatoryImpact: async (impactAnalysis) => {
    return apiRequest('/ai/analyze-regulatory-impact', {
      method: 'POST',
      body: JSON.stringify(impactAnalysis),
    });
  },

  // Generate policy updates based on regulatory changes
  generatePolicyUpdates: async (updateRequest) => {
    return apiRequest('/ai/generate-policy-updates', {
      method: 'POST',
      body: JSON.stringify(updateRequest),
    });
  },

  // Get regulatory updates
  getRegulatoryUpdates: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/regulatory/updates?${queryParams}`);
  },

  // Apply automatic policy updates
  applyPolicyAutoUpdate: async (updateData) => {
    return apiRequest('/policies/auto-update', {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  },

  // Get AI policy templates
  getAIPolicyTemplates: async () => {
    return apiRequest('/ai/policy-templates');
  },

  // Validate AI-generated policy
  validateAIPolicy: async (policyData) => {
    return apiRequest('/ai/validate-ai-policy', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  },

  // Get policy approval workflow
  getPolicyApprovalWorkflow: async (policyId) => {
    return apiRequest(`/policies/${policyId}/approval-workflow`);
  },

  // Submit policy for approval
  submitPolicyForApproval: async (policyId, approvalData) => {
    return apiRequest(`/policies/${policyId}/submit-approval`, {
      method: 'POST',
      body: JSON.stringify(approvalData),
    });
  },

  // Get policy deployment status
  getPolicyDeploymentStatus: async (policyId) => {
    return apiRequest(`/policies/${policyId}/deployment-status`);
  },
};

// WebSocket connection for real-time updates
export class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(token) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';
    this.ws = new WebSocket(`${wsUrl}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        const token = getAuthToken();
        if (token) {
          this.connect(token);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    
    // Notify listeners based on message type
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => callback(payload));
    }
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export WebSocket instance
export const wsService = new WebSocketService(); 