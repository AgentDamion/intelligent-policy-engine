import { PolicyObjectModel } from "@/types/policyObjectModel";
import { AIToolVersion } from "@/types/aiTools";

/**
 * Service for adapting policy templates to specific AI tool versions
 * with deep capability mapping and risk injection
 */
export class PolicyAdaptationService {
  /**
   * Adapt a base POM from a template to a specific tool version
   * Enhanced with deep capability mapping
   */
  static adaptPOM(
    basePOM: PolicyObjectModel,
    toolVersion: AIToolVersion,
    useCase: string,
    jurisdiction: string[],
    audience: string[]
  ): PolicyObjectModel {
    // Deep clone the base POM
    const adapted: PolicyObjectModel = JSON.parse(JSON.stringify(basePOM));

    // Update basic metadata
    adapted.policy_id = crypto.randomUUID();
    adapted.version = '1.0';
    adapted.scope = audience;
    adapted.metadata = {
      ...adapted.metadata,
      created_at: new Date().toISOString(),
    };

    // Update tool and use case
    adapted.tool = {
      name: `Tool Version ${toolVersion.version}`,
      version: toolVersion.version,
      provider: 'AI Provider',
      id: toolVersion.id,
    };

    adapted.use_case = {
      category: useCase,
      jurisdiction,
      audience,
    };

    // Inject tool-specific data
    const capabilities = toolVersion.capabilities as any;
    adapted.tools = [{
      name: `Tool Version ${toolVersion.version}`,
      version: toolVersion.version,
      provider: 'AI Provider',
      purpose: [useCase],
      approval: {
        status: 'preapproved' as const,
        by: 'system',
        date: new Date().toISOString(),
      },
      contexts: {
        client_data_allowed: true,
        public_data_only: false,
        pii_allowed: false,
      },
    }];

    // Deep capability mapping: Multimodal support
    if (capabilities?.multimodal) {
      // Add multimodal data classes
      adapted.data_profile = adapted.data_profile || {
        classes: [],
        sources: [],
        transfers: [],
      };
      
      if (!adapted.data_profile.classes.includes('images')) {
        adapted.data_profile.classes.push('images');
      }
      if (!adapted.data_profile.classes.includes('audio')) {
        adapted.data_profile.classes.push('audio');
      }
      if (!adapted.data_profile.classes.includes('video')) {
        adapted.data_profile.classes.push('video');
      }

      // Inject multimodal-specific risks
      adapted.risks = adapted.risks || [];
      adapted.risks.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        description: 'Multimodal inputs may contain sensitive visual or audio information',
      });
    }

    // Deep capability mapping: Fine-tuning risks
    if (capabilities?.fine_tunable) {
      adapted.risks = adapted.risks || [];
      adapted.risks.push({
        id: crypto.randomUUID(),
        severity: 'high',
        description: 'Model training creates persistent copies of input data',
      });

      // Add guardrail to block fine-tuning without consent
      adapted.guardrails = adapted.guardrails || {
        blocked_actions: [],
      };
      if (!adapted.guardrails.blocked_actions.includes('fine_tune_without_consent')) {
        adapted.guardrails.blocked_actions.push('fine_tune_without_consent');
      }
    }

    // Deep capability mapping: Function calling risks
    if (capabilities?.function_calling) {
      adapted.risks = adapted.risks || [];
      adapted.risks.push({
        id: crypto.randomUUID(),
        severity: 'high',
        description: 'Function calling may trigger unintended external API calls or data access',
      });

      // Add guardrail for function allowlisting
      adapted.guardrails = adapted.guardrails || {
        blocked_actions: [],
      };
      if (!adapted.guardrails.blocked_actions.includes('unapproved_function_calls')) {
        adapted.guardrails.blocked_actions.push('unapproved_function_calls');
      }
    }

    // Deep capability mapping: Context window
    // Note: Context window is stored in the tool version capabilities, not in metadata

    // Update lifecycle status
    adapted.lifecycle = {
      status: 'draft',
    };

    // Enhance usage disclosure
    adapted.usage_disclosure = {
      ...adapted.usage_disclosure,
      allowed_ai_usage: [useCase],
      disclosure_required: true,
    };

    return adapted;
  }

  /**
   * Validate that an adapted POM is complete and valid
   */
  static validateAdaptedPOM(pom: PolicyObjectModel): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pom.policy_id) errors.push('Missing policy_id');
    if (!pom.version) errors.push('Missing version');
    if (!pom.tools || pom.tools.length === 0) errors.push('No tools specified');
    if (!pom.metadata?.created_at) errors.push('Missing created_at timestamp');
    if (!pom.tool) errors.push('Missing tool binding');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate risk score based on tool capabilities and POM controls
   */
  static calculateRiskScore(pom: PolicyObjectModel, toolVersion: AIToolVersion): {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high';
    breakdown: Record<string, number>;
  } {
    const capabilities = toolVersion.capabilities as any;
    let score = 0;
    const breakdown: Record<string, number> = {};

    // Base risk from capabilities
    if (capabilities?.multimodal) {
      breakdown.multimodal = 15;
      score += 15;
    }
    if (capabilities?.fine_tunable) {
      breakdown.fine_tunable = 25;
      score += 25;
    }
    if (capabilities?.function_calling) {
      breakdown.function_calling = 20;
      score += 20;
    }
    if (capabilities?.context_window && capabilities.context_window > 100000) {
      breakdown.large_context = 10;
      score += 10;
    }

    // Mitigation from POM controls
    const mitigationFactor = pom.risks ? Math.min(pom.risks.length * 5, 40) : 0;
    score -= mitigationFactor;
    breakdown.mitigation = -mitigationFactor;

    // Guardrails reduce risk
    const guardrailFactor = pom.guardrails?.blocked_actions?.length || 0;
    score -= guardrailFactor * 3;
    breakdown.guardrails = -guardrailFactor * 3;

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    const level = score < 30 ? 'low' : score < 60 ? 'medium' : 'high';

    return { score, level, breakdown };
  }
}