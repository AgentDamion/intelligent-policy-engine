import { useCallback } from 'react';
import { toast } from 'sonner';
import { monitoring } from '@/utils/monitoring';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  onError?: (error: Error) => void;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown,
    context?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      onError
    } = options;

    // Normalize error
    const normalizedError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error');

    // Log error
    if (logError) {
      monitoring.error(
        context ? `Error in ${context}` : 'Application error',
        normalizedError,
        context
      );
    }

    // Show user-friendly toast
    if (showToast) {
      const message = getErrorMessage(normalizedError, fallbackMessage);
      toast.error(message);
    }

    // Call custom error handler
    if (onError) {
      onError(normalizedError);
    }

    return normalizedError;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
}

function getErrorMessage(error: Error, fallback: string): string {
  // Common error patterns
  if (error.message.includes('Failed to fetch')) {
    return 'Network error - please check your connection';
  }
  
  if (error.message.includes('unauthorized') || error.message.includes('401')) {
    return 'Authentication required - please sign in';
  }
  
  if (error.message.includes('forbidden') || error.message.includes('403')) {
    return 'Access denied - insufficient permissions';
  }
  
  if (error.message.includes('not found') || error.message.includes('404')) {
    return 'Resource not found';
  }
  
  if (error.message.includes('500') || error.message.includes('server')) {
    return 'Server error - please try again later';
  }

  // Return original message if it's user-friendly, otherwise use fallback
  return error.message.length < 100 && !error.message.includes('at ') 
    ? error.message 
    : fallback;
}