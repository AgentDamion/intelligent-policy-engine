// File: ui/services/hierarchicalContextApi.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('aicomplyr_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Hierarchical Context API
export const hierarchicalContextApi = {
  // Authentication
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  // Context Management
  switchContext: async (contextId) => {
    return apiRequest('/auth/context/switch', {
      method: 'POST',
      body: { contextId }
    });
  },

  getUserContexts: async () => {
    const response = await apiRequest('/auth/contexts');
    return response.contexts;
  },

  // Dashboard Data
  getDashboardData: async (contextType, contextId) => {
    const endpoint = contextType === 'enterprise' 
      ? `/dashboard/enterprise/${contextId}`
      : `/dashboard/agency-seat/${contextId}`;
    
    return apiRequest(endpoint);
  },

  // Enterprise Management
  createEnterprise: async (enterpriseData) => {
    return apiRequest('/enterprises', {
      method: 'POST',
      body: enterpriseData
    });
  },

  getEnterprise: async (enterpriseId) => {
    return apiRequest(`/enterprises/${enterpriseId}`);
  },

  updateEnterprise: async (enterpriseId, enterpriseData) => {
    return apiRequest(`/enterprises/${enterpriseId}`, {
      method: 'PUT',
      body: enterpriseData
    });
  },

  // Agency Seat Management
  createAgencySeat: async (enterpriseId, seatData) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats`, {
      method: 'POST',
      body: seatData
    });
  },

  getEnterpriseSeats: async (enterpriseId) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats`);
  },

  updateAgencySeat: async (enterpriseId, seatId, seatData) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}`, {
      method: 'PUT',
      body: seatData
    });
  },

  deleteAgencySeat: async (enterpriseId, seatId) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}`, {
      method: 'DELETE'
    });
  },

  // Policy Management
  createPolicy: async (policyData) => {
    return apiRequest('/policies', {
      method: 'POST',
      body: policyData
    });
  },

  getPolicies: async (enterpriseId, agencySeatId = null) => {
    const params = new URLSearchParams({ enterpriseId });
    if (agencySeatId) params.append('agencySeatId', agencySeatId);
    
    return apiRequest(`/policies?${params.toString()}`);
  },

  updatePolicy: async (policyId, policyData) => {
    return apiRequest(`/policies/${policyId}`, {
      method: 'PUT',
      body: policyData
    });
  },

  deletePolicy: async (policyId) => {
    return apiRequest(`/policies/${policyId}`, {
      method: 'DELETE'
    });
  },

  // Bulk Policy Assignment
  bulkAssignPolicies: async (enterpriseId, seatIds, policyIds, options = {}) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/bulk-policy-assignment`, {
      method: 'POST',
      body: { seatIds, policyIds, options }
    });
  },

  // User Management
  inviteUserToSeat: async (enterpriseId, seatId, userData) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}/invite-user`, {
      method: 'POST',
      body: userData
    });
  },

  getSeatUsers: async (enterpriseId, seatId) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}/users`);
  },

  updateUserRole: async (enterpriseId, seatId, userId, roleData) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}/users/${userId}/role`, {
      method: 'PUT',
      body: roleData
    });
  },

  removeUserFromSeat: async (enterpriseId, seatId, userId) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Notifications
  getNotifications: async (contextId, filter = 'all') => {
    return apiRequest(`/notifications/${contextId}?filter=${filter}`);
  },

  markNotificationRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  markAllNotificationsRead: async (contextId) => {
    return apiRequest(`/notifications/${contextId}/read-all`, {
      method: 'PUT'
    });
  },

  // Analytics & Reports
  getEnterpriseAnalytics: async (enterpriseId, timeRange = '30d') => {
    return apiRequest(`/analytics/enterprise/${enterpriseId}?timeRange=${timeRange}`);
  },

  getSeatAnalytics: async (enterpriseId, seatId, timeRange = '30d') => {
    return apiRequest(`/analytics/enterprise/${enterpriseId}/seats/${seatId}?timeRange=${timeRange}`);
  },

  getComplianceReport: async (enterpriseId, seatId = null) => {
    const endpoint = seatId 
      ? `/reports/compliance/enterprise/${enterpriseId}/seats/${seatId}`
      : `/reports/compliance/enterprise/${enterpriseId}`;
    
    return apiRequest(endpoint);
  },

  // Audit Logs
  getAuditLogs: async (contextId, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return apiRequest(`/audit/logs/${contextId}?${params.toString()}`);
  },

  // User Profile
  getUserProfile: async () => {
    return apiRequest('/user/profile');
  },

  updateUserProfile: async (profileData) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  // Settings
  getEnterpriseSettings: async (enterpriseId) => {
    return apiRequest(`/enterprises/${enterpriseId}/settings`);
  },

  updateEnterpriseSettings: async (enterpriseId, settings) => {
    return apiRequest(`/enterprises/${enterpriseId}/settings`, {
      method: 'PUT',
      body: settings
    });
  },

  getSeatSettings: async (enterpriseId, seatId) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}/settings`);
  },

  updateSeatSettings: async (enterpriseId, seatId, settings) => {
    return apiRequest(`/enterprises/${enterpriseId}/seats/${seatId}/settings`, {
      method: 'PUT',
      body: settings
    });
  },

  // Workflow Management
  getWorkflows: async (contextId) => {
    return apiRequest(`/workflows/${contextId}`);
  },

  createWorkflow: async (contextId, workflowData) => {
    return apiRequest(`/workflows/${contextId}`, {
      method: 'POST',
      body: workflowData
    });
  },

  updateWorkflow: async (contextId, workflowId, workflowData) => {
    return apiRequest(`/workflows/${contextId}/${workflowId}`, {
      method: 'PUT',
      body: workflowData
    });
  },

  deleteWorkflow: async (contextId, workflowId) => {
    return apiRequest(`/workflows/${contextId}/${workflowId}`, {
      method: 'DELETE'
    });
  },

  // Submissions
  getSubmissions: async (contextId, status = 'all') => {
    return apiRequest(`/submissions/${contextId}?status=${status}`);
  },

  createSubmission: async (contextId, submissionData) => {
    return apiRequest(`/submissions/${contextId}`, {
      method: 'POST',
      body: submissionData
    });
  },

  updateSubmission: async (contextId, submissionId, submissionData) => {
    return apiRequest(`/submissions/${contextId}/${submissionId}`, {
      method: 'PUT',
      body: submissionData
    });
  },

  // Tool Management
  getTools: async (contextId) => {
    return apiRequest(`/tools/${contextId}`);
  },

  requestToolAccess: async (contextId, toolId, requestData) => {
    return apiRequest(`/tools/${contextId}/${toolId}/request`, {
      method: 'POST',
      body: requestData
    });
  },

  // Health Check
  healthCheck: async () => {
    return apiRequest('/health');
  }
}; 