/**
 * Agent Authority Validator
 * 
 * Enforces agent-level access control to prevent:
 * - Cross-tenant data access
 * - Unauthorized tool usage
 * - Privilege escalation
 * 
 * This is the second layer of defense after prompt injection detection.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for authority validation
export interface AuthorityContext {
  userId: string;
  authenticatedEnterpriseId: string;
  authenticatedWorkspaceIds: string[];
  userRole: 'admin' | 'manager' | 'user' | 'viewer';
  sessionId?: string;
}

export interface AuthorityValidationResult {
  authorized: boolean;
  reason: string;
  violation?: AuthorityViolation;
}

export interface AuthorityViolation {
  type: ViolationType;
  requestedResource: string;
  authorizedScope: string;
  severity: 'warning' | 'critical';
  timestamp: string;
}

export type ViolationType = 
  | 'cross_tenant_access'
  | 'unauthorized_workspace'
  | 'privilege_escalation'
  | 'unauthorized_tool'
  | 'rate_limit_exceeded'
  | 'resource_not_found';

// Tool definitions with required permissions
export interface ToolDefinition {
  name: string;
  description: string;
  requiredRole: 'admin' | 'manager' | 'user' | 'viewer';
  allowedScopes: ('enterprise' | 'workspace' | 'user')[];
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

// Default tool registry
const TOOL_REGISTRY: Map<string, ToolDefinition> = new Map([
  ['query_policies', {
    name: 'query_policies',
    description: 'Query boundary policies for the enterprise',
    requiredRole: 'viewer',
    allowedScopes: ['enterprise', 'workspace'],
  }],
  ['create_policy', {
    name: 'create_policy',
    description: 'Create a new boundary policy',
    requiredRole: 'manager',
    allowedScopes: ['enterprise'],
    rateLimit: { maxCalls: 10, windowMs: 60000 },
  }],
  ['update_policy', {
    name: 'update_policy',
    description: 'Update an existing boundary policy',
    requiredRole: 'manager',
    allowedScopes: ['enterprise'],
    rateLimit: { maxCalls: 20, windowMs: 60000 },
  }],
  ['delete_policy', {
    name: 'delete_policy',
    description: 'Delete a boundary policy',
    requiredRole: 'admin',
    allowedScopes: ['enterprise'],
    rateLimit: { maxCalls: 5, windowMs: 60000 },
  }],
  ['query_audit_logs', {
    name: 'query_audit_logs',
    description: 'Query audit logs for compliance',
    requiredRole: 'manager',
    allowedScopes: ['enterprise', 'workspace'],
  }],
  ['evaluate_request', {
    name: 'evaluate_request',
    description: 'Evaluate an AI request against policies',
    requiredRole: 'user',
    allowedScopes: ['enterprise', 'workspace', 'user'],
  }],
  ['query_enterprise_data', {
    name: 'query_enterprise_data',
    description: 'Query enterprise configuration data',
    requiredRole: 'viewer',
    allowedScopes: ['enterprise'],
  }],
  ['modify_enterprise_settings', {
    name: 'modify_enterprise_settings',
    description: 'Modify enterprise-level settings',
    requiredRole: 'admin',
    allowedScopes: ['enterprise'],
    rateLimit: { maxCalls: 5, windowMs: 60000 },
  }],
]);

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  'viewer': 1,
  'user': 2,
  'manager': 3,
  'admin': 4,
};

/**
 * Agent Authority Validator class
 * 
 * Validates that agent actions are within authorized boundaries
 */
export class AgentAuthorityValidator {
  private supabase: SupabaseClient;
  private authorityCache: Map<string, { context: AuthorityContext; expiry: number }> = new Map();
  private rateLimitTracker: Map<string, { count: number; windowStart: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Build authority context from user session
   */
  async buildAuthorityContext(userId: string, sessionId?: string): Promise<AuthorityContext | null> {
    // Check cache first
    const cacheKey = `${userId}:${sessionId || 'default'}`;
    const cached = this.authorityCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.context;
    }

    try {
      // Get user's enterprise membership
      const { data: enterpriseData, error: enterpriseError } = await this.supabase
        .from('user_enterprises')
        .select('enterprise_id, role')
        .eq('user_id', userId)
        .single();

      if (enterpriseError || !enterpriseData) {
        console.warn('Failed to get enterprise membership for user:', userId);
        return null;
      }

      // Get user's workspace memberships
      const { data: workspaceData, error: workspaceError } = await this.supabase
        .from('user_workspaces')
        .select('workspace_id')
        .eq('user_id', userId);

      if (workspaceError) {
        console.warn('Failed to get workspace memberships for user:', userId);
      }

      const context: AuthorityContext = {
        userId,
        authenticatedEnterpriseId: enterpriseData.enterprise_id,
        authenticatedWorkspaceIds: workspaceData?.map(w => w.workspace_id) || [],
        userRole: enterpriseData.role as AuthorityContext['userRole'],
        sessionId,
      };

      // Cache the context
      this.authorityCache.set(cacheKey, {
        context,
        expiry: Date.now() + this.CACHE_TTL_MS,
      });

      return context;
    } catch (error) {
      console.error('Error building authority context:', error);
      return null;
    }
  }

  /**
   * Validate enterprise access
   */
  validateEnterpriseAccess(
    authorityContext: AuthorityContext,
    requestedEnterpriseId: string
  ): AuthorityValidationResult {
    if (authorityContext.authenticatedEnterpriseId !== requestedEnterpriseId) {
      return {
        authorized: false,
        reason: 'Cross-tenant access attempt detected',
        violation: {
          type: 'cross_tenant_access',
          requestedResource: `enterprise:${requestedEnterpriseId}`,
          authorizedScope: `enterprise:${authorityContext.authenticatedEnterpriseId}`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      authorized: true,
      reason: 'Enterprise access validated',
    };
  }

  /**
   * Validate workspace access
   */
  validateWorkspaceAccess(
    authorityContext: AuthorityContext,
    requestedWorkspaceId: string
  ): AuthorityValidationResult {
    if (!authorityContext.authenticatedWorkspaceIds.includes(requestedWorkspaceId)) {
      return {
        authorized: false,
        reason: 'Unauthorized workspace access attempt',
        violation: {
          type: 'unauthorized_workspace',
          requestedResource: `workspace:${requestedWorkspaceId}`,
          authorizedScope: `workspaces:[${authorityContext.authenticatedWorkspaceIds.join(',')}]`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      authorized: true,
      reason: 'Workspace access validated',
    };
  }

  /**
   * Validate tool usage
   */
  validateToolUsage(
    authorityContext: AuthorityContext,
    toolName: string,
    scope: 'enterprise' | 'workspace' | 'user'
  ): AuthorityValidationResult {
    const toolDef = TOOL_REGISTRY.get(toolName);
    
    if (!toolDef) {
      return {
        authorized: false,
        reason: `Unknown tool: ${toolName}`,
        violation: {
          type: 'unauthorized_tool',
          requestedResource: `tool:${toolName}`,
          authorizedScope: 'registered_tools',
          severity: 'critical',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Check role hierarchy
    const userLevel = ROLE_HIERARCHY[authorityContext.userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[toolDef.requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return {
        authorized: false,
        reason: `Insufficient privileges for tool: ${toolName}`,
        violation: {
          type: 'privilege_escalation',
          requestedResource: `tool:${toolName}`,
          authorizedScope: `role:${authorityContext.userRole}`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Check scope
    if (!toolDef.allowedScopes.includes(scope)) {
      return {
        authorized: false,
        reason: `Tool ${toolName} not allowed in scope: ${scope}`,
        violation: {
          type: 'unauthorized_tool',
          requestedResource: `tool:${toolName}:scope:${scope}`,
          authorizedScope: `scopes:[${toolDef.allowedScopes.join(',')}]`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Check rate limit
    if (toolDef.rateLimit) {
      const rateLimitKey = `${authorityContext.userId}:${toolName}`;
      const rateLimitResult = this.checkRateLimit(rateLimitKey, toolDef.rateLimit);
      if (!rateLimitResult.authorized) {
        return rateLimitResult;
      }
    }

    return {
      authorized: true,
      reason: 'Tool usage authorized',
    };
  }

  /**
   * Check rate limits for tool usage
   */
  private checkRateLimit(
    key: string,
    limit: { maxCalls: number; windowMs: number }
  ): AuthorityValidationResult {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(key);

    if (!tracker || now - tracker.windowStart > limit.windowMs) {
      // New window
      this.rateLimitTracker.set(key, { count: 1, windowStart: now });
      return { authorized: true, reason: 'Rate limit check passed' };
    }

    if (tracker.count >= limit.maxCalls) {
      return {
        authorized: false,
        reason: `Rate limit exceeded: ${limit.maxCalls} calls per ${limit.windowMs}ms`,
        violation: {
          type: 'rate_limit_exceeded',
          requestedResource: key,
          authorizedScope: `limit:${limit.maxCalls}/${limit.windowMs}ms`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
        },
      };
    }

    tracker.count++;
    return { authorized: true, reason: 'Rate limit check passed' };
  }

  /**
   * Comprehensive validation for agent actions
   */
  async validateAgentAction(
    authorityContext: AuthorityContext,
    action: {
      toolName?: string;
      targetEnterpriseId?: string;
      targetWorkspaceId?: string;
      scope?: 'enterprise' | 'workspace' | 'user';
    }
  ): Promise<AuthorityValidationResult> {
    // Validate enterprise access if specified
    if (action.targetEnterpriseId) {
      const enterpriseResult = this.validateEnterpriseAccess(
        authorityContext,
        action.targetEnterpriseId
      );
      if (!enterpriseResult.authorized) {
        return enterpriseResult;
      }
    }

    // Validate workspace access if specified
    if (action.targetWorkspaceId) {
      const workspaceResult = this.validateWorkspaceAccess(
        authorityContext,
        action.targetWorkspaceId
      );
      if (!workspaceResult.authorized) {
        return workspaceResult;
      }
    }

    // Validate tool usage if specified
    if (action.toolName) {
      const toolResult = this.validateToolUsage(
        authorityContext,
        action.toolName,
        action.scope || 'enterprise'
      );
      if (!toolResult.authorized) {
        return toolResult;
      }
    }

    return {
      authorized: true,
      reason: 'All agent action validations passed',
    };
  }

  /**
   * Extract tenant IDs from input for validation
   */
  extractTenantIds(input: unknown): {
    enterpriseIds: string[];
    workspaceIds: string[];
  } {
    const enterpriseIds: Set<string> = new Set();
    const workspaceIds: Set<string> = new Set();

    const extractFromObject = (obj: unknown): void => {
      if (!obj || typeof obj !== 'object') return;

      const record = obj as Record<string, unknown>;
      
      // Check for common tenant ID field names
      const enterpriseFields = ['enterprise_id', 'enterpriseId', 'tenant_id', 'tenantId', 'org_id', 'orgId'];
      const workspaceFields = ['workspace_id', 'workspaceId', 'project_id', 'projectId'];

      for (const field of enterpriseFields) {
        if (record[field] && typeof record[field] === 'string') {
          enterpriseIds.add(record[field] as string);
        }
      }

      for (const field of workspaceFields) {
        if (record[field] && typeof record[field] === 'string') {
          workspaceIds.add(record[field] as string);
        }
      }

      // Recursively check nested objects
      for (const value of Object.values(record)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            extractFromObject(item);
          }
        } else if (typeof value === 'object') {
          extractFromObject(value);
        }
      }
    };

    extractFromObject(input);

    return {
      enterpriseIds: Array.from(enterpriseIds),
      workspaceIds: Array.from(workspaceIds),
    };
  }

  /**
   * Clear cached authority contexts
   */
  clearCache(): void {
    this.authorityCache.clear();
    this.rateLimitTracker.clear();
  }
}

/**
 * Create a validator instance
 */
export function createAgentAuthorityValidator(supabase: SupabaseClient): AgentAuthorityValidator {
  return new AgentAuthorityValidator(supabase);
}

/**
 * Quick validation helper for common use cases
 */
export async function validateAgentAuthority(
  supabase: SupabaseClient,
  userId: string,
  requestedEnterpriseId: string,
  requestedWorkspaceId?: string
): Promise<AuthorityValidationResult> {
  const validator = createAgentAuthorityValidator(supabase);
  const context = await validator.buildAuthorityContext(userId);
  
  if (!context) {
    return {
      authorized: false,
      reason: 'Failed to build authority context for user',
      violation: {
        type: 'resource_not_found',
        requestedResource: `user:${userId}`,
        authorizedScope: 'authenticated_users',
        severity: 'critical',
        timestamp: new Date().toISOString(),
      },
    };
  }

  return validator.validateAgentAction(context, {
    targetEnterpriseId: requestedEnterpriseId,
    targetWorkspaceId: requestedWorkspaceId,
  });
}

