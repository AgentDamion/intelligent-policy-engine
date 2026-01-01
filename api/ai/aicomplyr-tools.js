import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tool } from 'ai';
import { extractToolRequest, normalizeInputFormat, assessUrgencyLevel, enrichContext } from './intake-tools.js';
import { logAuditEvent, queryAuditTrail, exportAuditLog } from './audit-tools.js';
import { assessRiskProfile, calculateRiskScore, getRiskFactors } from './risk-tools.js';
import { verifyToolIdentity, verifyToolVersion, checkToolMetadataCompleteness, getToolConstraints } from './tool-registry-tools.js';
import { routeApproval, calculateSLA, orchestrateWorkflow, determineJurisdiction, enrichApprovalContext } from './approvals-tools.js';

/**
 * AICOMPLYR AI SDK Tools
 *
 * This module provides AI SDK tool wrappers for core AICOMPLYR capabilities:
 *
 * Intake Tools:
 * 1. extractToolRequest - Extract tool request details from unstructured text
 * 2. normalizeInputFormat - Convert various input formats to standard structure
 * 3. assessUrgencyLevel - Analyze text for urgency indicators
 * 4. enrichContext - Add enterprise/workspace context to requests
 *
 * Policy Tools:
 * 5. fetchEffectivePolicySnapshot - Retrieves immutable policy set for evaluation
 * 6. evaluateRequest - Evaluates requests against policy rules
 * 7. generateProofBundle - Creates cryptographically verifiable proof bundles
 *
 * Audit Tools:
 * 8. logAuditEvent - Logs agent decisions and actions
 * 9. queryAuditTrail - Queries audit events for compliance reporting
 * 10. exportAuditLog - Exports audit logs in regulatory formats
 *
 * Risk Tools:
 * 11. assessRiskProfile - Assesses tool across 6 risk dimensions
 * 12. calculateRiskScore - Calculates numeric risk score from telemetry
 * 13. getRiskFactors - Retrieves historical risk factors
 *
 * Tool Registry Tools:
 * 14. verifyToolIdentity - Verifies tool exists in registry
 * 15. verifyToolVersion - Verifies version exists and matches constraints
 * 16. checkToolMetadataCompleteness - Validates metadata completeness
 * 17. getToolConstraints - Retrieves recorded constraints from approvals
 *
 * Approvals Tools:
 * 18. routeApproval - Routes approval requests to appropriate reviewers
 * 19. calculateSLA - Computes approval SLAs based on risk and priority
 * 20. orchestrateWorkflow - Manages complex approval workflows
 * 21. determineJurisdiction - Maps decisions to regulatory jurisdictions
 * 22. enrichApprovalContext - Provides comprehensive context for decisions
 *
 * These tools maintain the principle: "AI SDK runs the agent. AICOMPLYR decides and proves."
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
 * Tool 1: fetchEffectivePolicySnapshot
 * Retrieves the immutable, versioned policy set relevant to the request's scope
 */
export const fetchEffectivePolicySnapshot = tool({
  name: 'fetchEffectivePolicySnapshot',
  description: 'Retrieves the effective policy snapshot for a given enterprise and scope.',
  parameters: z.object({
    enterpriseId: z.string().describe('The enterprise ID to fetch policies for'),
    scopeId: z.string().optional().describe('Optional scope ID to filter policies'),
    triggerSource: z.string().optional().describe('The source triggering this policy fetch')
  }),
  execute: async ({ enterpriseId, scopeId, triggerSource = 'approval' }) => {
    try {
      console.log(`[AICOMPLYR-TOOLS] Fetching effective policy snapshot for enterprise ${enterpriseId}`);

      // Call the generate-eps Supabase function
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('generate-eps', {
        body: {
          policy_instance_id: enterpriseId, // Using enterpriseId as policy_instance_id for now
          scope_id: scopeId,
          trigger_source: triggerSource
        }
      });

      if (error) {
        throw new Error(`Failed to fetch policy snapshot: ${error.message}`);
      }

      console.log(`[AICOMPLYR-TOOLS] Policy snapshot retrieved successfully`);
      return {
        success: true,
        policySnapshot: data,
        enterpriseId,
        scopeId,
        retrievedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AICOMPLYR-TOOLS] Error fetching policy snapshot:', error);
      return {
        success: false,
        error: error.message,
        enterpriseId,
        retrievedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Tool 2: evaluateRequest
 * Runs the request against the EPS retrieved in Tool 1
 */
export const evaluateRequest = tool({
  name: 'evaluateRequest',
  description: 'Evaluates a tool usage request against the effective policy snapshot.',
  parameters: z.object({
    policySnapshotId: z.string().describe('The policy snapshot ID'),
    toolId: z.string().describe('The tool being requested'),
    vendorId: z.string().describe('The vendor providing the tool'),
    useCase: z.string().describe('The intended use case'),
    dataHandling: z.string().describe('How data will be handled'),
    userId: z.string().describe('The user making the request'),
    enterpriseId: z.string().describe('The enterprise context')
  }),
  execute: async ({ policySnapshotId, toolId, vendorId, useCase, dataHandling, userId, enterpriseId }) => {
    try {
      console.log(`[AICOMPLYR-TOOLS] Evaluating request for tool ${toolId} by user ${userId}`);

      // Call the policy-evaluate Supabase function
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('policy-evaluate', {
        body: {
          event: {
            tool: { id: toolId, name: toolId, version: 'latest' },
            actor: { role: 'user' },
            action: { type: 'ToolUsage', note: useCase },
            context: { tenantId: enterpriseId, policySnapshotId },
            ts: new Date().toISOString()
          },
          rules: [] // The function will fetch the appropriate rules
        }
      });

      if (error) {
        throw new Error(`Failed to evaluate request: ${error.message}`);
      }

      console.log(`[AICOMPLYR-TOOLS] Request evaluation completed: ${data?.status || 'unknown'}`);
      return {
        success: true,
        decision: data,
        toolId,
        vendorId,
        useCase,
        dataHandling,
        userId,
        enterpriseId,
        evaluatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AICOMPLYR-TOOLS] Error evaluating request:', error);
      return {
        success: false,
        error: error.message,
        toolId,
        vendorId,
        useCase,
        dataHandling,
        userId,
        enterpriseId,
        evaluatedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Tool 3: generateProofBundle
 * Generates tamper-evident, cryptographic audit record
 */
export const generateProofBundle = tool({
  name: 'generateProofBundle',
  description: 'Generates a cryptographically verifiable proof bundle for the decision.',
  parameters: z.object({
    enterpriseId: z.string().describe('The enterprise ID'),
    status: z.string().describe('The decision status'),
    reason: z.string().describe('The decision reason'),
    toolId: z.string().describe('The tool ID'),
    userId: z.string().describe('The user ID'),
    evaluatedAt: z.string().describe('The evaluation timestamp'),
    policySnapshotId: z.string().describe('The policy snapshot ID'),
    traceContext: z.string().optional().describe('The trace context')
  }),
  execute: async ({ enterpriseId, status, reason, toolId, userId, evaluatedAt, policySnapshotId, traceContext }) => {
    try {
      const decision = { status, reason, toolId, userId, evaluatedAt };
      console.log(`[AICOMPLYR-TOOLS] Generating proof bundle for decision: ${status}`);

      // Call the generate-proof-bundle Supabase function
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('generate-proof-bundle', {
        body: {
          enterprise_id: enterpriseId,
          decision,
          policy_snapshot_id: policySnapshotId,
          trace_context: traceContext,
          created_at: new Date().toISOString()
        },
        headers: traceContext ? { 'traceparent': traceContext } : {}
      });

      if (error) {
        throw new Error(`Failed to generate proof bundle: ${error.message}`);
      }

      console.log(`[AICOMPLYR-TOOLS] Proof bundle generated successfully: ${data?.id || 'unknown'}`);
      return {
        success: true,
        proofBundle: data,
        enterpriseId,
        decision: decision.status,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AICOMPLYR-TOOLS] Error generating proof bundle:', error);
      return {
        success: false,
        error: error.message,
        enterpriseId,
        decision: decision.status,
        generatedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Export all AICOMPLYR tools as an array for easy integration
 */
export const aicomplyrTools = [
  // Intake tools
  extractToolRequest,
  normalizeInputFormat,
  assessUrgencyLevel,
  enrichContext,
  // Tool Registry tools
  verifyToolIdentity,
  verifyToolVersion,
  checkToolMetadataCompleteness,
  getToolConstraints,
  // Policy tools
  fetchEffectivePolicySnapshot,
  evaluateRequest,
  generateProofBundle,
  // Audit tools
  logAuditEvent,
  queryAuditTrail,
  exportAuditLog,
  // Risk tools
  assessRiskProfile,
  calculateRiskScore,
  getRiskFactors,
  // Approvals tools
  routeApproval,
  calculateSLA,
  orchestrateWorkflow,
  determineJurisdiction,
  enrichApprovalContext
];
