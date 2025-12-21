import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Response from VERA agent with security metadata
 */
export interface VERAResponse {
  message: string;
  traceId: string | null;
  spanId: string | null;
  securityStatus: 'passed' | 'flagged' | 'blocked';
  securityDetails?: {
    category?: string;
    riskLevel?: string;
    reason?: string;
  };
  stepsLogged: number;
  processingTimeMs: number;
  activityId?: number;
  agentName?: string;
  action?: string;
}

/**
 * Error response from agent adapter
 */
export interface VERAError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Hook state
 */
interface UseVERAAgentState {
  isLoading: boolean;
  error: VERAError | null;
  lastResponse: VERAResponse | null;
}

/**
 * Hook for interacting with VERA through the cursor-agent-adapter
 * 
 * Features:
 * - Authenticated edge function invocation
 * - Security metadata exposure (injection detection, trace_id)
 * - Loading/error state management
 * - Access to reasoning steps for observability
 */
export function useVERAAgent() {
  const [state, setState] = useState<UseVERAAgentState>({
    isLoading: false,
    error: null,
    lastResponse: null,
  });

  /**
   * Send a message to VERA and get a response
   */
  const sendMessage = useCallback(async (
    message: string,
    context?: {
      workspaceId?: string;
      enterpriseId?: string;
      threadId?: string;
    }
  ): Promise<VERAResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const startTime = Date.now();
    
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // Invoke the cursor-agent-adapter edge function
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          query: message,
          context: {
            threadId: context?.threadId || `vera-${Date.now()}`,
            workspaceId: context?.workspaceId,
            enterpriseId: context?.enterpriseId,
            source: 'vera-chat',
          },
        },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      const processingTimeMs = Date.now() - startTime;

      // Handle error response
      if (error) {
        const veraError: VERAError = {
          code: 'FUNCTION_ERROR',
          message: error.message || 'Failed to communicate with VERA',
          details: { originalError: error },
        };
        setState(prev => ({ ...prev, isLoading: false, error: veraError }));
        throw veraError;
      }

      // Check for security block response
      if (data?.code === 'SECURITY_VIOLATION' || data?.code === 'CROSS_TENANT_VIOLATION' || data?.code === 'TOOL_MISUSE_DETECTED') {
        const response: VERAResponse = {
          message: data.error || 'Request blocked by security policy',
          traceId: data.metadata?.trace_id || null,
          spanId: data.metadata?.span_id || null,
          securityStatus: 'blocked',
          securityDetails: {
            category: data.details?.category,
            riskLevel: data.details?.riskLevel || 'critical',
            reason: data.details?.reason,
          },
          stepsLogged: 0,
          processingTimeMs,
        };
        setState(prev => ({ ...prev, isLoading: false, lastResponse: response }));
        return response;
      }

      // Handle successful response
      if (data?.success) {
        const response: VERAResponse = {
          message: data.response || data.result?.response || JSON.stringify(data.result),
          traceId: data.metadata?.trace_id || null,
          spanId: data.metadata?.span_id || null,
          securityStatus: data.metadata?.security_flagged ? 'flagged' : 'passed',
          securityDetails: data.metadata?.security_details,
          stepsLogged: data.metadata?.steps_logged || 0,
          processingTimeMs: data.metadata?.processing_time_ms || processingTimeMs,
          activityId: data.userActivityId || data.metadata?.activity_id,
          agentName: data.metadata?.agent || 'vera',
          action: data.metadata?.action || 'chat',
        };
        setState(prev => ({ ...prev, isLoading: false, lastResponse: response }));
        return response;
      }

      // Fallback for unexpected response format
      const fallbackResponse: VERAResponse = {
        message: typeof data === 'string' ? data : JSON.stringify(data),
        traceId: null,
        spanId: null,
        securityStatus: 'passed',
        stepsLogged: 0,
        processingTimeMs,
      };
      setState(prev => ({ ...prev, isLoading: false, lastResponse: fallbackResponse }));
      return fallbackResponse;

    } catch (err) {
      const processingTimeMs = Date.now() - startTime;
      
      // Check if it's already a VERAError
      if ((err as VERAError).code) {
        throw err;
      }

      const veraError: VERAError = {
        code: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: { originalError: err },
      };
      setState(prev => ({ ...prev, isLoading: false, error: veraError }));
      throw veraError;
    }
  }, []);

  /**
   * Invoke a specific agent with structured input
   */
  const invokeAgent = useCallback(async (
    agentName: string,
    action: string,
    input: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<VERAResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const startTime = Date.now();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agentName,
          action,
          input,
          context: {
            ...context,
            source: 'vera-agent-invoke',
          },
        },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      const processingTimeMs = Date.now() - startTime;

      if (error) {
        const veraError: VERAError = {
          code: 'FUNCTION_ERROR',
          message: error.message || 'Failed to invoke agent',
        };
        setState(prev => ({ ...prev, isLoading: false, error: veraError }));
        throw veraError;
      }

      // Handle security violations
      if (data?.code?.includes('VIOLATION') || data?.code?.includes('MISUSE')) {
        const response: VERAResponse = {
          message: data.error || 'Request blocked',
          traceId: data.metadata?.trace_id || null,
          spanId: data.metadata?.span_id || null,
          securityStatus: 'blocked',
          securityDetails: data.details,
          stepsLogged: 0,
          processingTimeMs,
          agentName,
          action,
        };
        setState(prev => ({ ...prev, isLoading: false, lastResponse: response }));
        return response;
      }

      // Successful response
      const response: VERAResponse = {
        message: formatAgentResult(agentName, data.result),
        traceId: data.metadata?.trace_id || null,
        spanId: data.metadata?.span_id || null,
        securityStatus: data.metadata?.security_flagged ? 'flagged' : 'passed',
        stepsLogged: data.metadata?.steps_logged || 0,
        processingTimeMs: data.metadata?.processing_time_ms || processingTimeMs,
        activityId: data.metadata?.activity_id,
        agentName,
        action,
      };
      setState(prev => ({ ...prev, isLoading: false, lastResponse: response }));
      return response;

    } catch (err) {
      if ((err as VERAError).code) throw err;
      
      const veraError: VERAError = {
        code: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setState(prev => ({ ...prev, isLoading: false, error: veraError }));
      throw veraError;
    }
  }, []);

  /**
   * Fetch agent trace for observability
   */
  const fetchTrace = useCallback(async (traceId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_agent_trace', { p_trace_id: traceId });

      if (error) {
        console.error('Failed to fetch trace:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching trace:', err);
      return null;
    }
  }, []);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    invokeAgent,
    fetchTrace,
    clearError,
  };
}

/**
 * Format agent result into human-readable message
 */
function formatAgentResult(agentName: string, result: unknown): string {
  if (!result) return 'No response received.';
  
  if (typeof result === 'string') return result;

  const r = result as Record<string, unknown>;

  switch (agentName) {
    case 'policy':
      return `Policy evaluation complete: ${(r.decision as string || 'unknown').toUpperCase()}. ${
        Array.isArray(r.reasons) ? r.reasons.join('. ') : ''
      }`;
    
    case 'context':
      return `Context analysis complete: Risk score ${r.risk_score}/100, ` +
        `Complexity: ${r.complexity_level}, Sensitivity: ${r.data_sensitivity}`;
    
    case 'audit':
      const bundle = r.proof_bundle as Record<string, unknown> | undefined;
      return bundle 
        ? `Proof bundle generated: ${bundle.bundle_id}. Signature: ${
            (bundle.hmac_signature as string || '').substring(0, 16)
          }...`
        : 'Audit bundle created.';
    
    default:
      return JSON.stringify(result, null, 2);
  }
}

export default useVERAAgent;

