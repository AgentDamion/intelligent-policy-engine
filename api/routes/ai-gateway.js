import express from 'express';
import RedisProvider from '../services/cache-providers/redis-provider.js';
import AiGateway from '../ai/llm-gateway.js';
import { PolicyAgentRuntime } from '../ai/policy-agent-runtime.js';
import { AuditAgentRuntime } from '../ai/audit-agent-runtime.js';
import { RiskAgentRuntime } from '../ai/risk-agent-runtime.js';
import { ToolRegistryAgentRuntime } from '../ai/tool-registry-agent-runtime.js';
import { IntakeAgentRuntime } from '../ai/intake-agent-runtime.js';
import { ApprovalsAgentRuntime } from '../ai/approvals-agent-runtime.js';
import { hilManager } from '../ai/human-in-the-loop.js';
import hierarchicalAuth from '../auth/hierarchical-auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { logger } from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { z } from 'zod';
const structuredRequestSchema = z.object({
  tool: z.string().min(1).max(128),
  vendor: z.string().min(1).max(128),
  usage: z.string().min(1).max(2048),
  dataHandling: z.string().optional(),
  userId: z.string().min(1).max(128),
  enterpriseId: z.string().min(1).max(128),
  partnerId: z.string().min(1).max(128).optional(), // Optional: null = enterprise-run, value = partner-run mode
  scopeId: z.string().min(1).max(128).optional(),
  urgencyLevel: z.number().min(0).max(1).optional(),
  additionalContext: z.record(z.any()).optional()
});

const router = express.Router();

// Reuse the centralized Redis provider
const redisProvider = new RedisProvider();
const aiGateway = new AiGateway({
  redisProvider,
  maxDailySpend: Number(process.env.MAX_DAILY_SPEND || 50),
});

// Initialize Intake, ToolRegistry, Audit, Risk and Approvals Agent Runtimes
const intakeAgentRuntime = new IntakeAgentRuntime();
const toolRegistryAgentRuntime = new ToolRegistryAgentRuntime();
const auditAgentRuntime = new AuditAgentRuntime();
const riskAgentRuntime = new RiskAgentRuntime();
const approvalsAgentRuntime = new ApprovalsAgentRuntime();

// Initialize Policy Agent Runtime with Intake, ToolRegistry, Audit, Risk and Approvals agents
const policyAgentRuntime = new PolicyAgentRuntime({
  model: 'gpt-4o',
  maxSteps: 10,
  intakeAgent: intakeAgentRuntime,
  toolRegistryAgent: toolRegistryAgentRuntime,
  auditAgent: auditAgentRuntime,
  riskAgent: riskAgentRuntime,
  approvalsAgent: approvalsAgentRuntime,
  onHumanApprovalNeeded: async (evaluationResult) => {
    // Request human approval for high-liability decisions
    const approvalRequest = {
      decisionId: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentType: 'policy-agent',
      decision: evaluationResult.decision,
      requestContext: evaluationResult.request,
      enterpriseId: evaluationResult.request.enterpriseId,
      userId: evaluationResult.request.userId,
      priority: evaluationResult.decision.status === 'Prohibited' ? 'high' : 'medium',
      justification: `Policy evaluation requires human review: ${evaluationResult.decision.reason}`
    };

    const approvalResult = await hilManager.requestApproval(approvalRequest);

    // For demo purposes, auto-approve after 2 seconds
    // In production, this would wait for actual human input
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      approved: true,
      approvedBy: 'demo-admin',
      reason: 'Auto-approved for demonstration',
      approvedAt: new Date().toISOString(),
      traceContext: approvalResult.approvalId
    };
  }
});

// Protect the route with existing auth middleware
router.post(
  '/ai/chat',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  rateLimit(),
  (req, res) => aiGateway.handle(req, res)
);

// =============================================================================
// POLICY AGENT ENDPOINTS
// =============================================================================

// POST /api/ai/policy/evaluate - Evaluate a policy request using AI SDK runtime
router.post(
  '/policy/evaluate',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  rateLimit(),
  async (req, res) => {
    try {
      const {
        // Universal Input (IntakeAgent)
        input,
        inputType = 'chat',
        
        // Traditional Structured Input
        tool,
        vendor,
        usage,
        dataHandling,
        userId,
        enterpriseId,
        partnerId = null, // Optional: null = enterprise-run, value = partner-run mode (Boundary Governance)
        scopeId,
        urgencyLevel,
        additionalContext = {}
      } = req.body;

      logger.info('Policy evaluation request received', { mode: input ? 'Universal' : 'Structured' });

      // 1. Handle Universal Input (IntakeAgent Workflow)
      if (input) {
        const user = req.user || {};
        const finalContext = {
          enterpriseId: enterpriseId || user.enterpriseId || user.organization_id,
          userId: userId || user.id || user.userId,
          scopeId
        };

        const result = await policyAgentRuntime.processPolicyRequest(input, inputType, finalContext);
        
        const response = successResponse(result, {
          evaluatedAt: new Date().toISOString(),
          agent: 'policy-agent-runtime',
          workflow: result.workflow,
          traceId: result.traceContext?.traceId
        });
        return res.status(response.statusCode).json(response.body);
      }

      // 2. Handle Traditional Structured Input
      if (!tool || !vendor || !usage || !userId || !enterpriseId) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Missing required fields: tool, vendor, usage, userId, enterpriseId (or provide "input" for universal intake)',
          { statusCode: 400 }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const parsed = structuredRequestSchema.safeParse({
        tool,
        vendor,
        usage,
        dataHandling,
        userId,
        enterpriseId,
        partnerId,
        scopeId,
        urgencyLevel,
        additionalContext
      });
      if (!parsed.success) {
        const response = errorResponse(
          'VALIDATION_FAILED',
          'Invalid structured request payload',
          {
            statusCode: 400,
            actionable: 'Check tool/vendor names, lengths, and required fields.',
            supportCode: 'STRUCTURED_PAYLOAD_INVALID'
          }
        );
        return res.status(response.statusCode).json(response.body);
      }

      const result = await policyAgentRuntime.evaluateRequest({
        tool,
        vendor,
        usage,
        dataHandling: dataHandling || 'no_customer_data',
        userId,
        enterpriseId,
        partnerId, // Boundary Governance: null = enterprise-run, value = partner-run mode
        scopeId,
        urgencyLevel: urgencyLevel || 0.5,
        additionalContext
      });

      const response = successResponse(result, {
        evaluatedAt: new Date().toISOString(),
        agent: 'policy-agent-runtime',
        workflow: result.workflow,
        traceId: result.traceContext?.traceId
      });
      res.status(response.statusCode).json(response.body);

    } catch (error) {
      logger.error('Policy evaluation error', { error, traceId: req?.traceId });
      const response = errorResponse('POLICY_EVAL_FAILED', 'Policy evaluation failed', {
        statusCode: 500,
        actionable: 'Retry later or contact an admin.',
        supportCode: 'POLICY_EVAL_500',
        meta: { traceId: req?.traceId }
      });
      res.status(response.statusCode).json(response.body);
    }
  }
);

// =============================================================================
// HUMAN-IN-THE-LOOP ENDPOINTS
// =============================================================================

// GET /api/ai/approvals/pending - Get pending approvals for current user
router.get(
  '/approvals/pending',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id;

      const pendingApprovals = await hilManager.getPendingApprovals(
        user.id || user.userId,
        enterpriseId
      );

      res.json({
        success: true,
        data: pendingApprovals,
        count: pendingApprovals.length
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error fetching pending approvals:', error);
      res.status(500).json({
        error: 'Failed to fetch pending approvals',
        message: error.message
      });
    }
  }
);

// POST /api/ai/approvals/:approvalId/approve - Approve a pending decision
router.post(
  '/approvals/:approvalId/approve',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { comments } = req.body;
      const user = req.user || {};

      const result = await hilManager.approveDecision(
        approvalId,
        user.id || user.userId,
        comments || 'Approved via API'
      );

      res.json({
        success: true,
        data: result,
        message: 'Decision approved successfully'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error approving decision:', error);
      res.status(500).json({
        error: 'Failed to approve decision',
        message: error.message
      });
    }
  }
);

// POST /api/ai/approvals/:approvalId/reject - Reject a pending decision
router.post(
  '/approvals/:approvalId/reject',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { reason, comments } = req.body;
      const user = req.user || {};

      if (!reason) {
        return res.status(400).json({
          error: 'Rejection reason is required'
        });
      }

      const result = await hilManager.rejectDecision(
        approvalId,
        user.id || user.userId,
        reason,
        comments || 'Rejected via API'
      );

      res.json({
        success: true,
        data: result,
        message: 'Decision rejected successfully'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error rejecting decision:', error);
      res.status(500).json({
        error: 'Failed to reject decision',
        message: error.message
      });
    }
  }
);

// POST /api/ai/approvals/:approvalId/escalate - Escalate a decision for higher review
router.post(
  '/approvals/:approvalId/escalate',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { reason } = req.body;
      const user = req.user || {};

      if (!reason) {
        return res.status(400).json({
          error: 'Escalation reason is required'
        });
      }

      const result = await hilManager.escalateApproval(
        approvalId,
        reason,
        user.id || user.userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Decision escalated successfully'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error escalating decision:', error);
      res.status(500).json({
        error: 'Failed to escalate decision',
        message: error.message
      });
    }
  }
);

// GET /api/ai/approvals/stats - Get approval statistics
router.get(
  '/approvals/stats',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id;
      const { timeRange } = req.query;

      if (!enterpriseId) {
        return res.status(400).json({
          error: 'Enterprise ID required for approval stats'
        });
      }

      const stats = await hilManager.getApprovalStats(enterpriseId, timeRange);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error fetching approval stats:', error);
      res.status(500).json({
        error: 'Failed to fetch approval statistics',
        message: error.message
      });
    }
  }
);

// =============================================================================
// AUDIT AGENT ENDPOINTS
// =============================================================================

// POST /api/ai/audit/log - Manual audit logging
router.post(
  '/audit/log',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        eventType,
        agentType,
        decision,
        reasoning,
        policyReferences = [],
        beforeState,
        afterState,
        enterpriseId,
        traceContext,
        spanId,
        metadata = {}
      } = req.body;

      const user = req.user || {};

      if (!eventType || !agentType || !enterpriseId) {
        return res.status(400).json({
          error: 'Missing required fields: eventType, agentType, enterpriseId'
        });
      }

      const result = await auditAgentRuntime.logDecision({
        agentType,
        eventType,
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

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Audit event logged successfully' : 'Failed to log audit event'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error logging audit event:', error);
      res.status(500).json({
        error: 'Failed to log audit event',
        message: error.message
      });
    }
  }
);

// GET /api/ai/audit/query - Query audit trail
router.get(
  '/audit/query',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id || req.query.enterpriseId;
      const { agentType, eventType, traceId, startDate, endDate, limit, offset, naturalLanguageQuery } = req.query;

      if (!enterpriseId) {
        return res.status(400).json({
          error: 'Enterprise ID required for audit query'
        });
      }

      const dateRange = (startDate || endDate) ? {
        start: startDate,
        end: endDate
      } : undefined;

      const result = await auditAgentRuntime.queryAuditTrail({
        enterpriseId,
        agentType,
        eventType,
        dateRange,
        traceId,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0,
        naturalLanguageQuery
      });

      res.json({
        success: result.success,
        data: result
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error querying audit trail:', error);
      res.status(500).json({
        error: 'Failed to query audit trail',
        message: error.message
      });
    }
  }
);

// POST /api/ai/audit/export - Export audit logs
router.post(
  '/audit/export',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id || req.body.enterpriseId;
      const { format, dateRange, filters = {}, includeMetadata = true } = req.body;

      if (!enterpriseId || !format || !dateRange) {
        return res.status(400).json({
          error: 'Missing required fields: enterpriseId, format, dateRange'
        });
      }

      const result = await auditAgentRuntime.exportAuditLog({
        enterpriseId,
        format,
        dateRange,
        filters,
        includeMetadata
      });

      if (result.success) {
        // Set appropriate headers based on format
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="audit-export-${enterpriseId}-${Date.now()}.csv"`);
          return res.send(result.exportData);
        } else if (format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="audit-export-${enterpriseId}-${Date.now()}.json"`);
          return res.json(result.exportData);
        } else if (format === 'pdf') {
          // PDF would require actual PDF generation
          res.setHeader('Content-Type', 'application/json');
          return res.json({
            success: true,
            message: 'PDF export data prepared (PDF generation requires additional service)',
            data: result.exportData
          });
        }
      }

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Audit log exported successfully' : 'Failed to export audit log'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error exporting audit log:', error);
      res.status(500).json({
        error: 'Failed to export audit log',
        message: error.message
      });
    }
  }
);

// =============================================================================
// RISK AGENT ENDPOINTS
// =============================================================================

// POST /api/ai/risk/assess - Risk assessment
router.post(
  '/risk/assess',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        toolMetadata,
        vendorData = {},
        usageContext = {},
        telemetryAtoms = [],
        options = {}
      } = req.body;

      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id || options.enterpriseId;

      if (!toolMetadata || !toolMetadata.name) {
        return res.status(400).json({
          error: 'Missing required field: toolMetadata.name'
        });
      }

      // Comprehensive risk assessment
      const result = await riskAgentRuntime.assessRiskComprehensive(
        toolMetadata,
        vendorData,
        usageContext,
        telemetryAtoms,
        {
          ...options,
          enterpriseId
        }
      );

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Risk assessment completed' : 'Failed to assess risk'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error assessing risk:', error);
      res.status(500).json({
        error: 'Failed to assess risk',
        message: error.message
      });
    }
  }
);

// GET /api/ai/risk/history - Risk history
router.get(
  '/risk/history',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id || req.query.enterpriseId;
      const { toolId, vendorId, startDate, endDate, limit } = req.query;

      if (!toolId && !vendorId) {
        return res.status(400).json({
          error: 'Either toolId or vendorId is required'
        });
      }

      const timeRange = (startDate || endDate) ? {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      } : null;

      const result = await riskAgentRuntime.getRiskHistory(
        toolId,
        vendorId,
        timeRange,
        enterpriseId
      );

      res.json({
        success: result.success,
        data: result
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error fetching risk history:', error);
      res.status(500).json({
        error: 'Failed to fetch risk history',
        message: error.message
      });
    }
  }
);

// =============================================================================
// INTAKE AGENT ENDPOINTS
// =============================================================================

// POST /api/ai/intake/normalize - Normalize any input format to policy evaluation request
router.post(
  '/intake/normalize',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        input,
        inputType = 'unknown',
        context = {}
      } = req.body;

      const user = req.user || {};
      const finalContext = {
        enterpriseId: context.enterpriseId || user.enterpriseId || user.organization_id,
        userId: context.userId || user.id || user.userId,
        workspaceId: context.workspaceId || user.workspaceId,
        role: user.role,
        department: user.department,
        ...context
      };

      if (!input) {
        return res.status(400).json({
          error: 'Missing required field: input'
        });
      }

      console.log(`[AI-GATEWAY] Intake normalization request: ${inputType}`);

      const result = await intakeAgentRuntime.normalizeRequest(input, inputType, finalContext);

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Input normalized successfully' : 'Failed to normalize input'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Intake normalization error:', error);
      res.status(500).json({
        error: 'Intake normalization failed',
        message: error.message
      });
    }
  }
);

// POST /api/ai/intake/extract - Extract tool request from unstructured text
router.post(
  '/intake/extract',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        text,
        inputType = 'text',
        context = {}
      } = req.body;

      const user = req.user || {};
      const finalContext = {
        enterpriseId: context.enterpriseId || user.enterpriseId || user.organization_id,
        userId: context.userId || user.id || user.userId,
        workspaceId: context.workspaceId || user.workspaceId,
        ...context
      };

      if (!text) {
        return res.status(400).json({
          error: 'Missing required field: text'
        });
      }

      console.log(`[AI-GATEWAY] Tool extraction request: ${text.substring(0, 50)}...`);

      const result = await intakeAgentRuntime.normalizeRequest(text, inputType, finalContext);

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Tool request extracted successfully' : 'Failed to extract tool request'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Tool extraction error:', error);
      res.status(500).json({
        error: 'Tool extraction failed',
        message: error.message
      });
    }
  }
);

// =============================================================================
// TOOL REGISTRY AGENT ENDPOINTS
// =============================================================================

// POST /api/ai/tool-registry/verify - Verify tool identity and version
router.post(
  '/tool-registry/verify',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        toolName,
        provider,
        version,
        enterpriseId
      } = req.body;

      const user = req.user || {};
      const finalEnterpriseId = enterpriseId || user.enterpriseId || user.organization_id;

      if (!toolName || !provider) {
        return res.status(400).json({
          error: 'Missing required fields: toolName, provider'
        });
      }

      if (!finalEnterpriseId) {
        return res.status(400).json({
          error: 'Enterprise ID required for tool verification'
        });
      }

      const result = await toolRegistryAgentRuntime.verifyTool(
        toolName,
        provider,
        version || 'latest',
        finalEnterpriseId
      );

      res.json({
        success: result.verified,
        data: result,
        message: result.verified ? 'Tool verified successfully' : 'Tool verification failed'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error verifying tool:', error);
      res.status(500).json({
        error: 'Failed to verify tool',
        message: error.message
      });
    }
  }
);

// GET /api/ai/tool-registry/metadata/:toolId - Get tool metadata
router.get(
  '/tool-registry/metadata/:toolId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { toolId } = req.params;
      const { versionId } = req.query;

      if (!toolId) {
        return res.status(400).json({
          error: 'Tool ID is required'
        });
      }

      const result = await toolRegistryAgentRuntime.getToolMetadata(toolId, versionId);

      res.json({
        success: result.complete !== false,
        data: result
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error fetching tool metadata:', error);
      res.status(500).json({
        error: 'Failed to fetch tool metadata',
        message: error.message
      });
    }
  }
);

// GET /api/ai/tool-registry/constraints/:toolId - Get tool constraints
router.get(
  '/tool-registry/constraints/:toolId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { toolId } = req.params;
      const user = req.user || {};
      const enterpriseId = user.enterpriseId || user.organization_id || req.query.enterpriseId;

      if (!toolId) {
        return res.status(400).json({
          error: 'Tool ID is required'
        });
      }

      if (!enterpriseId) {
        return res.status(400).json({
          error: 'Enterprise ID required for constraint lookup'
        });
      }

      const result = await toolRegistryAgentRuntime.checkConstraints(toolId, enterpriseId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error fetching tool constraints:', error);
      res.status(500).json({
        error: 'Failed to fetch tool constraints',
        message: error.message
      });
    }
  }
);

// =============================================================================
// APPROVALS AGENT ENDPOINTS
// =============================================================================

// POST /api/ai/approvals/orchestrate - Orchestrate intelligent approval workflow
router.post(
  '/approvals/orchestrate',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const {
        approvalRequest,
        enterpriseContext = {}
      } = req.body;

      const user = req.user || {};
      const finalEnterpriseId = approvalRequest.enterpriseId || user.enterpriseId || user.organization_id;

      if (!approvalRequest || !finalEnterpriseId) {
        return res.status(400).json({
          error: 'Missing required fields: approvalRequest, enterpriseId'
        });
      }

      // Add enterprise context
      approvalRequest.enterpriseId = finalEnterpriseId;

      const orchestrationResult = await approvalsAgentRuntime.orchestrateApproval(
        approvalRequest,
        {
          enterpriseId: finalEnterpriseId,
          ...enterpriseContext
        }
      );

      res.json({
        success: true,
        data: orchestrationResult
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Approvals orchestration error:', error);
      res.status(500).json({
        error: 'Failed to orchestrate approval workflow',
        message: error.message
      });
    }
  }
);

// GET /api/ai/approvals/stats/:enterpriseId - Get approval workflow statistics
router.get(
  '/approvals/stats/:enterpriseId',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      const { enterpriseId } = req.params;
      const { timeRange = '30d' } = req.query;

      if (!enterpriseId) {
        return res.status(400).json({
          error: 'Missing required parameter: enterpriseId'
        });
      }

      const stats = await approvalsAgentRuntime.getApprovalStats(enterpriseId, timeRange);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error fetching approval stats:', error);
      res.status(500).json({
        error: 'Failed to fetch approval statistics',
        message: error.message
      });
    }
  }
);

// POST /api/ai/approvals/monitor - Trigger approval workflow monitoring
router.post(
  '/approvals/monitor',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  async (req, res) => {
    try {
      await approvalsAgentRuntime.monitorApprovals();

      res.json({
        success: true,
        message: 'Approval monitoring completed'
      });

    } catch (error) {
      console.error('[AI-GATEWAY] Error monitoring approvals:', error);
      res.status(500).json({
        error: 'Failed to monitor approvals',
        message: error.message
      });
    }
  }
);

export default router;










