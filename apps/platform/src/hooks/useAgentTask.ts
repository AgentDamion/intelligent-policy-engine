// React hook for submitting agent tasks using the async worker pattern
import { useState, useCallback, useEffect, useRef } from 'react'
import { submitAgentTask, subscribeToAgentTasks, type AgentTaskRequest, type AgentTaskResponse } from '../services/AgentTaskService'
import { supabase } from '../lib/supabase'

export interface UseAgentTaskOptions {
  onComplete?: (response: AgentTaskResponse) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: AgentTaskResponse['status']) => void
  autoSubscribe?: boolean
  enterpriseId?: string
}

export function useAgentTask(options: UseAgentTaskOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTask, setCurrentTask] = useState<AgentTaskResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<any>(null)

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  /**
   * Submit a task to the agent worker
   */
  const submitTask = useCallback(async (request: AgentTaskRequest) => {
    setIsSubmitting(true)
    setError(null)
    setIsProcessing(false)
    setCurrentTask(null)

    try {
      // Get current user if available
      const { data: { user } } = await supabase.auth.getUser()
      
      const taskRequest: AgentTaskRequest = {
        ...request,
        user_id: user?.id,
        enterprise_id: options.enterpriseId || request.enterprise_id
      }

      // Submit task and wait for response
      const response = await submitAgentTask(taskRequest, (updatedTask) => {
        setCurrentTask(updatedTask)
        
        // Update processing state
        if (updatedTask.status === 'processing') {
          setIsProcessing(true)
          options.onStatusChange?.('processing')
        } else if (updatedTask.status === 'completed') {
          setIsProcessing(false)
          options.onStatusChange?.('completed')
          options.onComplete?.(updatedTask)
        } else if (updatedTask.status === 'failed') {
          setIsProcessing(false)
          options.onStatusChange?.('failed')
          const error = new Error(updatedTask.response_payload?.error || 'Task failed')
          setError(error)
          options.onError?.(error)
        }
      })

      setCurrentTask(response)
      setIsSubmitting(false)
      
      if (response.status === 'completed') {
        options.onComplete?.(response)
      } else if (response.status === 'failed') {
        const error = new Error(response.response_payload?.error || 'Task failed')
        setError(error)
        options.onError?.(error)
      }

      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit task')
      setError(error)
      setIsSubmitting(false)
      setIsProcessing(false)
      options.onError?.(error)
      throw error
    }
  }, [options])

  /**
   * Subscribe to all agent tasks (for monitoring)
   */
  useEffect(() => {
    if (options.autoSubscribe && options.enterpriseId) {
      channelRef.current = subscribeToAgentTasks(
        { enterprise_id: options.enterpriseId },
        (task) => {
          // Handle task updates
          if (task.status === 'completed' && options.onComplete) {
            options.onComplete(task)
          } else if (task.status === 'failed' && options.onError) {
            options.onError(new Error(task.response_payload?.error || 'Task failed'))
          }
        }
      )
    }
  }, [options.autoSubscribe, options.enterpriseId])

  return {
    submitTask,
    isSubmitting,
    isProcessing,
    currentTask,
    error,
    reset: () => {
      setError(null)
      setCurrentTask(null)
      setIsProcessing(false)
      setIsSubmitting(false)
    }
  }
}

