import { supabase } from "@/integrations/supabase/client";

export interface PolicyViolation {
  rule_id: string;
  severity: 'error' | 'warning';
  message: string;
  policy_instance_id: string;
  binding_id: string;
}

export interface ValidationResult {
  allowed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
  binding_ids_checked: string[];
}

export interface UsageContext {
  use_case?: string;
  data_classification?: string[];
  jurisdiction?: string[];
  user_role?: string;
}

export class PolicyValidationService {
  static async validateAIUsage(
    toolVersionId: string,
    workspaceId: string,
    usageContext: UsageContext
  ): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-ai-usage', {
        body: {
          tool_version_id: toolVersionId,
          workspace_id: workspaceId,
          usage_context: usageContext
        }
      });

      if (error) {
        console.error('Policy validation error:', error);
        throw new Error(`Validation failed: ${error.message}`);
      }

      return data as ValidationResult;
    } catch (error) {
      console.error('Error calling validate-ai-usage:', error);
      throw error;
    }
  }

  static async toggleBinding(bindingId: string, status: 'active' | 'inactive'): Promise<void> {
    const { error } = await supabase
      .from('runtime_bindings')
      .update({ status })
      .eq('id', bindingId);

    if (error) {
      console.error('Error toggling binding:', error);
      throw error;
    }
  }

  static async updateStatus(bindingId: string, status: 'active' | 'inactive') {
    const { error } = await supabase
      .from('runtime_bindings')
      .update({ status })
      .eq('id', bindingId);

    if (error) {
      console.error('Error updating binding status:', error);
      throw error;
    }
  }
}
