import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface InboxTask {
  id?: string;
  source_agent: 'simulation' | 'configuration' | 'policy_definition' | 'middleware_monitor';
  user_role_target: 'CMO' | 'LEGAL' | 'FINANCE' | 'ENGINEERING' | 'POLICY_OWNER';
  assigned_to?: string;
  enterprise_id: string;
  workspace_id?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  summary_html: string;
  task_type: string;
  action_type: string;
  action_payload: Record<string, any>;
  source_url?: string;
  source_entity_id?: string;
  context_data?: Record<string, any>;
  requires_approval?: boolean;
  auto_executable?: boolean;
  workflow_paused?: boolean;
  dependent_workflow_id?: string;
}

/**
 * InboxAgent - Task and approval routing for human-in-the-loop workflows
 * 
 * Manages task creation, priority scoring, role routing, and action execution
 * for approvals and human review workflows.
 */
export class InboxAgent {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async process(input: any, context: Record<string, unknown>): Promise<any> {
    const { action, payload } = input;

    switch (action) {
      case 'create_task':
        return await this.createTask(payload, context);
      case 'execute_action':
        return await this.executeAction(payload, context);
      case 'update_task_status':
        return await this.updateTaskStatus(payload, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * FR-IA-1.1: Task Normalization
   * Accept tasks from any source agent and normalize into InboxTask schema
   */
  async createTask(taskData: InboxTask, context: Record<string, unknown>): Promise<{ task_id: string }> {
    // Auto-score priority based on task metadata
    const priority = this.calculatePriority(taskData);
    
    // Determine role routing
    const role = this.determineTargetRole(taskData);
    
    const normalizedTask = {
      ...taskData,
      priority,
      user_role_target: role,
      severity: taskData.severity || priority,
      created_by: context.user_id || null,
      enterprise_id: context.enterprise_id || taskData.enterprise_id,
      workspace_id: context.workspace_id || taskData.workspace_id,
    };

    const { data, error } = await this.supabase
      .from('inbox_tasks')
      .insert([normalizedTask])
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create inbox task: ${error.message}`);

    console.log(`[InboxAgent] Created task ${data.id} for ${role} with priority ${priority}`);
    
    return { task_id: data.id };
  }

  /**
   * FR-IA-1.3: Priority Scoring
   * Automatically score tasks based on metadata
   */
  private calculatePriority(task: InboxTask): 'critical' | 'high' | 'medium' | 'low' {
    // Use explicit priority if provided
    if (task.priority) return task.priority;

    // Key expiration in <= 7 days is CRITICAL
    if (task.task_type === 'key_expiration' && task.context_data?.days_remaining <= 7) {
      return 'critical';
    }

    // Policy approval is HIGH
    if (task.action_type === 'APPROVE_POLICY' || task.task_type === 'policy_approval') {
      return 'high';
    }

    // Cost savings > $10k/year is HIGH
    if (task.task_type === 'optimization_suggestion' && 
        task.context_data?.estimated_savings_usd_annual > 10000) {
      return 'high';
    }

    // Simulation conflicts with high flip rate are HIGH
    if (task.task_type === 'simulation_conflict' && 
        task.context_data?.decision_flip_rate > 0.15) {
      return 'high';
    }

    // Default to task's severity or medium
    return task.severity || 'medium';
  }

  /**
   * FR-IA-1.2: Role-Based Routing
   * Determine which role should handle this task
   */
  private determineTargetRole(task: InboxTask): string {
    // Use explicit role if provided
    if (task.user_role_target) return task.user_role_target;

    const routingRules: Record<string, string> = {
      'key_renewal': 'POLICY_OWNER',
      'key_expiration': 'POLICY_OWNER',
      'policy_approval': 'LEGAL',
      'policy_draft_review': 'CMO',
      'optimization_suggestion': 'FINANCE',
      'cost_alert': 'FINANCE',
      'simulation_conflict': 'POLICY_OWNER',
      'model_deprecation': 'ENGINEERING',
      'compliance_warning': 'LEGAL',
    };

    return routingRules[task.task_type] || 'POLICY_OWNER';
  }

  /**
   * FR-IA-2.2: Action Execution
   * Execute the approved action by calling the appropriate agent
   */
  async executeAction(payload: {
    task_id: string;
    action: 'approve' | 'reject' | 'edit';
    edited_payload?: Record<string, any>;
  }, context: Record<string, unknown>): Promise<any> {
    // 1. Fetch the task
    const { data: task, error: fetchError } = await this.supabase
      .from('inbox_tasks')
      .select('*')
      .eq('id', payload.task_id)
      .single();

    if (fetchError || !task) {
      throw new Error(`Task not found: ${payload.task_id}`);
    }

    // 2. Update task status
    const newStatus = payload.action === 'approve' ? 'approved' : 
                     payload.action === 'reject' ? 'rejected' : 'in_progress';

    await this.supabase
      .from('inbox_tasks')
      .update({
        status: newStatus,
        actioned_at: new Date().toISOString(),
        actioned_by: context.user_id,
        action_response: { action: payload.action }
      })
      .eq('id', payload.task_id);

    console.log(`[InboxAgent] Task ${payload.task_id} ${newStatus} by ${context.user_id}`);

    // 3. If approved, execute the action via the source agent
    if (payload.action === 'approve') {
      const executionPayload = payload.edited_payload || task.action_payload;
      
      try {
        const result = await this.routeActionToAgent(
          task.source_agent,
          task.action_type,
          executionPayload,
          context
        );

        // Update task with execution result
        await this.supabase
          .from('inbox_tasks')
          .update({ action_response: { success: true, result } })
          .eq('id', payload.task_id);

        // Resume paused workflow if applicable
        if (task.workflow_paused && task.dependent_workflow_id) {
          await this.resumeWorkflow(task.dependent_workflow_id);
        }

        console.log(`[InboxAgent] Action executed successfully for task ${payload.task_id}`);
        return { success: true, result };
      } catch (error) {
        // Log execution failure
        await this.supabase
          .from('inbox_tasks')
          .update({ 
            action_response: { success: false, error: (error as Error).message },
            status: 'escalated'
          })
          .eq('id', payload.task_id);

        console.error(`[InboxAgent] Action execution failed for task ${payload.task_id}:`, error);
        throw error;
      }
    }

    return { success: true, action: payload.action };
  }

  /**
   * Route action execution to the appropriate agent
   */
  private async routeActionToAgent(
    sourceAgent: string,
    actionType: string,
    actionPayload: Record<string, any>,
    context: Record<string, unknown>
  ): Promise<any> {
    const actionMap: Record<string, { agent: string; action: string }> = {
      'APPROVE_POLICY': { agent: 'policy-definition', action: 'activate_policy' },
      'RENEW_KEY': { agent: 'configuration', action: 'generate_partner_key' },
      'APPLY_RULE_CHANGE': { agent: 'policy-definition', action: 'update_policy_rules' },
      'DEPRECATE_MODEL': { agent: 'configuration', action: 'archive_model' },
    };

    const route = actionMap[actionType];
    if (!route) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    console.log(`[InboxAgent] Routing ${actionType} to ${route.agent}:${route.action}`);

    // Call the target agent via the registry
    const { data, error } = await this.supabase.functions.invoke('cursor-agent-adapter', {
      body: {
        agent: route.agent,
        action: route.action,
        payload: actionPayload,
        context
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * FR-IA-2.1: Resume paused workflow
   */
  private async resumeWorkflow(workflowId: string): Promise<void> {
    console.log(`[InboxAgent] Resuming workflow ${workflowId}`);
    // Implementation depends on workflow system
    // This would trigger the next step in the paused workflow
  }

  /**
   * Update task status (for UI interactions)
   */
  async updateTaskStatus(payload: {
    task_id: string;
    status?: string;
    is_read?: boolean;
  }, context: Record<string, unknown>): Promise<void> {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (payload.status) {
      updates.status = payload.status;
    }

    if (payload.is_read !== undefined) {
      updates.is_read = payload.is_read;
      updates.read_at = new Date().toISOString();
      updates.read_by = context.user_id;
    }

    const { error } = await this.supabase
      .from('inbox_tasks')
      .update(updates)
      .eq('id', payload.task_id);

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }

    console.log(`[InboxAgent] Updated task ${payload.task_id} status`);
  }
}
