/**
 * Agent Authority Validator
 * Validates agent permissions and detects conflicts before execution
 * Day 2-3 Security Implementation
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AgentManifest {
  agent_name: string;
  agent_type: string;
  capabilities: string[];
  auto_execution_threshold: 'auto_low' | 'auto_medium' | 'manual';
  max_resource_impact: 'low' | 'medium' | 'high' | 'critical';
  allowed_operations: string[];
  conflict_resolution_strategy: 'queue' | 'override' | 'merge' | 'reject';
  requires_approval_for: string[];
  is_active: boolean;
}

export interface ConflictDetectionResult {
  has_conflict: boolean;
  conflicting_action_id: number | null;
  conflicting_agent: string | null;
  suggested_resolution: string | null;
}

export interface AutoExecutionCheck {
  can_auto_execute: boolean;
  requires_approval: boolean;
  threshold_level: string;
  reason: string;
}

export interface AgentActionLog {
  id?: number;
  agent_name: string;
  action_type: 'read' | 'write' | 'delete' | 'execute';
  resource_type: string;
  resource_id: string;
  enterprise_id?: string;
  workspace_id?: string;
  action_payload?: Record<string, any>;
  execution_status: 'pending' | 'executing' | 'completed' | 'failed' | 'rejected';
  conflict_detected?: boolean;
  conflicting_action_id?: number;
  resolution_strategy?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export class AgentAuthorityValidator {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Validate agent has authority to perform action
   */
  async validateAuthority(
    agentName: string,
    actionType: string,
    resourceType: string,
    resourceImpact: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<{
    authorized: boolean;
    can_auto_execute: boolean;
    requires_approval: boolean;
    reason: string;
    manifest?: AgentManifest;
  }> {
    // Get agent manifest
    const { data: manifest, error: manifestError } = await this.supabase
      .from('agent_manifest')
      .select('*')
      .eq('agent_name', agentName)
      .eq('is_active', true)
      .single();

    if (manifestError || !manifest) {
      return {
        authorized: false,
        can_auto_execute: false,
        requires_approval: true,
        reason: `Agent ${agentName} not found in manifest or inactive`,
      };
    }

    // Check if operation is allowed
    const allowedOps = manifest.allowed_operations as string[];
    if (!allowedOps.includes(actionType) && !allowedOps.includes('*')) {
      return {
        authorized: false,
        can_auto_execute: false,
        requires_approval: true,
        reason: `Agent ${agentName} not authorized for ${actionType} operations`,
        manifest,
      };
    }

    // Check auto-execution threshold
    const { data: executionCheck } = await this.supabase.rpc(
      'check_auto_execution_allowed',
      {
        p_agent_name: agentName,
        p_action_type: actionType,
        p_resource_impact: resourceImpact,
      }
    );

    const check = executionCheck?.[0] as AutoExecutionCheck;

    return {
      authorized: true,
      can_auto_execute: check?.can_auto_execute || false,
      requires_approval: check?.requires_approval || true,
      reason: check?.reason || 'Authorization check completed',
      manifest,
    };
  }

  /**
   * Detect conflicts with other pending agent actions
   */
  async detectConflict(
    agentName: string,
    resourceType: string,
    resourceId: string,
    actionType: string
  ): Promise<ConflictDetectionResult> {
    const { data, error } = await this.supabase.rpc('detect_agent_conflict', {
      p_agent_name: agentName,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_action_type: actionType,
    });

    if (error) {
      console.error('[AgentAuthority] Conflict detection error:', error);
      return {
        has_conflict: false,
        conflicting_action_id: null,
        conflicting_agent: null,
        suggested_resolution: null,
      };
    }

    return data?.[0] || {
      has_conflict: false,
      conflicting_action_id: null,
      conflicting_agent: null,
      suggested_resolution: null,
    };
  }

  /**
   * Log agent action for audit trail and conflict tracking
   */
  async logAction(action: AgentActionLog): Promise<{ id: number | null; error: Error | null }> {
    const { data, error } = await this.supabase
      .from('agent_action_log')
      .insert({
        agent_name: action.agent_name,
        action_type: action.action_type,
        resource_type: action.resource_type,
        resource_id: action.resource_id,
        enterprise_id: action.enterprise_id,
        workspace_id: action.workspace_id,
        action_payload: action.action_payload || {},
        execution_status: action.execution_status,
        conflict_detected: action.conflict_detected || false,
        conflicting_action_id: action.conflicting_action_id,
        resolution_strategy: action.resolution_strategy,
        started_at: action.started_at || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AgentAuthority] Failed to log action:', error);
      return { id: null, error };
    }

    return { id: data?.id || null, error: null };
  }

  /**
   * Update action status (for tracking execution lifecycle)
   */
  async updateActionStatus(
    actionId: number,
    status: AgentActionLog['execution_status'],
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      execution_status: status,
    };

    if (status === 'executing' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed' || status === 'rejected') {
      updates.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('agent_action_log')
      .update(updates)
      .eq('id', actionId);

    if (error) {
      console.error('[AgentAuthority] Failed to update action status:', error);
    }
  }

  /**
   * Complete workflow for validating and logging agent action
   */
  async validateAndLog(params: {
    agentName: string;
    actionType: 'read' | 'write' | 'delete' | 'execute';
    resourceType: string;
    resourceId: string;
    resourceImpact?: 'low' | 'medium' | 'high' | 'critical';
    enterpriseId?: string;
    workspaceId?: string;
    actionPayload?: Record<string, any>;
  }): Promise<{
    authorized: boolean;
    can_auto_execute: boolean;
    requires_approval: boolean;
    has_conflict: boolean;
    action_id: number | null;
    reason: string;
    conflict_resolution?: string;
  }> {
    // Step 1: Validate authority
    const authCheck = await this.validateAuthority(
      params.agentName,
      params.actionType,
      params.resourceType,
      params.resourceImpact || 'medium'
    );

    if (!authCheck.authorized) {
      return {
        authorized: false,
        can_auto_execute: false,
        requires_approval: true,
        has_conflict: false,
        action_id: null,
        reason: authCheck.reason,
      };
    }

    // Step 2: Detect conflicts
    const conflict = await this.detectConflict(
      params.agentName,
      params.resourceType,
      params.resourceId,
      params.actionType
    );

    // Step 3: Log action
    const { id: actionId } = await this.logAction({
      agent_name: params.agentName,
      action_type: params.actionType,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      enterprise_id: params.enterpriseId,
      workspace_id: params.workspaceId,
      action_payload: params.actionPayload,
      execution_status: conflict.has_conflict ? 'pending' : 'executing',
      conflict_detected: conflict.has_conflict,
      conflicting_action_id: conflict.conflicting_action_id || undefined,
      resolution_strategy: conflict.suggested_resolution || undefined,
    });

    return {
      authorized: true,
      can_auto_execute: authCheck.can_auto_execute && !conflict.has_conflict,
      requires_approval: authCheck.requires_approval || conflict.has_conflict,
      has_conflict: conflict.has_conflict,
      action_id: actionId,
      reason: authCheck.reason,
      conflict_resolution: conflict.suggested_resolution || undefined,
    };
  }
}
