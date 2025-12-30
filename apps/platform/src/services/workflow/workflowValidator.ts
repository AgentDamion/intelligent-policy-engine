import { WorkflowConfig } from './workflowService';

export interface ValidationError {
  field: string;
  message: string;
}

export class WorkflowValidator {
  /**
   * Validate workflow config structure
   */
  static validateConfig(config: WorkflowConfig['config']): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate approval_chain
    if (!Array.isArray(config.approval_chain)) {
      errors.push({
        field: 'approval_chain',
        message: 'Approval chain must be an array',
      });
    } else if (config.approval_chain.length === 0) {
      errors.push({
        field: 'approval_chain',
        message: 'Approval chain must contain at least one step',
      });
    }

    // Validate parallel_approvals
    if (typeof config.parallel_approvals !== 'boolean') {
      errors.push({
        field: 'parallel_approvals',
        message: 'Parallel approvals must be a boolean',
      });
    }

    // Validate skip_preapproval
    if (typeof config.skip_preapproval !== 'boolean') {
      errors.push({
        field: 'skip_preapproval',
        message: 'Skip preapproval must be a boolean',
      });
    }

    // Validate escalation_timeout_hours
    if (typeof config.escalation_timeout_hours !== 'number') {
      errors.push({
        field: 'escalation_timeout_hours',
        message: 'Escalation timeout must be a number',
      });
    } else if (config.escalation_timeout_hours < 1 || config.escalation_timeout_hours > 168) {
      errors.push({
        field: 'escalation_timeout_hours',
        message: 'Escalation timeout must be between 1 and 168 hours',
      });
    }

    // Validate auto_approve_low_risk
    if (typeof config.auto_approve_low_risk !== 'boolean') {
      errors.push({
        field: 'auto_approve_low_risk',
        message: 'Auto approve low risk must be a boolean',
      });
    }

    // Validate require_compliance_review
    if (typeof config.require_compliance_review !== 'boolean') {
      errors.push({
        field: 'require_compliance_review',
        message: 'Require compliance review must be a boolean',
      });
    }

    // Validate require_legal_review
    if (typeof config.require_legal_review !== 'boolean') {
      errors.push({
        field: 'require_legal_review',
        message: 'Require legal review must be a boolean',
      });
    }

    // Validate skip_logic
    if (config.skip_logic) {
      if (!Array.isArray(config.skip_logic)) {
        errors.push({
          field: 'skip_logic',
          message: 'Skip logic must be an array',
        });
      } else {
        config.skip_logic.forEach((rule, index) => {
          if (!rule.condition || typeof rule.condition !== 'string') {
            errors.push({
              field: `skip_logic[${index}].condition`,
              message: 'Skip logic condition must be a string',
            });
          }
          if (!Array.isArray(rule.skip_steps)) {
            errors.push({
              field: `skip_logic[${index}].skip_steps`,
              message: 'Skip steps must be an array',
            });
          }
        });
      }
    }

    // Validate conditional_routing
    if (config.conditional_routing) {
      if (!Array.isArray(config.conditional_routing)) {
        errors.push({
          field: 'conditional_routing',
          message: 'Conditional routing must be an array',
        });
      } else {
        config.conditional_routing.forEach((route, index) => {
          if (!route.condition || typeof route.condition !== 'string') {
            errors.push({
              field: `conditional_routing[${index}].condition`,
              message: 'Conditional routing condition must be a string',
            });
          }
          if (!Array.isArray(route.add_steps)) {
            errors.push({
              field: `conditional_routing[${index}].add_steps`,
              message: 'Add steps must be an array',
            });
          }
        });
      }
    }

    return errors;
  }

  /**
   * Validate that approval_chain contains valid role archetypes
   */
  static async validateRoleArchetypes(
    approvalChain: string[]
  ): Promise<{ valid: boolean; invalidRoles: string[] }> {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: archetypes, error } = await supabase
        .from('role_archetypes')
        .select('id');

      if (error || !archetypes) {
        return { valid: false, invalidRoles: approvalChain };
      }

      const validArchetypeIds = archetypes.map((a: any) => a.id);
      const invalidRoles = approvalChain.filter((role) => !validArchetypeIds.includes(role));

      return {
        valid: invalidRoles.length === 0,
        invalidRoles,
      };
    } catch {
      return { valid: false, invalidRoles: approvalChain };
    }
  }

  /**
   * Check for circular dependencies in conditional routing
   */
  static checkCircularDependencies(config: WorkflowConfig['config']): ValidationError[] {
    const errors: ValidationError[] = [];

    if (config.conditional_routing) {
      // Simple check: ensure no step adds itself
      config.conditional_routing.forEach((route, index) => {
        const baseChain = config.approval_chain;
        route.add_steps.forEach((step) => {
          if (baseChain.includes(step)) {
            errors.push({
              field: `conditional_routing[${index}].add_steps`,
              message: `Step "${step}" is already in the approval chain`,
            });
          }
        });
      });
    }

    return errors;
  }

  /**
   * Validate complete workflow config
   */
  static async validateWorkflowConfig(
    config: WorkflowConfig
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validate config structure
    errors.push(...this.validateConfig(config.config));

    // Validate role archetypes
    const archetypeValidation = await this.validateRoleArchetypes(config.config.approval_chain);
    if (!archetypeValidation.valid) {
      archetypeValidation.invalidRoles.forEach((role) => {
        errors.push({
          field: 'approval_chain',
          message: `Invalid role archetype: "${role}"`,
        });
      });
    }

    // Check for circular dependencies
    errors.push(...this.checkCircularDependencies(config.config));

    return errors;
  }
}

