import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

/**
 * Intake Agent AI SDK Runtime
 *
 * This runtime integrates intake and normalization logic with Vercel AI SDK.
 * The AI SDK provides the "thinking" and "tool calling" loop, while AICOMPLYR
 * provides the normalization capabilities for various input formats.
 *
 * Core principle: "AI SDK runs the agent. AICOMPLYR normalizes the input."
 *
 * The IntakeAgent is the "universal translator" that converts messy real-world
 * inputs into clean, structured policy evaluation requests.
 */

const IntakeAgentPrompt = `
You are the IntakeAgent, the first gate in AICOMPLYR's governance workflow.

Your role is to normalize messy, unstructured inputs into clean, structured policy evaluation requests.
You handle various input formats and ensure consistent data flows into the governance pipeline.

INPUT SOURCES YOU HANDLE:
1. Free text messages: "Need ChatGPT for Monday's presentation!!!"
2. Email content: Unstructured emails requesting tool usage
3. Document parsing: RFI/RFP files with tool requirements
4. Chat messages: Natural language requests from chat interfaces
5. Legacy APIs: Different envelope formats and legacy structures
6. Structured APIs: Already normalized requests (validate and enrich)

NORMALIZATION PROCESS:
1. Detect input format and extract relevant information
2. Identify tool names (ChatGPT→openai-gpt-4, Claude→anthropic-claude, etc.)
3. Determine vendor and validate tool-vendor relationships
4. Extract intended usage and data handling patterns
5. Assess urgency from language patterns and context
6. Enrich with enterprise, workspace, and user context
7. Validate completeness and flag missing information

OUTPUT FORMAT:
Always produce a normalized request with:
- tool: Standardized tool identifier
- vendor: Standardized vendor identifier
- usage: Clear description of intended use
- dataHandling: Data sensitivity classification
- userId: From authentication context
- enterpriseId: From enterprise context
- scopeId: Workspace/brand/department context
- urgencyLevel: Calculated urgency score (0-1)
- additionalContext: Enriched metadata

If information is missing or unclear, flag it clearly rather than guessing incorrectly.
Your accuracy ensures the entire governance workflow operates on clean, reliable data.
`;

/**
 * Intake Agent Runtime Class
 * Provides universal input normalization for AICOMPLYR governance workflow
 */
export class IntakeAgentRuntime {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o';
    this.maxSteps = options.maxSteps || 5;
    this.onNormalizationComplete = options.onNormalizationComplete || (() => {});
    this.onInputRejected = options.onInputRejected || (() => {});
    this.onContextEnriched = options.onContextEnriched || (() => {});
  }

  /**
   * Main entry point: Normalize any input format to policy evaluation request
   */
  async normalizeRequest(rawInput, inputType = 'unknown', context = {}) {
    console.log(`[INTAKE-AGENT-RUNTIME] Normalizing ${inputType} input`);

    try {
      const result = await generateObject({
        model: openai(this.model),
        schema: z.object({
          tool: z.string().describe('Standardized tool identifier (e.g., "openai-gpt-4o")'),
          vendor: z.string().describe('Standardized vendor identifier (e.g., "openai")'),
          usage: z.string().describe('Clear description of intended use'),
          dataHandling: z.enum(['no_customer_data', 'customer_data', 'sensitive_data', 'phi_pii']).describe('Data sensitivity classification'),
          urgencyLevel: z.number().min(0).max(1).describe('Calculated urgency score'),
          additionalContext: z.object({
            notes: z.string().describe('Any additional notes'),
            department: z.string().describe('The department name'),
            project: z.string().describe('The project name')
          }).describe('Enriched metadata')
        }),
        prompt: `
          ${IntakeAgentPrompt}

          INPUT TO NORMALIZE:
          Type: ${inputType}
          Input: ${typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput)}

          CONTEXT:
          Enterprise: ${context.enterpriseId}
          User: ${context.userId}
          Scope: ${context.scopeId}

          Return a clean, structured policy evaluation request.
        `
      });

      const normalizedRequest = {
        ...result.object,
        userId: context.userId,
        enterpriseId: context.enterpriseId,
        scopeId: context.scopeId
      };

      // Validate the normalized request
      const validation = this.validateNormalizedRequest(normalizedRequest);

      if (!validation.valid) {
        console.warn(`[INTAKE-AGENT-RUNTIME] Validation failed: ${validation.errors.join(', ')}`);

        await this.onInputRejected({
          input: rawInput,
          inputType,
          errors: validation.errors,
          normalizedRequest,
          context
        });

        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          errors: validation.errors,
          normalizedRequest
        };
      }

      await this.onNormalizationComplete({
        input: rawInput,
        inputType,
        normalizedRequest,
        context
      });

      return {
        success: true,
        normalizedRequest,
        confidence: 0.9,
        processingSteps: ['llm_normalization', 'schema_validation']
      };

    } catch (error) {
      console.error('[INTAKE-AGENT-RUNTIME] Error during normalization:', error);
      if (error.data) console.error('[INTAKE-AGENT-RUNTIME] Error data:', JSON.stringify(error.data, null, 2));
      
      // Attempt basic fallback normalization if LLM fails
      const fallbackRequest = this.attemptFallbackNormalization(rawInput, inputType, context);
      
      if (fallbackRequest) {
        return {
          success: true,
          normalizedRequest: fallbackRequest,
          confidence: 0.5,
          processingSteps: ['fallback_normalization']
        };
      }

      return {
        success: false,
        error: error.message,
        originalInput: rawInput
      };
    }
  }

  /**
   * Validate the normalized request against required fields
   */
  validateNormalizedRequest(request) {
    const requiredFields = ['tool', 'vendor', 'usage', 'userId', 'enterpriseId'];
    const errors = [];

    for (const field of requiredFields) {
      if (!request[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Attempt basic fallback normalization when LLM fails
   */
  attemptFallbackNormalization(rawInput, inputType, context) {
    console.log('[INTAKE-AGENT-RUNTIME] Attempting fallback normalization');

    if (inputType === 'chat' && typeof rawInput === 'string') {
      // Basic regex extraction for common tools
      const toolMatch = rawInput.match(/(chatgpt|gpt-4|claude|gemini|midjourney)/i);
      if (toolMatch) {
        const tool = toolMatch[0].toLowerCase();
        const vendor = tool.includes('gpt') ? 'openai' : 
                       tool.includes('claude') ? 'anthropic' :
                       tool.includes('gemini') ? 'google' : 'unknown';
        
        return {
          tool,
          vendor,
          usage: rawInput,
          dataHandling: 'unknown',
          userId: context.userId,
          enterpriseId: context.enterpriseId,
          scopeId: context.scopeId,
          urgencyLevel: 0.5,
          additionalContext: { fallback: true }
        };
      }
    }

    return null;
  }
}
