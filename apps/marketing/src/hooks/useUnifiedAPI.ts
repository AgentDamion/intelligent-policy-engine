import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/api';
import { monitoring } from '@/utils/monitoring';

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface APIOptions {
  showErrorToast?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export const useUnifiedAPI = <T = any>(options: APIOptions = {}) => {
  const {
    showErrorToast = true,
    retryAttempts = 1,
    timeout = 10000
  } = options;

  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const { toast } = useToast();

  const makeRequest = useCallback(async (
    endpoint: string,
    requestOptions: RequestInit = {},
    customOptions: Partial<APIOptions> = {}
  ): Promise<T> => {
    const mergedOptions = { ...options, ...customOptions };
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < (mergedOptions.retryAttempts || retryAttempts); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout || timeout);

        const response = await fetch(getApiUrl(endpoint), {
          ...requestOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        setState({
          data,
          loading: false,
          error: null
        });

        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < (mergedOptions.retryAttempts || retryAttempts) - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All attempts failed
    const errorMessage = lastError?.message || 'Request failed';
    
    setState({
      data: null,
      loading: false,
      error: errorMessage
    });

    // Log error with monitoring
    monitoring.error('API request failed after retries', lastError, 'useUnifiedAPI');

    if (mergedOptions.showErrorToast || showErrorToast) {
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive"
      });
    }

    throw lastError;
  }, [options, retryAttempts, timeout, showErrorToast, toast]);

  const get = useCallback((endpoint: string, customOptions?: Partial<APIOptions>) => {
    return makeRequest(endpoint, { method: 'GET' }, customOptions);
  }, [makeRequest]);

  const post = useCallback((endpoint: string, data: any, customOptions?: Partial<APIOptions>) => {
    return makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, customOptions);
  }, [makeRequest]);

  const put = useCallback((endpoint: string, data: any, customOptions?: Partial<APIOptions>) => {
    return makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, customOptions);
  }, [makeRequest]);

  const del = useCallback((endpoint: string, customOptions?: Partial<APIOptions>) => {
    return makeRequest(endpoint, { method: 'DELETE' }, customOptions);
  }, [makeRequest]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    makeRequest,
    get,
    post,
    put,
    delete: del,
    reset
  };
};