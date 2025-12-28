/**
 * Unified Authentication Context Service
 * 
 * Bridges the gap between Supabase Auth (frontend) and hierarchical-auth (backend)
 * to provide seamless context switching for multi-tenant pharma clients.
 * 
 * FDA 21 CFR Part 11 Compliance:
 * - All context switches are audited
 * - Session persistence across context switches
 * - Partner-client context validation enforced
 * 
 * @module UnifiedAuthContext
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface AuthContext {
  userId: string;
  contextId: string;
  contextType: 'enterprise' | 'agencySeat' | 'partner';
  enterpriseId: string;
  workspaceId?: string;
  partnerId?: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

export interface ContextSwitchRequest {
  enterpriseId: string;
  workspaceId?: string;
  partnerId?: string;
  contextType: 'enterprise' | 'agencySeat' | 'partner';
}

export interface AvailableContext {
  id: string;
  name: string;
  type: 'enterprise' | 'partner' | 'workspace';
  enterpriseId: string;
  partnerId?: string;
  workspaceId?: string;
  role: string;
  lastAccessed?: string;
}

// ============================================================
// UNIFIED AUTH CONTEXT SERVICE
// ============================================================

class UnifiedAuthContextService {
  private supabase: SupabaseClient;
  private currentContext: AuthContext | null = null;
  private contextCache: Map<string, AuthContext> = new Map();

  constructor() {
    // Initialize Supabase client
    // In production, these would come from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Get the current authentication context
   * Loads from cache or fetches from database
   */
  async getCurrentContext(): Promise<AuthContext | null> {
    if (this.currentContext) return this.currentContext;

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    // Check cache first
    const cachedContext = this.contextCache.get(user.id);
    if (cachedContext) {
      this.currentContext = cachedContext;
      return cachedContext;
    }

    // Load primary enterprise membership
    const { data: memberships } = await this.supabase
      .from('enterprise_members')
      .select(`
        enterprise_id,
        role,
        permissions,
        enterprises(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!memberships || memberships.length === 0) return null;

    const primaryMembership = memberships[0];

    this.currentContext = {
      userId: user.id,
      contextId: crypto.randomUUID(),
      contextType: 'enterprise',
      enterpriseId: primaryMembership.enterprise_id,
      role: primaryMembership.role,
      permissions: primaryMembership.permissions || [],
      createdAt: new Date().toISOString(),
    };

    // Cache the context
    this.contextCache.set(user.id, this.currentContext);

    return this.currentContext;
  }

  /**
   * Get all available contexts for the current user
   * Includes enterprises, workspaces, and partner seats
   */
  async getAvailableContexts(): Promise<AvailableContext[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const contexts: AvailableContext[] = [];

    // Get enterprise contexts
    const { data: enterprises } = await this.supabase
      .from('enterprise_members')
      .select(`
        enterprise_id,
        role,
        enterprises(id, name)
      `)
      .eq('user_id', user.id);

    enterprises?.forEach((em: any) => {
      contexts.push({
        id: em.enterprise_id,
        name: em.enterprises?.name || 'Unknown Enterprise',
        type: 'enterprise',
        enterpriseId: em.enterprise_id,
        role: em.role,
      });
    });

    // Get partner contexts (if user is partner liaison)
    const { data: partnerSeats } = await this.supabase
      .from('agency_seats')
      .select(`
        id,
        partner_id,
        enterprise_id,
        role,
        partners(name)
      `)
      .eq('user_id', user.id);

    partnerSeats?.forEach((seat: any) => {
      contexts.push({
        id: seat.id,
        name: seat.partners?.name || 'Partner Context',
        type: 'partner',
        enterpriseId: seat.enterprise_id,
        partnerId: seat.partner_id,
        role: seat.role,
      });
    });

    // Get workspace contexts
    const { data: workspaces } = await this.supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces(id, name, enterprise_id)
      `)
      .eq('user_id', user.id);

    workspaces?.forEach((wm: any) => {
      contexts.push({
        id: wm.workspace_id,
        name: wm.workspaces?.name || 'Workspace',
        type: 'workspace',
        enterpriseId: wm.workspaces?.enterprise_id,
        workspaceId: wm.workspace_id,
        role: wm.role,
      });
    });

    return contexts;
  }

  /**
   * Switch to a different authentication context
   * Validates access and creates audit trail
   */
  async switchContext(request: ContextSwitchRequest): Promise<AuthContext> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate access to requested context
    const hasAccess = await this.validateContextAccess(user.id, request);
    if (!hasAccess) {
      await this.auditContextSwitch(user.id, request, false, 'Access denied');
      throw new Error('Unauthorized context access');
    }

    // Load role and permissions for new context
    const { role, permissions } = await this.getContextRoleAndPermissions(
      user.id,
      request
    );

    // Create new context
    this.currentContext = {
      userId: user.id,
      contextId: crypto.randomUUID(),
      contextType: request.contextType,
      enterpriseId: request.enterpriseId,
      workspaceId: request.workspaceId,
      partnerId: request.partnerId,
      role,
      permissions,
      createdAt: new Date().toISOString(),
    };

    // Update cache
    this.contextCache.set(user.id, this.currentContext);

    // Audit the context switch (FDA compliance)
    await this.auditContextSwitch(user.id, request, true);

    // Store in session storage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_context', JSON.stringify(this.currentContext));
    }

    return this.currentContext;
  }

  /**
   * Validate that user has access to the requested context
   */
  private async validateContextAccess(
    userId: string,
    request: ContextSwitchRequest
  ): Promise<boolean> {
    if (request.contextType === 'enterprise') {
      const { data } = await this.supabase
        .from('enterprise_members')
        .select('id')
        .eq('user_id', userId)
        .eq('enterprise_id', request.enterpriseId)
        .single();
      return !!data;
    }

    if (request.contextType === 'partner') {
      const { data } = await this.supabase
        .from('agency_seats')
        .select('id')
        .eq('user_id', userId)
        .eq('partner_id', request.partnerId)
        .single();
      return !!data;
    }

    if (request.contextType === 'agencySeat' && request.workspaceId) {
      const { data } = await this.supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', userId)
        .eq('workspace_id', request.workspaceId)
        .single();
      return !!data;
    }

    return false;
  }

  /**
   * Get role and permissions for a specific context
   */
  private async getContextRoleAndPermissions(
    userId: string,
    request: ContextSwitchRequest
  ): Promise<{ role: string; permissions: string[] }> {
    if (request.contextType === 'enterprise') {
      const { data } = await this.supabase
        .from('enterprise_members')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('enterprise_id', request.enterpriseId)
        .single();
      return {
        role: data?.role || 'member',
        permissions: data?.permissions || [],
      };
    }

    if (request.contextType === 'partner') {
      const { data } = await this.supabase
        .from('agency_seats')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('partner_id', request.partnerId)
        .single();
      return {
        role: data?.role || 'partner_user',
        permissions: data?.permissions || [],
      };
    }

    if (request.contextType === 'agencySeat' && request.workspaceId) {
      const { data } = await this.supabase
        .from('workspace_members')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('workspace_id', request.workspaceId)
        .single();
      return {
        role: data?.role || 'member',
        permissions: data?.permissions || [],
      };
    }

    return { role: 'member', permissions: [] };
  }

  /**
   * Audit context switch for FDA 21 CFR Part 11 compliance
   */
  private async auditContextSwitch(
    userId: string,
    request: ContextSwitchRequest,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    try {
      await this.supabase.from('governance_audit_events').insert({
        event_type: 'context_switch',
        enterprise_id: request.enterpriseId,
        actor_type: 'human',
        actor_id: userId,
        event_payload: {
          target_context_type: request.contextType,
          target_enterprise_id: request.enterpriseId,
          target_workspace_id: request.workspaceId,
          target_partner_id: request.partnerId,
          success,
          failure_reason: failureReason,
          timestamp: new Date().toISOString(),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      });
    } catch (error) {
      console.error('[UnifiedAuthContext] Failed to audit context switch:', error);
      // Don't throw - audit failures shouldn't block context switching
    }
  }

  /**
   * Clear the current context (logout)
   */
  clearContext(): void {
    this.currentContext = null;
    this.contextCache.clear();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_context');
    }
  }

  /**
   * Restore context from session storage (page reload)
   */
  async restoreContext(): Promise<AuthContext | null> {
    if (typeof window === 'undefined') return null;

    const storedContext = sessionStorage.getItem('auth_context');
    if (!storedContext) return this.getCurrentContext();

    try {
      const parsed = JSON.parse(storedContext) as AuthContext;
      
      // Validate the stored context is still valid
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user || user.id !== parsed.userId) {
        this.clearContext();
        return this.getCurrentContext();
      }

      // Verify access is still valid
      const hasAccess = await this.validateContextAccess(user.id, {
        enterpriseId: parsed.enterpriseId,
        workspaceId: parsed.workspaceId,
        partnerId: parsed.partnerId,
        contextType: parsed.contextType,
      });

      if (!hasAccess) {
        this.clearContext();
        return this.getCurrentContext();
      }

      this.currentContext = parsed;
      return parsed;
    } catch {
      this.clearContext();
      return this.getCurrentContext();
    }
  }

  /**
   * Check if user has a specific permission in current context
   */
  hasPermission(permission: string): boolean {
    if (!this.currentContext) return false;
    return this.currentContext.permissions.includes(permission);
  }

  /**
   * Check if user has admin role in current context
   */
  isAdmin(): boolean {
    if (!this.currentContext) return false;
    return ['owner', 'admin'].includes(this.currentContext.role);
  }

  /**
   * Get the Supabase client (for direct queries)
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const unifiedAuthContext = new UnifiedAuthContextService();

// ============================================================
// REACT HOOK (for use in components)
// ============================================================

import { useState, useEffect, useCallback } from 'react';

export function useUnifiedAuthContext() {
  const [currentContext, setCurrentContext] = useState<AuthContext | null>(null);
  const [availableContexts, setAvailableContexts] = useState<AvailableContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial context
  useEffect(() => {
    const loadContext = async () => {
      try {
        setIsLoading(true);
        const context = await unifiedAuthContext.restoreContext();
        setCurrentContext(context);
        
        const contexts = await unifiedAuthContext.getAvailableContexts();
        setAvailableContexts(contexts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load context'));
      } finally {
        setIsLoading(false);
      }
    };

    loadContext();
  }, []);

  // Switch context handler
  const switchContext = useCallback(async (request: ContextSwitchRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const newContext = await unifiedAuthContext.switchContext(request);
      setCurrentContext(newContext);
      return newContext;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch context');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear context handler
  const clearContext = useCallback(() => {
    unifiedAuthContext.clearContext();
    setCurrentContext(null);
  }, []);

  // Permission check
  const hasPermission = useCallback((permission: string) => {
    return currentContext?.permissions.includes(permission) || false;
  }, [currentContext]);

  // Admin check
  const isAdmin = useCallback(() => {
    return currentContext?.role ? ['owner', 'admin'].includes(currentContext.role) : false;
  }, [currentContext]);

  return {
    currentContext,
    availableContexts,
    isLoading,
    error,
    switchContext,
    clearContext,
    hasPermission,
    isAdmin,
  };
}

