import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ErrorContext {
  operation: string;
  component?: string;
  additionalInfo?: Record<string, any>;
}

interface ErrorHandlerResult {
  success: boolean;
  error?: Error;
  message?: string;
}

/**
 * Enhanced error handler with database logging, user notifications, and validation
 */
export const useEnhancedErrorHandler = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback(
    (error: Error, context: ErrorContext): ErrorHandlerResult => {
      console.error(`Error in ${context.operation}:`, error);

      // Log to database (fire and forget)
      if (user?.id) {
        void supabase.rpc('log_operation', {
          p_user_id: user.id,
          p_operation: context.operation,
          p_status: 'error',
          p_metadata: {
            error_message: error.message,
            component: context.component,
            ...context.additionalInfo,
          },
        });
      }

      // Show user-friendly toast notification
      const userMessage = getUserFriendlyMessage(error);
      toast.error(userMessage, {
        description: context.component ? `In ${context.component}` : undefined,
      });

      return {
        success: false,
        error,
        message: userMessage,
      };
    },
    [user]
  );

  const handleSuccess = useCallback(
    (context: ErrorContext, additionalInfo?: Record<string, any>) => {
      // Log successful operations to database (fire and forget)
      if (user?.id) {
        void supabase.rpc('log_operation', {
          p_user_id: user.id,
          p_operation: context.operation,
          p_status: 'success',
          p_metadata: {
            component: context.component,
            ...context.additionalInfo,
            ...additionalInfo,
          },
        });
      }

      return {
        success: true,
      };
    },
    [user]
  );

  const wrapAsync = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      context: ErrorContext
    ): Promise<{ data?: T; error?: Error }> => {
      setIsLoading(true);
      const startTime = performance.now();

      try {
        const data = await asyncFn();
        const duration = Math.round(performance.now() - startTime);

        // Log successful operation with duration (fire and forget)
        if (user?.id) {
          void supabase.rpc('log_operation', {
            p_user_id: user.id,
            p_operation: context.operation,
            p_status: 'success',
            p_duration_ms: duration,
            p_metadata: {
              component: context.component,
              ...context.additionalInfo,
            },
          });
        }

        return { data };
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        // Log error with duration (fire and forget)
        if (user?.id) {
          void supabase.rpc('log_operation', {
            p_user_id: user.id,
            p_operation: context.operation,
            p_status: 'error',
            p_duration_ms: duration,
            p_metadata: {
              error_message: error instanceof Error ? error.message : String(error),
              component: context.component,
              ...context.additionalInfo,
            },
          });
        }

        handleError(error as Error, context);
        return { error: error as Error };
      } finally {
        setIsLoading(false);
      }
    },
    [user, handleError]
  );

  return {
    handleError,
    handleSuccess,
    wrapAsync,
    isLoading,
  };
};

/**
 * Convert technical errors into user-friendly messages
 */
function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase();

  // Database/Network errors
  if (message.includes('fetch') || message.includes('network')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'Authentication error. Please sign in again.';
  }

  // Permission errors
  if (message.includes('permission') || message.includes('forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Invalid data provided. Please check your input.';
  }

  // RLS policy errors
  if (message.includes('row-level security') || message.includes('policy')) {
    return 'Access denied. You may not have permission to access this resource.';
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Default fallback
  return error.message || 'An unexpected error occurred. Please try again.';
}
