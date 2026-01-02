import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tool } from 'ai';

/**
 * AICOMPLYR Intake Tools for AI SDK
 *
 * Provides AI SDK tool wrappers for intake and normalization operations:
 * 1. extractToolRequest - Extract tool, vendor, usage from unstructured text
 * 2. normalizeInputFormat - Convert various formats to standard structure
 * 3. assessUrgencyLevel - Analyze text for urgency indicators
 * 4. enrichContext - Add enterprise/workspace context to requests
 */

// Lazy initialization of Supabase client
let supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key must be configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

/**
 * Tool 1: extractToolRequest
 * Extract tool name, vendor, usage, and data handling from unstructured text
 */
export const extractToolRequest = tool({
  name: 'extractToolRequest',
  description: 'Extracts tool usage request details from unstructured text.',
  parameters: z.object({
    inputText: z.string().describe('The unstructured text to extract tool request from'),
    inputType: z.string().describe('Type of input source'),
    enterpriseId: z.string().describe('Enterprise context'),
    userId: z.string().describe('User context')
  }),
  execute: async ({ inputText, inputType, enterpriseId, userId }) => {
    try {
      const context = { enterpriseId, userId };
      console.log(`[INTAKE-TOOLS] Extracting tool request from ${inputType} input: ${inputText.substring(0, 100)}...`);

      // Use AI SDK to extract structured information from text
      // This would use the AI model to parse natural language into structured format
      const extractedInfo = await extractToolInfoFromText(inputText, inputType, context);

      console.log(`[INTAKE-TOOLS] Extracted tool: ${extractedInfo.tool}, vendor: ${extractedInfo.vendor}`);

      return {
        success: true,
        extracted: extractedInfo,
        confidence: extractedInfo.confidence || 0.8,
        inputType,
        originalText: inputText
      };
    } catch (error) {
      console.error('[INTAKE-TOOLS] Error extracting tool request:', error);
      return {
        success: false,
        error: error.message,
        inputType,
        originalText: inputText,
        extracted: {
          tool: null,
          vendor: null,
          usage: null,
          dataHandling: 'unknown',
          confidence: 0
        }
      };
    }
  }
});

/**
 * Tool 2: normalizeInputFormat
 * Convert various input formats to standardized policy evaluation structure
 */
export const normalizeInputFormat = tool({
  name: 'normalizeInputFormat',
  description: 'Normalizes various input formats into the standard AICOMPLYR policy evaluation request format.',
  parameters: z.object({
    rawInput: z.string().describe('The raw input as a JSON string or unstructured text'),
    inputType: z.string().describe('Detected or specified input type'),
    enterpriseId: z.string().optional().describe('Enterprise context'),
    userId: z.string().optional().describe('User context'),
    workspaceId: z.string().optional().describe('Workspace/brand context')
  }),
  execute: async ({ rawInput, inputType, enterpriseId, userId, workspaceId }) => {
    try {
      const context = { enterpriseId, userId, workspaceId };
      console.log(`[INTAKE-TOOLS] Normalizing ${inputType} input format`);

      let parsedInput = rawInput;
      try {
        parsedInput = JSON.parse(rawInput);
      } catch (e) {
        // Not JSON, keep as string
      }

      const normalizedRequest = await normalizeToStandardFormat(parsedInput, inputType, context);

      console.log(`[INTAKE-TOOLS] Normalized to: tool=${normalizedRequest.tool}, vendor=${normalizedRequest.vendor}`);

      return {
        success: true,
        normalized: normalizedRequest,
        inputType,
        fieldMapping: normalizedRequest.fieldMapping || {},
        confidence: normalizedRequest.confidence || 0.9
      };
    } catch (error) {
      console.error('[INTAKE-TOOLS] Error normalizing input format:', error);
      return {
        success: false,
        error: error.message,
        inputType,
        normalized: null,
        fieldMapping: {}
      };
    }
  }
});

/**
 * Tool 3: assessUrgencyLevel
 * Analyze text for urgency indicators and time pressure
 */
export const assessUrgencyLevel = tool({
  name: 'assessUrgencyLevel',
  description: 'Assesses urgency level from text content.',
  parameters: z.object({
    text: z.string().describe('Text to analyze for urgency indicators'),
    currentTime: z.string().optional().describe('Current timestamp'),
    deadline: z.string().optional().describe('Known deadline if available'),
    userRole: z.string().optional().describe('User role')
  }),
  execute: async ({ text, currentTime, deadline, userRole }) => {
    try {
      const context = { currentTime, deadline, userRole };
      console.log(`[INTAKE-TOOLS] Assessing urgency from text: ${text.substring(0, 50)}...`);

      const urgencyAssessment = await analyzeUrgency(text, context);

      console.log(`[INTAKE-TOOLS] Urgency level: ${urgencyAssessment.level} (${urgencyAssessment.emotionalState})`);

      return {
        success: true,
        urgency: urgencyAssessment
      };
    } catch (error) {
      console.error('[INTAKE-TOOLS] Error assessing urgency:', error);
      return {
        success: false,
        error: error.message,
        urgency: {
          level: 0.5,
          emotionalState: 'neutral',
          indicators: [],
          confidence: 0.5
        }
      };
    }
  }
});

/**
 * Tool 4: enrichContext
 * Add enterprise, workspace, and user context to requests
 */
export const enrichContext = tool({
  name: 'enrichContext',
  description: 'Enriches policy evaluation requests with enterprise, workspace, and user context.',
  parameters: z.object({
    tool: z.string().optional(),
    vendor: z.string().optional(),
    usage: z.string().optional(),
    userId: z.string().optional(),
    enterpriseId: z.string().optional(),
    contextEnterpriseId: z.string().optional().describe('From auth context'),
    contextUserId: z.string().optional().describe('From auth context'),
    workspaceId: z.string().optional().describe('From workspace context'),
    role: z.string().optional().describe('User role'),
    department: z.string().optional().describe('User department')
  }),
  execute: async ({ tool, vendor, usage, userId, enterpriseId, contextEnterpriseId, contextUserId, workspaceId, role, department }) => {
    try {
      const baseRequest = { tool, vendor, usage, userId, enterpriseId };
      const contextSource = { enterpriseId: contextEnterpriseId, userId: contextUserId, workspaceId, role, department };
      console.log(`[INTAKE-TOOLS] Enriching context for request: ${baseRequest.tool}`);

      const enrichedRequest = await addContextToRequest(baseRequest, contextSource);

      console.log(`[INTAKE-TOOLS] Enriched with enterprise: ${enrichedRequest.enterpriseId}, workspace: ${enrichedRequest.scopeId}`);

      return {
        success: true,
        enriched: enrichedRequest,
        contextAdded: enrichedRequest.contextAdded || {},
        enrichmentConfidence: enrichedRequest.enrichmentConfidence || 0.9
      };
    } catch (error) {
      console.error('[INTAKE-TOOLS] Error enriching context:', error);
      return {
        success: false,
        error: error.message,
        enriched: baseRequest,
        contextAdded: {}
      };
    }
  }
});

// Helper functions for tool implementations

async function extractToolInfoFromText(inputText, inputType, context) {
  // This would use AI to extract structured information
  // For now, implement rule-based extraction as fallback

  const text = inputText.toLowerCase();

  // Common tool name mappings
  const toolMappings = {
    'chatgpt': { tool: 'openai-gpt-4', vendor: 'openai' },
    'gpt-4': { tool: 'openai-gpt-4', vendor: 'openai' },
    'gpt-3': { tool: 'openai-gpt-3', vendor: 'openai' },
    'claude': { tool: 'anthropic-claude', vendor: 'anthropic' },
    'anthropic': { tool: 'anthropic-claude', vendor: 'anthropic' },
    'midjourney': { tool: 'midjourney', vendor: 'midjourney' },
    'dall-e': { tool: 'openai-dalle', vendor: 'openai' },
    'github copilot': { tool: 'github-copilot', vendor: 'microsoft' },
    'copilot': { tool: 'github-copilot', vendor: 'microsoft' },
    'jasper': { tool: 'jasper-ai', vendor: 'jasper' },
    'veeva': { tool: 'veeva-vault', vendor: 'veeva' }
  };

  let extractedTool = null;
  let extractedVendor = null;
  let confidence = 0.5;

  // Find tool mentions
  for (const [key, mapping] of Object.entries(toolMappings)) {
    if (text.includes(key)) {
      extractedTool = mapping.tool;
      extractedVendor = mapping.vendor;
      confidence = 0.8;
      break;
    }
  }

  // Extract usage context
  let usage = null;
  const usagePatterns = [
    /(?:for|to|create|generate|analyze|process)\s+([^.!?]*)/i,
    /(?:marketing|presentation|content|analysis|research|writing)/i
  ];

  for (const pattern of usagePatterns) {
    const match = inputText.match(pattern);
    if (match && match[1]) {
      usage = match[1].trim();
      break;
    }
  }

  // Default usage if not found
  if (!usage) {
    usage = 'general purpose tool usage';
  }

  // Determine data handling
  let dataHandling = 'no_customer_data';
  if (text.includes('customer') || text.includes('patient') || text.includes('pii') || text.includes('personal')) {
    dataHandling = 'customer_data';
  }

  return {
    tool: extractedTool,
    vendor: extractedVendor,
    usage,
    dataHandling,
    confidence,
    extractedFrom: inputType,
    rawText: inputText
  };
}

async function normalizeToStandardFormat(rawInput, inputType, context) {
  // Handle different input formats and convert to standard structure

  let normalized = {
    tool: null,
    vendor: null,
    usage: null,
    dataHandling: 'no_customer_data',
    userId: context.userId,
    enterpriseId: context.enterpriseId,
    scopeId: context.workspaceId,
    urgencyLevel: 0.5,
    additionalContext: {},
    fieldMapping: {},
    confidence: 0.8
  };

  switch (inputType) {
    case 'email':
      // Extract from email format
      normalized = await normalizeEmailFormat(rawInput, context);
      break;

    case 'chat':
      // Extract from chat message
      normalized = await normalizeChatFormat(rawInput, context);
      break;

    case 'document':
      // Extract from document parsing result
      normalized = await normalizeDocumentFormat(rawInput, context);
      break;

    case 'api':
      // Already structured, just validate
      normalized = await normalizeApiFormat(rawInput, context);
      break;

    case 'legacy':
      // Convert legacy formats
      normalized = await normalizeLegacyFormat(rawInput, context);
      break;

    default:
      // Try to extract from raw text
      const extracted = await extractToolInfoFromText(
        typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput),
        'unknown',
        context
      );

      normalized = {
        ...normalized,
        ...extracted,
        fieldMapping: { source: 'text_extraction' }
      };
  }

  return normalized;
}

async function analyzeUrgency(text, context) {
  const indicators = {
    exclamationMarks: (text.match(/!/g) || []).length,
    urgencyWords: ['urgent', 'asap', 'emergency', 'critical', 'deadline', 'immediately', 'rush', 'now'],
    questionMarks: (text.match(/\?/g) || []).length
  };

  let urgencyScore = 0;

  // Exclamation marks (0-3 scale)
  urgencyScore += Math.min(indicators.exclamationMarks, 3) * 0.2;

  // Urgency words
  const urgencyWordCount = indicators.urgencyWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;
  urgencyScore += urgencyWordCount * 0.25;

  // Question marks (may indicate uncertainty/urgency)
  urgencyScore += Math.min(indicators.questionMarks, 2) * 0.1;

  // Time pressure analysis
  if (context.deadline) {
    const now = new Date();
    const deadline = new Date(context.deadline);
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline < 24) urgencyScore += 0.3;
    else if (hoursUntilDeadline < 72) urgencyScore += 0.2;
  }

  urgencyScore = Math.min(urgencyScore, 1.0);

  let emotionalState = 'calm';
  if (urgencyScore > 0.8) emotionalState = 'panicked';
  else if (urgencyScore > 0.6) emotionalState = 'stressed';
  else if (urgencyScore > 0.4) emotionalState = 'concerned';

  return {
    level: urgencyScore,
    emotionalState,
    indicators,
    confidence: 0.85,
    factors: [
      `exclamation_marks: ${indicators.exclamationMarks}`,
      `urgency_words: ${urgencyWordCount}`,
      `time_pressure: ${context.deadline ? 'present' : 'none'}`
    ]
  };
}

async function addContextToRequest(baseRequest, contextSource) {
  const enriched = { ...baseRequest };

  // Add enterprise context
  if (contextSource.enterpriseId && !enriched.enterpriseId) {
    enriched.enterpriseId = contextSource.enterpriseId;
  }

  // Add workspace/scope context
  if (contextSource.workspaceId && !enriched.scopeId) {
    enriched.scopeId = contextSource.workspaceId;
  }

  // Add user context
  if (contextSource.userId && !enriched.userId) {
    enriched.userId = contextSource.userId;
  }

  // Add role and department to additional context
  enriched.additionalContext = {
    ...enriched.additionalContext,
    userRole: contextSource.role,
    department: contextSource.department,
    contextSource: 'enriched'
  };

  return {
    ...enriched,
    contextAdded: {
      enterpriseId: !!contextSource.enterpriseId,
      workspaceId: !!contextSource.workspaceId,
      userId: !!contextSource.userId,
      role: !!contextSource.role
    },
    enrichmentConfidence: 0.9
  };
}

// Format-specific normalization functions
async function normalizeEmailFormat(emailData, context) {
  // Extract tool request from email format
  const body = emailData.body || emailData.content || '';
  const subject = emailData.subject || '';

  const extracted = await extractToolInfoFromText(`${subject} ${body}`, 'email', context);

  return {
    ...extracted,
    userId: context.userId,
    enterpriseId: context.enterpriseId,
    scopeId: context.workspaceId,
    additionalContext: {
      emailSubject: subject,
      emailSender: emailData.from,
      emailSource: 'email'
    },
    fieldMapping: { source: 'email', subject, body_length: body.length }
  };
}

async function normalizeChatFormat(chatData, context) {
  const message = chatData.message || chatData.content || chatData.text || '';

  const extracted = await extractToolInfoFromText(message, 'chat', context);

  return {
    ...extracted,
    userId: context.userId,
    enterpriseId: context.enterpriseId,
    scopeId: context.workspaceId,
    additionalContext: {
      chatChannel: chatData.channel,
      chatUser: chatData.user,
      chatSource: 'chat'
    },
    fieldMapping: { source: 'chat', message_length: message.length }
  };
}

async function normalizeDocumentFormat(docData, context) {
  const content = docData.content || docData.text || '';

  const extracted = await extractToolInfoFromText(content, 'document', context);

  return {
    ...extracted,
    userId: context.userId,
    enterpriseId: context.enterpriseId,
    scopeId: context.workspaceId,
    additionalContext: {
      documentType: docData.type,
      documentName: docData.filename,
      documentSource: 'document'
    },
    fieldMapping: { source: 'document', content_length: content.length }
  };
}

async function normalizeApiFormat(apiData, context) {
  // API data is likely already structured, just ensure it matches our format
  return {
    tool: apiData.tool,
    vendor: apiData.vendor,
    usage: apiData.usage,
    dataHandling: apiData.dataHandling || 'no_customer_data',
    userId: apiData.userId || context.userId,
    enterpriseId: apiData.enterpriseId || context.enterpriseId,
    scopeId: apiData.scopeId || context.workspaceId,
    urgencyLevel: apiData.urgencyLevel || 0.5,
    additionalContext: apiData.additionalContext || {},
    fieldMapping: { source: 'api', format: 'structured' },
    confidence: 0.95
  };
}

async function normalizeLegacyFormat(legacyData, context) {
  // Handle legacy envelope formats from governance-action
  const payload = legacyData.payload || legacyData.metadata || legacyData;

  const extracted = await extractToolInfoFromText(
    JSON.stringify(payload),
    'legacy',
    context
  );

  return {
    ...extracted,
    userId: legacyData.actor?.user_id || context.userId,
    enterpriseId: context.enterpriseId,
    scopeId: context.workspaceId,
    additionalContext: {
      legacyFormat: true,
      actionType: legacyData.action_type,
      threadId: legacyData.thread_id,
      legacySource: 'envelope'
    },
    fieldMapping: { source: 'legacy', envelope_version: 'legacy' }
  };
}

// Add names to tools for internal identification
extractToolRequest.name = 'extractToolRequest';
normalizeInputFormat.name = 'normalizeInputFormat';
assessUrgencyLevel.name = 'assessUrgencyLevel';
enrichContext.name = 'enrichContext';

export const intakeTools = [
  extractToolRequest,
  normalizeInputFormat,
  assessUrgencyLevel,
  enrichContext
];
