import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Type for the observability context passed from cursor-agent-adapter
interface ObservabilityContext {
  logReasoning: (reasoning: string) => Promise<{ id: string } | null>;
  logToolCall: (toolName: string, args: Record<string, unknown>, result?: unknown, durationMs?: number, error?: string) => Promise<{ callId: string; responseId: string } | null>;
  getStepCount: () => number;
}

/**
 * PolicyDefinitionAgent - Conversational Policy Creation
 * 
 * Responsibilities:
 * - Guide users through policy definition via natural conversation
 * - Convert natural language inputs to structured POM schema
 * - Validate policy consistency and completeness
 * - Persist policies to database with full audit trail
 * - Handle error cases and ambiguous inputs gracefully
 */

// ============= Types & Interfaces =============

export type ConversationPhase = 
  | 'context_gathering'
  | 'policy_goals'
  | 'boundary_rules'
  | 'controls_governance'
  | 'validation_refinement'
  | 'complete';

export interface ConversationState {
  phase: ConversationPhase;
  completion_percentage: number;
  pom_draft: Partial<PolicyObjectModel>;
  pending_confirmation?: {
    data: any;
    confidence: number;
    message: string;
  };
  conversation_history: ConversationMessage[];
  started_at: string;
  last_activity_at: string;
  enterprise_id: string;
  user_id?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyObjectModel {
  // Core policy metadata
  tool: {
    name: string;
    version?: string;
    provider?: string;
  };
  use_case: {
    title: string;
    description: string;
    business_value?: string;
  };
  
  // NEW: Boundary rules for middleware governance
  boundary_rules?: {
    model_restrictions?: {
      allowed_models?: string[];
      blocked_models?: string[];
      default_model?: string;
    };
    content_filters?: {
      block_patterns?: string[];
      allow_patterns?: string[];
      pii_detection_enabled?: boolean;
      phi_detection_enabled?: boolean;
    };
    rate_limits?: {
      max_requests_per_minute?: number;
      max_requests_per_hour?: number;
      max_requests_per_day?: number;
      max_concurrent_requests?: number;
    };
    cost_controls?: {
      max_cost_per_request?: number;
      max_monthly_spend?: number;
      cost_alert_threshold?: number;
    };
  };
  
  // Governance
  governance: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    approval_required: boolean;
    data_scope: ('public' | 'internal' | 'confidential' | 'restricted')[];
  };
  
  // Auditability
  auditability?: {
    retention_period_days: number;
    log_level: 'basic' | 'detailed' | 'comprehensive';
    encryption_required: boolean;
  };
  
  // Context
  jurisdiction: string[];
  audience: string[];
  
  // Metadata
  metadata?: {
    created_by_agent: boolean;
    conversation_id?: string;
    confidence_score?: number;
  };
}

export interface ExtractionResult {
  data: Partial<PolicyObjectModel>;
  confidence: number;
  phase_complete: boolean;
  issues?: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  message: string;
  suggestion?: string;
}

export interface PolicyDefinitionInput {
  message: string;
  conversation_id?: string;
  enterprise_id: string;
  user_id?: string;
}

export interface PolicyDefinitionOutput {
  message: string;
  phase: ConversationPhase;
  completion_percentage: number;
  pom_draft: Partial<PolicyObjectModel>;
  next_question?: string;
  requires_confirmation?: boolean;
  policy_id?: string;
  status: 'in_progress' | 'complete' | 'error';
}

// ============= PolicyDefinitionAgent Class =============

export class PolicyDefinitionAgent {
  private supabase: SupabaseClient;
  private readonly LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
  private readonly CONFIDENCE_THRESHOLD = 0.75;
  private readonly CONVERSATION_TIMEOUT_MINUTES = 30;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Main entry point for policy definition conversation
   */
  async process(
    input: PolicyDefinitionInput,
    context: Record<string, unknown>
  ): Promise<PolicyDefinitionOutput> {
    const startTime = Date.now();
    
    // Get observability context if provided
    const obsContext = context._observability as ObservabilityContext | undefined;

    console.log('PolicyDefinitionAgent processing:', {
      conversation_id: input.conversation_id,
      enterprise_id: input.enterprise_id,
      message_length: input.message.length
    });

    try {
      // Log reasoning: Starting conversation processing
      await obsContext?.logReasoning(
        `Processing policy definition message for enterprise ${input.enterprise_id}. ` +
        `Conversation ID: ${input.conversation_id || 'new'}. Message length: ${input.message.length} chars`
      );

      // Load or initialize conversation state
      const loadStateStart = Date.now();
      const state = input.conversation_id
        ? await this.loadConversationState(input.conversation_id)
        : this.initializeState(input.enterprise_id, input.user_id);

      // Log tool call for state loading
      await obsContext?.logToolCall(
        'loadConversationState',
        { conversationId: input.conversation_id, enterpriseId: input.enterprise_id },
        { phase: state.phase, completion: state.completion_percentage },
        Date.now() - loadStateStart
      );

      // Check for timeout
      if (this.checkConversationTimeout(state)) {
        await obsContext?.logReasoning('Conversation timed out. Saving draft and returning timeout message.');
        return await this.handleTimeout(state);
      }

      // Add user message to history
      state.conversation_history.push({
        role: 'user',
        content: input.message,
        timestamp: new Date().toISOString()
      });

      // Extract policy data from user input
      await obsContext?.logReasoning(`Extracting policy data from user message. Current phase: ${state.phase}`);
      const extractionStart = Date.now();
      const extraction = await this.extractPolicyData(input.message, state, obsContext);
      
      // Log the extraction tool call
      await obsContext?.logToolCall(
        'extractPolicyData',
        { messageLength: input.message.length, phase: state.phase },
        { confidence: extraction.confidence, fieldsExtracted: Object.keys(extraction.data).length, issues: extraction.issues?.length || 0 },
        Date.now() - extractionStart
      );

      // Handle low confidence
      if (extraction.confidence < this.CONFIDENCE_THRESHOLD) {
        await obsContext?.logReasoning(`Low confidence extraction (${extraction.confidence.toFixed(2)}). Requesting user confirmation.`);
        return await this.handleLowConfidence(extraction, state);
      }

      // Validate consistency
      await obsContext?.logReasoning('Validating policy consistency across fields...');
      const consistencyIssues = await this.validateConsistency(
        { ...state.pom_draft, ...extraction.data },
        state.phase
      );

      // Handle critical consistency issues
      if (consistencyIssues.some(i => i.severity === 'critical')) {
        await obsContext?.logReasoning(
          `Found ${consistencyIssues.filter(i => i.severity === 'critical').length} critical consistency issues. ` +
          `Requesting resolution from user.`
        );
        return await this.handleConsistencyIssues(consistencyIssues, state);
      }

      // Merge extracted data into draft
      state.pom_draft = {
        ...state.pom_draft,
        ...extraction.data
      };

      // Update phase and completion
      const previousPhase = state.phase;
      const nextPhase = this.determineNextPhase(state);
      state.phase = nextPhase;
      state.completion_percentage = this.calculateCompletion(state);
      state.last_activity_at = new Date().toISOString();

      // Log phase transition
      if (previousPhase !== nextPhase) {
        await obsContext?.logReasoning(`Phase transition: ${previousPhase} → ${nextPhase}. Completion: ${state.completion_percentage}%`);
      }

      // Generate follow-up question
      const followUp = await this.generateFollowUpQuestion(state);

      // Save state
      const conversationId = await this.saveConversationState(state);

      // Check if policy is complete
      if (nextPhase === 'complete') {
        await obsContext?.logReasoning('Policy definition complete. Finalizing and saving policy to database.');
        const finalizeStart = Date.now();
        const policyId = await this.finalizePolicy(state);
        
        // Log the finalization
        await obsContext?.logToolCall(
          'finalizePolicy',
          { enterpriseId: state.enterprise_id, phasesCompleted: ['context_gathering', 'policy_goals', 'boundary_rules', 'controls_governance', 'validation_refinement'] },
          { policyId, success: true },
          Date.now() - finalizeStart
        );
        
        console.log('Policy definition complete:', {
          policy_id: policyId,
          processing_time_ms: Date.now() - startTime
        });

        return {
          message: "🎉 Policy successfully created! Your governance rules are now active.",
          phase: 'complete',
          completion_percentage: 100,
          pom_draft: state.pom_draft,
          policy_id: policyId,
          status: 'complete'
        };
      }

      console.log('PolicyDefinitionAgent step complete:', {
        phase: state.phase,
        completion: state.completion_percentage,
        processing_time_ms: Date.now() - startTime
      });

      return {
        message: followUp,
        phase: state.phase,
        completion_percentage: state.completion_percentage,
        pom_draft: state.pom_draft,
        next_question: followUp,
        status: 'in_progress'
      };

    } catch (error) {
      console.error('PolicyDefinitionAgent error:', error);
      
      // Log the error
      await obsContext?.logReasoning(`Policy definition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        message: "I encountered an error processing your request. Could you please rephrase your last input?",
        phase: 'context_gathering',
        completion_percentage: 0,
        pom_draft: {},
        status: 'error'
      };
    }
  }

  /**
   * Extract policy data from natural language using Lovable AI Gateway
   */
  private async extractPolicyData(
    userMessage: string,
    state: ConversationState,
    obsContext?: ObservabilityContext
  ): Promise<ExtractionResult> {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = this.getExtractionPrompt(userMessage, state);
    const tools = [this.getPOMExtractionTool()];

    try {
      const llmCallStart = Date.now();
      const response = await fetch(this.LOVABLE_AI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            ...state.conversation_history.slice(-10), // Last 10 messages for context
            { role: 'user', content: userMessage }
          ],
          tools,
          tool_choice: { type: 'function', function: { name: 'extract_policy_data' } }
        })
      });

      const llmDuration = Date.now() - llmCallStart;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI Gateway error:', response.status, errorText);
        
        // Log the failed LLM call
        await obsContext?.logToolCall(
          'lovable_ai_gateway',
          { model: 'google/gemini-2.5-flash', messageCount: state.conversation_history.length + 2 },
          undefined,
          llmDuration,
          `API error: ${response.status}`
        );
        
        // FAILURE TYPE A: API error - use fallback
        return this.fallbackTextExtraction(userMessage, state);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      // Log the successful LLM call
      await obsContext?.logToolCall(
        'lovable_ai_gateway',
        { model: 'google/gemini-2.5-flash', messageCount: state.conversation_history.length + 2, toolRequested: 'extract_policy_data' },
        { toolCallReceived: !!toolCall, usage: data.usage },
        llmDuration
      );

      if (!toolCall) {
        // No tool call - use fallback
        return this.fallbackTextExtraction(userMessage, state);
      }

      // FAILURE TYPE A: Malformed JSON
      let extractedData: any;
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch (jsonError) {
        console.error('Malformed tool call JSON:', jsonError);
        return this.fallbackTextExtraction(userMessage, state);
      }

      // FAILURE TYPE B: Schema validation
      const validationResult = this.preValidateExtraction(extractedData);
      if (!validationResult.valid) {
        console.warn('Schema validation failed:', validationResult.errors);
        return {
          data: {},
          confidence: 0.3,
          phase_complete: false,
          issues: validationResult.errors.map(e => ({
            severity: 'high' as const,
            field: e.field,
            message: e.message,
            suggestion: e.suggestion
          }))
        };
      }

      // Calculate confidence based on completeness and clarity
      const confidence = this.calculateExtractionConfidence(extractedData, userMessage);

      return {
        data: extractedData,
        confidence,
        phase_complete: this.isPhaseComplete(extractedData, state.phase)
      };

    } catch (error) {
      console.error('Extraction error:', error);
      return this.fallbackTextExtraction(userMessage, state);
    }
  }

  /**
   * Pre-validate extracted data against expected schema
   */
  private preValidateExtraction(data: any): { valid: boolean; errors: any[] } {
    const errors: any[] = [];

    // Type validations
    if (data.boundary_rules?.rate_limits?.max_requests_per_day !== undefined) {
      if (typeof data.boundary_rules.rate_limits.max_requests_per_day !== 'number') {
        errors.push({
          field: 'boundary_rules.rate_limits.max_requests_per_day',
          message: 'max_requests_per_day must be a number',
          suggestion: 'Please provide a numeric value (e.g., 10000)'
        });
      }
    }

    if (data.boundary_rules?.model_restrictions?.allowed_models !== undefined) {
      if (!Array.isArray(data.boundary_rules.model_restrictions.allowed_models)) {
        errors.push({
          field: 'boundary_rules.model_restrictions.allowed_models',
          message: 'allowed_models must be an array',
          suggestion: 'Please provide a list of model names (e.g., ["gpt-4", "gpt-3.5-turbo"])'
        });
      }
    }

    // Regex pattern validation
    if (data.boundary_rules?.content_filters?.block_patterns) {
      const patterns = data.boundary_rules.content_filters.block_patterns;
      if (Array.isArray(patterns)) {
        for (const pattern of patterns) {
          try {
            new RegExp(pattern);
          } catch (e) {
            errors.push({
              field: 'boundary_rules.content_filters.block_patterns',
              message: `Invalid regex pattern: ${pattern}`,
              suggestion: 'Please provide valid regular expression patterns'
            });
          }
        }
      }
    }

    // Cost validation
    if (data.boundary_rules?.cost_controls?.max_monthly_spend !== undefined) {
      const spend = data.boundary_rules.cost_controls.max_monthly_spend;
      if (typeof spend !== 'number' || spend <= 0) {
        errors.push({
          field: 'boundary_rules.cost_controls.max_monthly_spend',
          message: 'max_monthly_spend must be a positive number',
          suggestion: 'Please provide a dollar amount (e.g., 5000 for $5,000)'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Fallback text extraction when structured extraction fails
   */
  private fallbackTextExtraction(
    userMessage: string,
    state: ConversationState
  ): ExtractionResult {
    const data: Partial<PolicyObjectModel> = {};
    
    // Basic keyword extraction
    const lowerMessage = userMessage.toLowerCase();
    
    // Tool/model detection
    if (lowerMessage.includes('gpt-4') || lowerMessage.includes('gpt4')) {
      data.boundary_rules = {
        ...data.boundary_rules,
        model_restrictions: {
          allowed_models: ['gpt-4']
        }
      };
    }

    // Risk level detection
    if (lowerMessage.includes('high risk') || lowerMessage.includes('critical')) {
      data.governance = {
        ...data.governance,
        risk_level: 'high',
        approval_required: true,
        data_scope: ['confidential']
      };
    }

    // Always return low confidence for fallback
    return {
      data,
      confidence: 0.4,
      phase_complete: false
    };
  }

  /**
   * Validate policy consistency across fields
   */
  private async validateConsistency(
    pom: Partial<PolicyObjectModel>,
    phase: ConversationPhase
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // RULE 1: High risk + low audit retention
    if (
      pom.governance?.risk_level &&
      ['high', 'critical'].includes(pom.governance.risk_level) &&
      pom.auditability?.retention_period_days &&
      pom.auditability.retention_period_days < 90
    ) {
      issues.push({
        severity: 'critical',
        field: 'auditability.retention_period_days',
        message: `Policy is marked as ${pom.governance.risk_level} risk but has only ${pom.auditability.retention_period_days} days retention`,
        suggestion: 'High-risk policies typically require 90+ days retention (or 7 years for HIPAA)'
      });
    }

    // RULE 2: Aggressive rate limits + high-volume use case
    if (
      pom.use_case?.description &&
      /high.volume|batch|bulk/i.test(pom.use_case.description) &&
      pom.boundary_rules?.rate_limits?.max_requests_per_day &&
      pom.boundary_rules.rate_limits.max_requests_per_day < 1000
    ) {
      issues.push({
        severity: 'high',
        field: 'boundary_rules.rate_limits.max_requests_per_day',
        message: 'Use case indicates high-volume usage but rate limit is very restrictive',
        suggestion: 'Consider increasing max_requests_per_day to at least 10,000'
      });
    }

    // RULE 3: Premium models + low cost cap
    if (
      pom.boundary_rules?.model_restrictions?.allowed_models &&
      pom.boundary_rules.model_restrictions.allowed_models.some(m => 
        m.includes('gpt-4') || m.includes('claude-3')
      ) &&
      pom.boundary_rules?.cost_controls?.max_monthly_spend &&
      pom.boundary_rules.cost_controls.max_monthly_spend < 100
    ) {
      issues.push({
        severity: 'high',
        field: 'boundary_rules.cost_controls.max_monthly_spend',
        message: 'Premium models allowed but monthly budget is very low',
        suggestion: 'Premium models can cost $0.01-0.10 per request. Consider raising budget.'
      });
    }

    // RULE 4: Sensitive data filters without proper scope
    if (
      (pom.boundary_rules?.content_filters?.pii_detection_enabled ||
       pom.boundary_rules?.content_filters?.phi_detection_enabled) &&
      pom.governance?.data_scope &&
      !pom.governance.data_scope.includes('confidential')
    ) {
      issues.push({
        severity: 'medium',
        field: 'governance.data_scope',
        message: 'PII/PHI detection enabled but data scope does not include "confidential"',
        suggestion: 'Update data_scope to include "confidential" or "restricted"'
      });
    }

    // RULE 5: PHI/PII without encryption
    if (
      pom.governance?.data_scope &&
      (pom.governance.data_scope.includes('confidential') || 
       pom.governance.data_scope.includes('restricted')) &&
      pom.auditability?.encryption_required === false
    ) {
      issues.push({
        severity: 'critical',
        field: 'auditability.encryption_required',
        message: 'Handling confidential/restricted data without encryption',
        suggestion: 'Enable encryption_required for compliance with data protection regulations'
      });
    }

    return issues;
  }

  /**
   * Handle consistency issues
   */
  private async handleConsistencyIssues(
    issues: ConsistencyIssue[],
    state: ConversationState
  ): Promise<PolicyDefinitionOutput> {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    let message = "⚠️ I've identified some important concerns with the policy configuration:\n\n";

    if (criticalIssues.length > 0) {
      message += "**Critical Issues:**\n";
      criticalIssues.forEach(issue => {
        message += `- ${issue.message}\n`;
        if (issue.suggestion) {
          message += `  💡 ${issue.suggestion}\n`;
        }
      });
      message += "\n";
    }

    if (highIssues.length > 0) {
      message += "**Important Recommendations:**\n";
      highIssues.forEach(issue => {
        message += `- ${issue.message}\n`;
        if (issue.suggestion) {
          message += `  💡 ${issue.suggestion}\n`;
        }
      });
    }

    message += "\nHow would you like to proceed? You can:\n";
    message += "1. Accept my suggestions and I'll update the policy\n";
    message += "2. Provide alternative values\n";
    message += "3. Override these warnings (not recommended for critical issues)";

    return {
      message,
      phase: state.phase,
      completion_percentage: state.completion_percentage,
      pom_draft: state.pom_draft,
      requires_confirmation: true,
      status: 'in_progress'
    };
  }

  /**
   * Handle low confidence extractions
   */
  private async handleLowConfidence(
    extraction: ExtractionResult,
    state: ConversationState
  ): Promise<PolicyDefinitionOutput> {
    const confirmationPrompt = this.buildConfirmationPrompt(extraction.data, state);

    state.pending_confirmation = {
      data: extraction.data,
      confidence: extraction.confidence,
      message: confirmationPrompt
    };

    await this.saveConversationState(state);

    return {
      message: confirmationPrompt,
      phase: state.phase,
      completion_percentage: state.completion_percentage,
      pom_draft: state.pom_draft,
      requires_confirmation: true,
      status: 'in_progress'
    };
  }

  /**
   * Build confirmation prompt for low-confidence data
   */
  private buildConfirmationPrompt(data: Partial<PolicyObjectModel>, state: ConversationState): string {
    const summary = this.summarizeExtraction(data);
    return `Thank you for the information. Let me confirm I understood correctly:\n\n${summary}\n\nIs this accurate, or should I adjust anything?`;
  }

  /**
   * Summarize extracted data for user confirmation
   */
  private summarizeExtraction(data: Partial<PolicyObjectModel>): string {
    const points: string[] = [];

    if (data.tool?.name) {
      points.push(`• AI Tool: ${data.tool.name} ${data.tool.version || ''}`);
    }

    if (data.use_case?.title) {
      points.push(`• Use Case: ${data.use_case.title}`);
    }

    if (data.boundary_rules?.model_restrictions?.allowed_models) {
      points.push(`• Allowed Models: ${data.boundary_rules.model_restrictions.allowed_models.join(', ')}`);
    }

    if (data.boundary_rules?.content_filters?.block_patterns) {
      points.push(`• Blocked Content Patterns: ${data.boundary_rules.content_filters.block_patterns.length} patterns`);
    }

    if (data.boundary_rules?.rate_limits) {
      const limits = data.boundary_rules.rate_limits;
      if (limits.max_requests_per_day) {
        points.push(`• Rate Limit: ${limits.max_requests_per_day.toLocaleString()} requests/day`);
      }
    }

    if (data.boundary_rules?.cost_controls?.max_monthly_spend) {
      points.push(`• Monthly Budget: $${data.boundary_rules.cost_controls.max_monthly_spend.toLocaleString()}`);
    }

    if (data.governance?.risk_level) {
      points.push(`• Risk Level: ${data.governance.risk_level}`);
    }

    if (data.auditability?.retention_period_days) {
      points.push(`• Log Retention: ${data.auditability.retention_period_days} days`);
    }

    return points.join('\n');
  }

  /**
   * Generate contextual follow-up question
   */
  private async generateFollowUpQuestion(state: ConversationState): Promise<string> {
    const phase = state.phase;
    const pom = state.pom_draft;

    // Context gathering phase
    if (phase === 'context_gathering') {
      if (!pom.tool?.name) {
        return "Let's start by defining which AI tool or service you want to govern. What tool are you using? (e.g., OpenAI GPT-4, Claude, Gemini)";
      }
      if (!pom.use_case?.title) {
        return "Great! Now, what's the primary use case for this AI tool? What business problem does it solve?";
      }
      if (!pom.jurisdiction || pom.jurisdiction.length === 0) {
        return "Which geographic regions or jurisdictions will this AI tool operate in? (e.g., US, EU, global)";
      }
    }

    // Policy goals phase
    if (phase === 'policy_goals') {
      if (!pom.governance?.risk_level) {
        return "How would you classify the risk level of this use case? (low, medium, high, or critical)";
      }
      if (!pom.governance?.data_scope) {
        return "What types of data will this AI tool process? (public, internal, confidential, restricted)";
      }
    }

    // Boundary rules phase (NEW)
    if (phase === 'boundary_rules') {
      if (!pom.boundary_rules?.model_restrictions) {
        return "Which specific AI models should be allowed for this use case? Or are there any models you want to explicitly block?";
      }
      if (!pom.boundary_rules?.content_filters) {
        return "Are there any content patterns you want to block? (e.g., credit card numbers, SSNs, profanity)";
      }
      if (!pom.boundary_rules?.rate_limits) {
        return "What rate limits would you like to set? For example, maximum requests per day or concurrent requests?";
      }
      if (!pom.boundary_rules?.cost_controls) {
        return "What's your budget for this AI tool? Should we set a maximum monthly spend or cost per request?";
      }
    }

    // Controls & governance phase
    if (phase === 'controls_governance') {
      if (!pom.auditability?.retention_period_days) {
        return "How long should audit logs be retained? Consider compliance requirements (e.g., 90 days, 1 year, 7 years for HIPAA).";
      }
      if (pom.auditability && pom.auditability.encryption_required === undefined) {
        return "Should encryption be required for audit logs and stored data?";
      }
    }

    // Validation phase
    if (phase === 'validation_refinement') {
      return "Let me review the policy... Everything looks good! Would you like to:\n1. Review the complete policy\n2. Make any final adjustments\n3. Activate the policy now";
    }

    return "Is there anything else you'd like to configure for this policy?";
  }

  /**
   * Determine next conversation phase
   */
  private determineNextPhase(state: ConversationState): ConversationPhase {
    const pom = state.pom_draft;

    // Check if current phase is complete
    switch (state.phase) {
      case 'context_gathering':
        if (pom.tool?.name && pom.use_case?.title && pom.jurisdiction && pom.jurisdiction.length > 0) {
          return 'policy_goals';
        }
        break;

      case 'policy_goals':
        if (pom.governance?.risk_level && pom.governance?.data_scope) {
          return 'boundary_rules';
        }
        break;

      case 'boundary_rules':
        if (pom.boundary_rules?.model_restrictions || 
            pom.boundary_rules?.content_filters ||
            pom.boundary_rules?.rate_limits ||
            pom.boundary_rules?.cost_controls) {
          return 'controls_governance';
        }
        break;

      case 'controls_governance':
        if (pom.auditability?.retention_period_days !== undefined) {
          return 'validation_refinement';
        }
        break;

      case 'validation_refinement':
        // Check if policy is complete and valid
        if (this.isPolicyComplete(pom)) {
          return 'complete';
        }
        break;
    }

    return state.phase; // Stay in current phase
  }

  /**
   * Calculate conversation completion percentage
   */
  private calculateCompletion(state: ConversationState): number {
    const pom = state.pom_draft;
    const requiredFields = [
      pom.tool?.name,
      pom.use_case?.title,
      pom.jurisdiction?.length,
      pom.governance?.risk_level,
      pom.governance?.data_scope,
      pom.boundary_rules,
      pom.auditability?.retention_period_days
    ];

    const completedFields = requiredFields.filter(f => f !== undefined && f !== null).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Check if phase is complete
   */
  private isPhaseComplete(data: Partial<PolicyObjectModel>, phase: ConversationPhase): boolean {
    switch (phase) {
      case 'context_gathering':
        return !!(data.tool?.name && data.use_case?.title);
      case 'policy_goals':
        return !!(data.governance?.risk_level);
      case 'boundary_rules':
        return !!(data.boundary_rules);
      case 'controls_governance':
        return !!(data.auditability?.retention_period_days);
      default:
        return false;
    }
  }

  /**
   * Check if entire policy is complete
   */
  private isPolicyComplete(pom: Partial<PolicyObjectModel>): boolean {
    return !!(
      pom.tool?.name &&
      pom.use_case?.title &&
      pom.jurisdiction?.length &&
      pom.governance?.risk_level &&
      pom.governance?.data_scope &&
      pom.auditability?.retention_period_days
    );
  }

  /**
   * Calculate extraction confidence
   */
  private calculateExtractionConfidence(data: any, userMessage: string): number {
    let confidence = 0.8; // Base confidence

    // Decrease confidence for vague inputs
    if (userMessage.length < 20) confidence -= 0.2;
    if (!/\d/.test(userMessage) && (data.boundary_rules?.rate_limits || data.boundary_rules?.cost_controls)) {
      confidence -= 0.15;
    }

    // Increase confidence for specific structured data
    if (data.boundary_rules?.model_restrictions?.allowed_models?.length > 0) confidence += 0.1;
    if (data.boundary_rules?.rate_limits?.max_requests_per_day) confidence += 0.1;

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  /**
   * Check conversation timeout
   */
  private checkConversationTimeout(state: ConversationState): boolean {
    const lastActivity = new Date(state.last_activity_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return minutesElapsed > this.CONVERSATION_TIMEOUT_MINUTES;
  }

  /**
   * Handle conversation timeout
   */
  private async handleTimeout(state: ConversationState): Promise<PolicyDefinitionOutput> {
    // Save draft policy
    if (Object.keys(state.pom_draft).length > 0) {
      await this.saveDraftPolicy(state);
    }

    return {
      message: "This conversation has been inactive for 30 minutes. I've saved your progress as a draft. Would you like to continue where we left off?",
      phase: state.phase,
      completion_percentage: state.completion_percentage,
      pom_draft: state.pom_draft,
      status: 'in_progress'
    };
  }

  /**
   * Save draft policy
   */
  private async saveDraftPolicy(state: ConversationState): Promise<string> {
    const { data, error } = await this.supabase
      .from('policy_instances')
      .insert({
        enterprise_id: state.enterprise_id,
        tool_version_id: state.pom_draft.tool?.name || 'unknown',
        use_case: state.pom_draft.use_case?.title || 'Draft Policy',
        jurisdiction: state.pom_draft.jurisdiction || [],
        audience: state.pom_draft.audience || [],
        pom: state.pom_draft,
        status: 'draft'
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Finalize and save complete policy
   */
  private async finalizePolicy(state: ConversationState): Promise<string> {
    const pom = state.pom_draft as PolicyObjectModel;

    // Add metadata
    pom.metadata = {
      ...pom.metadata,
      created_by_agent: true,
      conversation_id: state.conversation_history[0]?.timestamp,
      confidence_score: state.completion_percentage / 100
    };

    // Save policy instance
    const { data: policyData, error: policyError } = await this.supabase
      .from('policy_instances')
      .insert({
        enterprise_id: state.enterprise_id,
        tool_version_id: pom.tool.name,
        use_case: pom.use_case.title,
        jurisdiction: pom.jurisdiction,
        audience: pom.audience,
        pom: pom,
        status: 'active'
      })
      .select('id')
      .single();

    if (policyError) throw policyError;

    const policyId = policyData.id;

    // Save boundary rules if present
    if (pom.boundary_rules) {
      await this.saveBoundaryRules(policyId, pom.boundary_rules);
    }

    // Log agent activity
    await this.supabase.from('agent_activities').insert({
      agent: 'PolicyDefinitionAgent',
      action: 'create_policy',
      status: 'success',
      enterprise_id: state.enterprise_id,
      details: {
        policy_id: policyId,
        conversation_messages: state.conversation_history.length,
        completion_percentage: state.completion_percentage,
        phases_completed: ['context_gathering', 'policy_goals', 'boundary_rules', 'controls_governance', 'validation_refinement']
      }
    });

    return policyId;
  }

  /**
   * Save boundary rules to policy_rules table
   */
  private async saveBoundaryRules(policyId: string, rules: PolicyObjectModel['boundary_rules']): Promise<void> {
    const ruleEntries: any[] = [];

    if (rules?.model_restrictions) {
      ruleEntries.push({
        policy_id: policyId,
        rule_type: 'model_restriction',
        rule_config: rules.model_restrictions,
        severity: 'block'
      });
    }

    if (rules?.content_filters) {
      ruleEntries.push({
        policy_id: policyId,
        rule_type: 'content_filter',
        rule_config: rules.content_filters,
        severity: 'block'
      });
    }

    if (rules?.rate_limits) {
      ruleEntries.push({
        policy_id: policyId,
        rule_type: 'rate_limit',
        rule_config: rules.rate_limits,
        severity: 'warn'
      });
    }

    if (rules?.cost_controls) {
      ruleEntries.push({
        policy_id: policyId,
        rule_type: 'cost_control',
        rule_config: rules.cost_controls,
        severity: 'warn'
      });
    }

    if (ruleEntries.length > 0) {
      const { error } = await this.supabase
        .from('policy_rules')
        .insert(ruleEntries);

      if (error) throw error;
    }
  }

  /**
   * Initialize new conversation state
   */
  private initializeState(enterpriseId: string, userId?: string): ConversationState {
    return {
      phase: 'context_gathering',
      completion_percentage: 0,
      pom_draft: {},
      conversation_history: [],
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      enterprise_id: enterpriseId,
      user_id: userId
    };
  }

  /**
   * Load conversation state from database
   */
  private async loadConversationState(conversationId: string): Promise<ConversationState> {
    // Implementation would load from a conversations table
    // For now, return new state
    return this.initializeState('default-enterprise');
  }

  /**
   * Save conversation state to database
   */
  private async saveConversationState(state: ConversationState): Promise<string> {
    // Implementation would save to a conversations table
    // For now, return a mock ID
    return state.started_at;
  }

  /**
   * Get system prompt for Lovable AI Gateway
   */
  private getSystemPrompt(): string {
    return `You are a specialized AI governance policy assistant. Your role is to help enterprise users define comprehensive AI governance policies through natural conversation.

Your responsibilities:
1. Extract structured policy information from natural language
2. Guide users through policy definition phases
3. Ensure consistency and completeness
4. Flag potential compliance issues
5. Adapt to user's expertise level

Key focus areas for AI middleware governance:
- Model restrictions (which AI models are allowed/blocked)
- Content filters (PII/PHI detection, pattern blocking)
- Rate limits (requests per time period, concurrency)
- Cost controls (budget caps, cost alerts)

Always prioritize:
- Security and compliance
- Clear communication
- Practical recommendations
- User intent understanding`;
  }

  /**
   * Get extraction prompt for current context
   */
  private getExtractionPrompt(userMessage: string, state: ConversationState): string {
    return `Extract policy information from the user's message in the context of ${state.phase} phase.

Current policy draft: ${JSON.stringify(state.pom_draft, null, 2)}

User message: ${userMessage}

Extract any relevant policy fields that can be determined from this message.`;
  }

  /**
   * Get POM extraction tool definition for Lovable AI
   */
  private getPOMExtractionTool(): any {
    return {
      type: 'function',
      function: {
        name: 'extract_policy_data',
        description: 'Extract structured policy data from user input',
        parameters: {
          type: 'object',
          properties: {
            tool: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                version: { type: 'string' },
                provider: { type: 'string' }
              }
            },
            use_case: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                business_value: { type: 'string' }
              }
            },
            boundary_rules: {
              type: 'object',
              properties: {
                model_restrictions: {
                  type: 'object',
                  properties: {
                    allowed_models: { type: 'array', items: { type: 'string' } },
                    blocked_models: { type: 'array', items: { type: 'string' } },
                    default_model: { type: 'string' }
                  }
                },
                content_filters: {
                  type: 'object',
                  properties: {
                    block_patterns: { type: 'array', items: { type: 'string' } },
                    pii_detection_enabled: { type: 'boolean' },
                    phi_detection_enabled: { type: 'boolean' }
                  }
                },
                rate_limits: {
                  type: 'object',
                  properties: {
                    max_requests_per_minute: { type: 'number' },
                    max_requests_per_hour: { type: 'number' },
                    max_requests_per_day: { type: 'number' },
                    max_concurrent_requests: { type: 'number' }
                  }
                },
                cost_controls: {
                  type: 'object',
                  properties: {
                    max_cost_per_request: { type: 'number' },
                    max_monthly_spend: { type: 'number' },
                    cost_alert_threshold: { type: 'number' }
                  }
                }
              }
            },
            governance: {
              type: 'object',
              properties: {
                risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                approval_required: { type: 'boolean' },
                data_scope: { type: 'array', items: { type: 'string' } }
              }
            },
            auditability: {
              type: 'object',
              properties: {
                retention_period_days: { type: 'number' },
                log_level: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'] },
                encryption_required: { type: 'boolean' }
              }
            },
            jurisdiction: { type: 'array', items: { type: 'string' } },
            audience: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    };
  }
}
