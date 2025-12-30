import { supabase } from '@/lib/supabase';

export interface WorkflowConfig {
  id: string;
  agency_enterprise_id: string;
  client_enterprise_id: string;
  brand_id?: string;
  workflow_name?: string;
  description?: string;
  config: {
    approval_chain: string[]; // Role archetype IDs
    parallel_approvals: boolean;
    skip_preapproval: boolean;
    escalation_timeout_hours: number;
    auto_approve_low_risk: boolean;
    require_compliance_review: boolean;
    require_legal_review: boolean;
    skip_logic?: Array<{
      condition: string; // e.g., "requestor_role == 'creative_director'"
      skip_steps: string[]; // Role archetype IDs to skip
    }>;
    conditional_routing?: Array<{
      condition: string; // e.g., "risk_score > 0.7"
      add_steps: string[]; // Role archetype IDs to add
    }>;
  };
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface WorkflowConfigInput {
  agency_enterprise_id: string;
  client_enterprise_id: string;
  brand_id?: string;
  workflow_name?: string;
  description?: string;
  config: WorkflowConfig['config'];
  priority?: number;
  is_active?: boolean;
}

export interface SampleSubmission {
  risk_score: number;
  requestor_role: string;
  tool_type?: string;
  use_case?: string;
}

class WorkflowService {
  /**
   * Get all workflow configs for a relationship
   */
  async getWorkflowConfigs(
    agencyId: string,
    clientId: string,
    brandId?: string
  ): Promise<{ data: WorkflowConfig[] | null; error: any }> {
    try {
      let query = supabase
        .from('workflow_configs')
        .select('*')
        .eq('agency_enterprise_id', agencyId)
        .eq('client_enterprise_id', clientId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (brandId) {
        query = query.or(`brand_id.eq.${brandId},brand_id.is.null`);
      }

      const { data, error } = await query;

      return { data: data as WorkflowConfig[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get a single workflow config by ID
   */
  async getWorkflowConfig(id: string): Promise<{ data: WorkflowConfig | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('workflow_configs')
        .select('*')
        .eq('id', id)
        .single();

      return { data: data as WorkflowConfig | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create a new workflow config
   */
  async createWorkflowConfig(
    config: WorkflowConfigInput
  ): Promise<{ data: WorkflowConfig | null; error: any }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await supabase
        .from('workflow_configs')
        .insert({
          ...config,
          created_by: userId,
          priority: config.priority ?? 0,
          is_active: config.is_active ?? true,
        })
        .select()
        .single();

      return { data: data as WorkflowConfig | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update an existing workflow config
   */
  async updateWorkflowConfig(
    id: string,
    updates: Partial<WorkflowConfigInput>
  ): Promise<{ data: WorkflowConfig | null; error: any }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await supabase
        .from('workflow_configs')
        .update({
          ...updates,
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      return { data: data as WorkflowConfig | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete a workflow config
   */
  async deleteWorkflowConfig(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.from('workflow_configs').delete().eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get effective workflow config for a relationship (uses database function)
   */
  async getEffectiveWorkflowConfig(
    agencyId: string,
    clientId: string,
    brandId?: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_effective_workflow_config', {
        p_agency_enterprise_id: agencyId,
        p_client_enterprise_id: clientId,
        p_brand_id: brandId || null,
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get required approvers for a submission (uses database function)
   */
  async getRequiredApprovers(
    agencyId: string,
    clientId: string,
    brandId: string | null,
    riskScore: number,
    submissionType: string = 'standard'
  ): Promise<{ data: string[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_required_approvers', {
        p_agency_enterprise_id: agencyId,
        p_client_enterprise_id: clientId,
        p_brand_id: brandId,
        p_risk_score: riskScore,
        p_submission_type: submissionType,
      });

      return { data: data as string[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Test a workflow config with sample submission data
   */
  async testWorkflowConfig(
    config: WorkflowConfig,
    sampleSubmission: SampleSubmission
  ): Promise<{
    triggeredSteps: string[];
    skippedSteps: string[];
    addedSteps: string[];
    estimatedTime: number;
  }> {
    const triggeredSteps: string[] = [];
    const skippedSteps: string[] = [];
    const addedSteps: string[] = [];

    // Start with base approval chain
    let steps = [...config.config.approval_chain];

    // Apply skip logic
    if (config.config.skip_logic) {
      for (const skipRule of config.config.skip_logic) {
        // Simple condition evaluation (in production, use a proper expression evaluator)
        if (this.evaluateCondition(skipRule.condition, sampleSubmission)) {
          skippedSteps.push(...skipRule.skip_steps);
          steps = steps.filter((step) => !skipRule.skip_steps.includes(step));
        }
      }
    }

    // Apply conditional routing
    if (config.config.conditional_routing) {
      for (const routeRule of config.config.conditional_routing) {
        if (this.evaluateCondition(routeRule.condition, sampleSubmission)) {
          addedSteps.push(...routeRule.add_steps);
          steps.push(...routeRule.add_steps);
        }
      }
    }

    // Add required reviews
    if (config.config.require_compliance_review && !steps.includes('compliance_reviewer')) {
      steps.push('compliance_reviewer');
      addedSteps.push('compliance_reviewer');
    }

    if (config.config.require_legal_review && !steps.includes('legal_counsel')) {
      steps.push('legal_counsel');
      addedSteps.push('legal_counsel');
    }

    // Check auto-approve
    if (config.config.auto_approve_low_risk && sampleSubmission.risk_score < 0.3) {
      return {
        triggeredSteps: [],
        skippedSteps: steps,
        addedSteps: [],
        estimatedTime: 0,
      };
    }

    triggeredSteps.push(...steps);

    // Estimate time (hours per step * escalation timeout)
    const estimatedTime = steps.length * config.config.escalation_timeout_hours;

    return {
      triggeredSteps,
      skippedSteps,
      addedSteps,
      estimatedTime,
    };
  }

  /**
   * Simple condition evaluator (for testing)
   * In production, use a proper expression evaluator library
   */
  private evaluateCondition(condition: string, submission: SampleSubmission): boolean {
    try {
      // Simple string-based evaluation
      if (condition.includes('requestor_role')) {
        const match = condition.match(/requestor_role\s*==\s*['"]([^'"]+)['"]/);
        if (match) {
          return submission.requestor_role === match[1];
        }
      }

      if (condition.includes('risk_score')) {
        const match = condition.match(/risk_score\s*([><=]+)\s*([\d.]+)/);
        if (match) {
          const operator = match[1];
          const value = parseFloat(match[2]);
          switch (operator) {
            case '>':
              return submission.risk_score > value;
            case '<':
              return submission.risk_score < value;
            case '>=':
              return submission.risk_score >= value;
            case '<=':
              return submission.risk_score <= value;
            case '==':
              return submission.risk_score === value;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}

export const workflowService = new WorkflowService();

