// Agent Task Service - Async Worker Pattern
// This service submits tasks to the agent_task_requests table and listens for responses via Realtime

import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface AgentTaskRequest {
  prompt: string
  context?: Record<string, any>
  user_id?: string
  enterprise_id?: string
}

export interface AgentTaskResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  request_payload: {
    prompt: string
    [key: string]: any
  }
  response_payload?: {
    answer: string
    steps?: string[]
    error?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

/**
 * Submit a task to the agent worker and wait for response via Realtime
 */
export async function submitAgentTask(
  request: AgentTaskRequest,
  onUpdate?: (response: AgentTaskResponse) => void
): Promise<AgentTaskResponse> {
  try {
    // 1. Insert task into queue
    // Get current user if not provided in request
    let userId = request.user_id
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    const { data: task, error: insertError } = await supabase
      .from('agent_task_requests')
      .insert({
        user_id: userId,
        status: 'pending',
        request_payload: {
          prompt: request.prompt,
          ...request.context
        }
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to submit task: ${insertError.message}`)
    }

    if (!task) {
      throw new Error('Failed to create task')
    }

    const taskId = task.id

    // 2. Set up Realtime subscription for this specific task
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null
      let channel: ReturnType<typeof supabase.channel> | null = null

      // Helper function to cleanup resources
      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (channel !== null) {
          channel.unsubscribe()
          channel = null
        }
      }

      // Timeout after 60 seconds
      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error('Task timeout: No response after 60 seconds'))
      }, 60000)

      channel = supabase
        .channel(`agent-task-${taskId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'agent_task_requests',
            filter: `id=eq.${taskId}`
          },
          (payload) => {
            const updatedTask = payload.new as AgentTaskResponse

            // Call update callback if provided
            if (onUpdate) {
              onUpdate(updatedTask)
            }

            // Resolve when task is completed or failed
            if (updatedTask.status === 'completed') {
              cleanup()
              resolve(updatedTask)
            } else if (updatedTask.status === 'failed') {
              cleanup()
              reject(new Error(updatedTask.response_payload?.error || 'Task failed'))
            }
            // If still processing, wait for next update
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to task ${taskId}`)
          } else if (status === 'CHANNEL_ERROR') {
            cleanup()
            reject(new Error('Failed to subscribe to task updates'))
          }
        })
    })
  } catch (error) {
    console.error('[AgentTaskService] Error submitting task:', error)
    throw error
  }
}

/**
 * Submit a task and return immediately (fire-and-forget)
 */
export async function submitAgentTaskAsync(request: AgentTaskRequest): Promise<string> {
  const { data: task, error } = await supabase
    .from('agent_task_requests')
    .insert({
      status: 'pending',
      request_payload: {
        prompt: request.prompt,
        ...request.context
      }
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to submit task: ${error.message}`)
  }

  return task.id
}

/**
 * Subscribe to all agent task updates for a user/enterprise
 */
export function subscribeToAgentTasks(
  filters?: { user_id?: string; enterprise_id?: string },
  onUpdate?: (task: AgentTaskResponse) => void
): RealtimeChannel {
  let filter = ''
  if (filters?.user_id) {
    filter = `user_id=eq.${filters.user_id}`
  } else if (filters?.enterprise_id) {
    filter = `enterprise_id=eq.${filters.enterprise_id}`
  }

  const channel = supabase
    .channel('agent-tasks-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_task_requests',
        ...(filter && { filter })
      },
      (payload) => {
        if (onUpdate) {
          onUpdate(payload.new as AgentTaskResponse)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Get task status by ID
 */
export async function getTaskStatus(taskId: string): Promise<AgentTaskResponse | null> {
  const { data, error } = await supabase
    .from('agent_task_requests')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('[AgentTaskService] Error fetching task:', error)
    return null
  }

  return data as AgentTaskResponse
}

