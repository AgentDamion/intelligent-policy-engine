import type { ToolSubmission, PrecheckResult, PolicyHint } from '@/app/tools/submit/types';

// Base API configuration
const API_BASE = process.env.NODE_ENV === 'development' ? '' : '';
const headers = {
  'Content-Type': 'application/json',
};

// Generic API helpers
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

async function get<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

async function post<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function patch<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PATCH', 
    body: JSON.stringify(data),
  });
}

// Tool Submission API
export const createSubmission = () => 
  post<{ id: string }>('/api/tools/submissions', {});

export const fetchSubmission = (id: string) => 
  get<ToolSubmission>(`/api/tools/submissions/${id}`);

export const saveSubmission = (id: string, patch: Partial<ToolSubmission>) => 
  patch<{ ok: boolean }>(`/api/tools/submissions/${id}`, patch);

export const submitSubmission = (id: string) => 
  post<{ ok: boolean; status: string }>(`/api/tools/submissions/${id}/submit`, {});

// Intelligence API
export const precheck = (payload: Partial<ToolSubmission>) => 
  post<PrecheckResult>('/api/tools/intel/metaloop/precheck', payload);

export const policyHints = (category?: string) => 
  get<PolicyHint[]>(`/api/tools/policies/hints${category ? `?category=${encodeURIComponent(category)}` : ''}`);

// Upload API
export const getSignedUrl = (name: string, type: string) => 
  post<{ url: string; key: string }>('/api/tools/uploads/signed-url', { name, type });

// Analytics tracking
export const trackSubmissionEvent = (event: string, data?: Record<string, any>) => {
  // Integration with existing analytics system
  if (typeof window !== 'undefined' && (window as any).track) {
    (window as any).track(`tool.${event}`, data);
  }
};
