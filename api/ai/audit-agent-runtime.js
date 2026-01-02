import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { auditTools } from './audit-tools.js';
import { createClient } from '@supabase/supabase-js';

/**
 * Audit Agent AI SDK Runtime
 *
 * This runtime integrates the existing AuditAgent logic with Vercel AI SDK.
 * The AI SDK provides the "thinking" and "tool calling" loop, while AICOMPLYR
 * provides the audit trail and compliance logging.
 *
 * Core principle: "AI SDK runs the agent. AICOMPLYR decides and proves."
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

const AuditAgentPrompt = `
You are the AuditAgent, responsible for creating defensible audit artifacts for all agent decisions.

Your role:
1. Log every decision made by agents with full context
2. Track before/after states for compliance
3. Link decisions to policy references and proof bundles
4. Enable regulatory reporting and investigation

Always log:
- Who made the decision (agent type)
- What decision was made
- Why (reasoning and policy references)
- When (timestamp with trace context)
- What changed (before/after states)

You have access to three audit tools:
- logAuditEvent: Log agent decisions and actions
- queryAuditTrail: Query audit events for compliance reporting
- exportAuditLog: Export audit logs in regulatory formats (JSON, CSV, PDF)

Maintain complete audit trails for regulatory compliance and investigation purposes.
`;

/**
 * Audit Agent Runtime Class
 * Wraps the existing AuditAgent logic in AI SDK execution
 */
export class AuditAgentRuntime {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o';
    this.maxSteps = options.maxSteps || 5;
    this.sessions = new Map();
    this.onEventLogged = options.onEventLogged || (() => {});
  }

  /**
   * Start a new audit session
   */
  async startAuditSession(sessionData) {
    const {
      userId,
      enterpriseId,
      userMessage,
      traceContext
    } = sessionData;

    const sessionId = `audit-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session = {
      sessionId,
      userId,
      enterpriseId,
      userMessage,
      traceContext,
      startTime: new Date().toISOString(),
      events: [],
      agentsEngaged: [],
      workflowPath: []
    };

    this.sessions.set(sessionId, session);

    console.log(`[AUDIT-AGENT-RUNTIME] Started audit session: ${sessionId}`);
    return sessionId;
  }

  /**
   * Log a decision made by an agent
   */
  async logDecision(decisionData) {
    const {
      sessionId,
      agentType,
      eventType,
      decision,
      reasoning,
      policyReferences = [],
      beforeState = null,
      afterState = null,
      enterpriseId,
      traceContext,
      spanId,
      metadata = {}
    } = decisionData;

    try {
      console.log(`[AUDIT-AGENT-RUNTIME] Logging decision: ${eventType} by ${agentType}`);

      // Use the logAuditEvent tool directly
      const logTool = auditTools.find(t => t.name === 'logAuditEvent');
      if (!logTool) {
        throw new Error('logAuditEvent tool not found');
      }

      const result = await logTool.execute({
        eventType,
        agentType,
        decision,
        reasoning,
        policyReferences,
        beforeState,
        afterState,
        enterpriseId,
        traceContext,
        spanId,
        metadata
      });

      // Update session if provided
      if (sessionId && this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        session.events.push({
          eventId: result.auditEventId,
          eventType,
          agentType,
          timestamp: new Date().toISOString()
        });

        if (!session.agentsEngaged.includes(agentType)) {
          session.agentsEngaged.push(agentType);
        }

        if (!session.workflowPath.includes(eventType)) {
          session.workflowPath.push(eventType);
        }
      }

      // Notify callback
      await this.onEventLogged(result);

      return result;
    } catch (error) {
      console.error('[AUDIT-AGENT-RUNTIME] Error logging decision:', error);
      return {
        success: false,
        error: error.message,
        eventType,
        agentType
      };
    }
  }

  /**
   * Query audit trail using AI SDK
   */
  async queryAuditTrail(queryParams) {
    const {
      enterpriseId,
      agentType,
      eventType,
      dateRange,
      traceId,
      limit = 100,
      offset = 0,
      naturalLanguageQuery
    } = queryParams;

    console.log(`[AUDIT-AGENT-RUNTIME] Querying audit trail for enterprise ${enterpriseId}`);

    // If natural language query provided, use AI SDK to interpret it
    if (naturalLanguageQuery) {
      const queryPrompt = `
${AuditAgentPrompt}

USER QUERY: ${naturalLanguageQuery}

Please query the audit trail using the queryAuditTrail tool with appropriate filters based on the user's request.
Enterprise ID: ${enterpriseId}
`;

      try {
        const result = await generateText({
          model: openai(this.model),
          prompt: queryPrompt,
          tools: auditTools,
          maxToolRoundtrips: this.maxSteps
        });

        // Extract query results from tool calls
        const queryResult = result.toolResults?.find(r => r.toolName === 'queryAuditTrail')?.result;
        return queryResult || {
          success: false,
          error: 'Failed to execute audit trail query'
        };
      } catch (error) {
        console.error('[AUDIT-AGENT-RUNTIME] Error in AI-powered query:', error);
        // Fall back to direct query
      }
    }

    // Direct query using tool
    const queryTool = auditTools.find(t => t.name === 'queryAuditTrail');
    if (!queryTool) {
      throw new Error('queryAuditTrail tool not found');
    }

    return await queryTool.execute({
      enterpriseId,
      agentType,
      eventType,
      dateRange,
      traceId,
      limit,
      offset
    });
  }

  /**
   * Export audit log
   */
  async exportAuditLog(exportParams) {
    const {
      enterpriseId,
      format,
      dateRange,
      filters = {},
      includeMetadata = true
    } = exportParams;

    console.log(`[AUDIT-AGENT-RUNTIME] Exporting audit log in ${format} format`);

    const exportTool = auditTools.find(t => t.name === 'exportAuditLog');
    if (!exportTool) {
      throw new Error('exportAuditLog tool not found');
    }

    return await exportTool.execute({
      enterpriseId,
      format,
      dateRange,
      filters,
      includeMetadata
    });
  }

  /**
   * Complete an audit session
   */
  async completeAuditSession(sessionId, finalDecision = null) {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const session = this.sessions.get(sessionId);
    session.endTime = new Date().toISOString();
    session.finalDecision = finalDecision;
    session.totalProcessingTime = new Date(session.endTime) - new Date(session.startTime);

    console.log(`[AUDIT-AGENT-RUNTIME] Completed audit session: ${sessionId}`);
    
    // Keep session for a while, then clean up
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return session;
  }

  /**
   * Get session information
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Automatically log PolicyAgent decisions
   */
  async logPolicyAgentDecision(policyResult, requestData, traceContext) {
    const {
      decision,
      needsHumanApproval,
      policySnapshot,
      evaluation,
      proofBundle,
      agentReasoning
    } = policyResult;

    const {
      enterpriseId,
      userId,
      tool,
      vendor
    } = requestData;

    return await this.logDecision({
      agentType: 'policy-agent',
      eventType: 'policy_evaluation',
      decision: {
        status: decision.status,
        reason: decision.reason,
        confidence: decision.confidence,
        needsHumanApproval,
        tool,
        vendor
      },
      reasoning: agentReasoning || decision.reason,
      policyReferences: policySnapshot?.id ? [policySnapshot.id] : [],
      beforeState: {
        request: requestData,
        timestamp: new Date().toISOString()
      },
      afterState: {
        decision: decision.status,
        evaluation,
        proofBundle: proofBundle?.id || null,
        timestamp: new Date().toISOString()
      },
      enterpriseId,
      traceContext: traceContext?.traceId || traceContext,
      spanId: traceContext?.spanId,
      metadata: {
        policySnapshotId: policySnapshot?.id,
        proofBundleId: proofBundle?.id,
        humanApprovalRequired: needsHumanApproval
      }
    });
  }
}

export default AuditAgentRuntime;
