import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing partner governance workflows
 * Handles client-agency relationships, policy inheritance, and dual approvals
 */
export class PartnerGovernanceService {
  /**
   * Check if a workspace is a brand workspace (partner scenario)
   */
  static async isBrandWorkspace(workspaceId: string): Promise<{
    isBrand: boolean;
    agencyWorkspaceId?: string;
    clientEnterpriseId?: string;
  }> {
    const { data, error } = await supabase
      .from('brand_workspaces')
      .select('agency_workspace_id, client_enterprise_id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking brand workspace:', error);
      return { isBrand: false };
    }

    return {
      isBrand: !!data,
      agencyWorkspaceId: data?.agency_workspace_id,
      clientEnterpriseId: data?.client_enterprise_id,
    };
  }

  /**
   * Get client-agency relationship permissions
   */
  static async getRelationshipPermissions(
    clientEnterpriseId: string,
    agencyEnterpriseId: string
  ): Promise<{
    canViewPolicies: boolean;
    canSubmitReviews: boolean;
    canManageBrands: boolean;
  } | null> {
    const { data, error } = await supabase
      .from('client_agency_relationships')
      .select('permissions')
      .eq('client_enterprise_id', clientEnterpriseId)
      .eq('agency_enterprise_id', agencyEnterpriseId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching relationship permissions:', error);
      return null;
    }

    const perms = data.permissions as any;
    return {
      canViewPolicies: perms.can_view_policies ?? false,
      canSubmitReviews: perms.can_submit_reviews ?? false,
      canManageBrands: perms.can_manage_brands ?? false,
    };
  }

  /**
   * Get policies shared between client and agency
   */
  static async getSharedPolicies(
    clientEnterpriseId: string,
    agencyEnterpriseId: string
  ) {
    // Get client policies
    const { data: clientPolicies, error: clientError } = await supabase
      .from('policy_instances')
      .select('*')
      .eq('enterprise_id', clientEnterpriseId);

    // Get agency policies
    const { data: agencyPolicies, error: agencyError } = await supabase
      .from('policy_instances')
      .select('*')
      .eq('enterprise_id', agencyEnterpriseId);

    if (clientError || agencyError) {
      throw new Error('Failed to fetch shared policies');
    }

    return {
      clientPolicies: clientPolicies || [],
      agencyPolicies: agencyPolicies || [],
    };
  }

  /**
   * Detect conflicts between client and agency policies
   */
  static detectPolicyConflicts(
    clientPOM: any,
    agencyPOM: any
  ): Array<{
    field: string;
    clientValue: any;
    agencyValue: any;
    severity: 'high' | 'medium' | 'low';
  }> {
    const conflicts: Array<{
      field: string;
      clientValue: any;
      agencyValue: any;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    // Check HITL requirements
    if (clientPOM?.controls?.hitl?.required !== agencyPOM?.controls?.hitl?.required) {
      conflicts.push({
        field: 'controls.hitl.required',
        clientValue: clientPOM?.controls?.hitl?.required,
        agencyValue: agencyPOM?.controls?.hitl?.required,
        severity: 'high',
      });
    }

    // Check data isolation
    if (
      clientPOM?.data_controls?.isolation?.per_client_workspace !==
      agencyPOM?.data_controls?.isolation?.per_client_workspace
    ) {
      conflicts.push({
        field: 'data_controls.isolation.per_client_workspace',
        clientValue: clientPOM?.data_controls?.isolation?.per_client_workspace,
        agencyValue: agencyPOM?.data_controls?.isolation?.per_client_workspace,
        severity: 'high',
      });
    }

    // Check third-party data sharing
    if (
      clientPOM?.data_controls?.third_parties?.data_sharing_allowed !==
      agencyPOM?.data_controls?.third_parties?.data_sharing_allowed
    ) {
      conflicts.push({
        field: 'data_controls.third_parties.data_sharing_allowed',
        clientValue: clientPOM?.data_controls?.third_parties?.data_sharing_allowed,
        agencyValue: agencyPOM?.data_controls?.third_parties?.data_sharing_allowed,
        severity: 'medium',
      });
    }

    // Check guardrails
    const clientBlockedActions = clientPOM?.guardrails?.blocked_actions || [];
    const agencyBlockedActions = agencyPOM?.guardrails?.blocked_actions || [];
    
    const clientOnlyBlocked = clientBlockedActions.filter(
      (action: string) => !agencyBlockedActions.includes(action)
    );
    const agencyOnlyBlocked = agencyBlockedActions.filter(
      (action: string) => !clientBlockedActions.includes(action)
    );

    if (clientOnlyBlocked.length > 0 || agencyOnlyBlocked.length > 0) {
      conflicts.push({
        field: 'guardrails.blocked_actions',
        clientValue: clientOnlyBlocked,
        agencyValue: agencyOnlyBlocked,
        severity: 'medium',
      });
    }

    return conflicts;
  }

  /**
   * Create dual approval request for policy change
   */
  static async createDualApprovalRequest(
    policyInstanceId: string,
    clientEnterpriseId: string,
    agencyEnterpriseId: string,
    changeDescription: string
  ) {
    // Create approval workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('approval_workflows')
      .insert({
        document_id: policyInstanceId,
        document_type: 'policy_instance',
        workflow_name: 'Partner Policy Update',
        current_stage: 'Client Approval',
        enterprise_id: clientEnterpriseId,
        stages: [
          {
            name: 'Client Approval',
            assignees: [`enterprise:${clientEnterpriseId}`],
            estimatedDuration: 48,
            required_approvals: 1,
          },
          {
            name: 'Agency Approval',
            assignees: [`enterprise:${agencyEnterpriseId}`],
            estimatedDuration: 24,
            required_approvals: 1,
          },
        ],
        metadata: {
          change_description: changeDescription,
          partner_approval_required: true,
        },
      })
      .select()
      .single();

    if (workflowError) {
      throw new Error('Failed to create dual approval workflow');
    }

    return workflow;
  }

  /**
   * Track partner governance event in audit trail
   */
  static async trackPartnerEvent(
    eventType: string,
    details: {
      initiatingEnterpriseId: string;
      partnerEnterpriseId: string;
      workspaceId?: string;
      policyInstanceId?: string;
      action: string;
      metadata?: Record<string, any>;
    }
  ) {
    const { error } = await supabase.from('audit_events').insert({
      event_type: `partner_${eventType}`,
      entity_type: 'partner_relationship',
      entity_id: details.policyInstanceId,
      workspace_id: details.workspaceId,
      enterprise_id: details.initiatingEnterpriseId,
      details: {
        partner_enterprise_id: details.partnerEnterpriseId,
        action: details.action,
        ...details.metadata,
      },
    });

    if (error) {
      console.error('Failed to track partner event:', error);
    }
  }

  /**
   * Check if policy requires dual approval based on partner governance rules
   */
  static async requiresDualApproval(
    policyInstanceId: string,
    workspaceId: string
  ): Promise<boolean> {
    // Check if workspace is a brand workspace
    const brandInfo = await this.isBrandWorkspace(workspaceId);
    if (!brandInfo.isBrand) {
      return false;
    }

    // Get policy instance
    const { data: instance, error } = await supabase
      .from('policy_instances')
      .select('pom')
      .eq('id', policyInstanceId)
      .single();

    if (error || !instance) {
      return false;
    }

    // Check if POM requires dual approval
    const pom = instance.pom as any;
    return pom?.guardrails?.dual_approval_required === true;
  }
}
