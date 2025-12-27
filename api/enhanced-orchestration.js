/**
 * Enhanced Orchestration API Routes
 * 
 * Provides endpoints for the enhanced agent orchestration system
 * with Trust & Transparency Layer and Agency-Enterprise Bridge integration
 */

import express from 'express';
const router = express.Router();
import pool from '../database/connection.js';
import { checkJwt, requirePermission, requireOrganizationAccess } from './auth/auth0-middleware.js';

// Import the enhanced orchestration engine
import EnhancedOrchestrationEngine from '../core/enhanced-orchestration-engine.js';
import TrustTransparencyLayer from '../core/trust-transparency-layer.js';
import AgencyEnterpriseBridge from '../core/agency-enterprise-bridge.js';

// Initialize the orchestration engine
const orchestrationEngine = new EnhancedOrchestrationEngine();
const trustTransparencyLayer = new TrustTransparencyLayer();
const agencyEnterpriseBridge = new AgencyEnterpriseBridge();

/**
 * POST /api/enhanced-orchestration/process
 * Process a request through the enhanced orchestration engine
 */
router.post('/process', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { type, content, metadata, context } = req.body;
    const userId = req.user.sub;
    const enterpriseId = req.organization?.id;

    console.log('🚀 Enhanced Orchestration API: Processing request');
    console.log(`📝 Type: ${type}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🏢 Enterprise: ${enterpriseId}`);

    // Prepare input for orchestration
    const input = {
      type,
      content,
      metadata: metadata || {},
      userId,
      enterpriseId
    };

    const orchestrationContext = {
      userId,
      enterpriseId,
      userRole: req.user['https://aicomplyr.io/roles'] || 'user',
      requestType: type,
      userContext: context || {},
      policies: req.organization?.policies || [],
      riskFactors: req.organization?.riskFactors || []
    };

    // Process through enhanced orchestration engine
    const result = await orchestrationEngine.orchestrateRequest(input, orchestrationContext);

    res.json({
      success: true,
      sessionId: result.sessionId,
      workflowType: result.workflowType,
      result: result.result,
      auditTrail: result.auditTrail,
      processingTime: result.processingTime,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error('❌ Enhanced Orchestration API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-orchestration/agency-tool-submission
 * Handle agency AI tool submission workflow
 */
router.post('/agency-tool-submission', checkJwt, requireOrganizationAccess, requirePermission('agency:submit'), async (req, res) => {
  try {
    const { toolName, toolDescription, complianceData, clientContext } = req.body;
    const userId = req.user.sub;
    const enterpriseId = req.organization?.id;
    const agencyId = req.organization?.id; // Assuming agency context

    console.log('🏭 Agency Tool Submission:', toolName);

    const input = {
      type: 'agency-tool-submission',
      content: {
        toolName,
        toolDescription,
        complianceData,
        clientContext
      },
      userId,
      enterpriseId,
      agencyId
    };

    const context = {
      userId,
      enterpriseId,
      agencyId,
      userRole: 'agency_admin',
      requestType: 'agency-tool-submission',
      userContext: {
        toolName,
        clientContext
      }
    };

    const result = await orchestrationEngine.orchestrateRequest(input, context);

    res.json({
      success: true,
      sessionId: result.sessionId,
      workflowType: result.workflowType,
      status: result.result.finalResult.status,
      requiresEnterpriseReview: result.result.finalResult.requiresHumanReview,
      nextSteps: result.result.finalResult.nextSteps,
      auditTrail: result.auditTrail
    });

  } catch (error) {
    console.error('❌ Agency Tool Submission Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-orchestration/enterprise-policy-creation
 * Handle enterprise policy creation workflow
 */
router.post('/enterprise-policy-creation', checkJwt, requireOrganizationAccess, requirePermission('policy:write'), async (req, res) => {
  try {
    const { policyName, policyContent, targetAgencies, complianceRequirements } = req.body;
    const userId = req.user.sub;
    const enterpriseId = req.organization?.id;

    console.log('🏢 Enterprise Policy Creation:', policyName);

    const input = {
      type: 'enterprise-policy-creation',
      content: {
        policyName,
        policyContent,
        targetAgencies,
        complianceRequirements
      },
      userId,
      enterpriseId
    };

    const context = {
      userId,
      enterpriseId,
      userRole: 'enterprise_admin',
      requestType: 'enterprise-policy-creation',
      userContext: {
        policyName,
        targetAgencies
      }
    };

    const result = await orchestrationEngine.orchestrateRequest(input, context);

    res.json({
      success: true,
      sessionId: result.sessionId,
      workflowType: result.workflowType,
      status: result.result.finalResult.status,
      distributedToAgencies: result.result.finalResult.distributedToAgencies || [],
      auditTrail: result.auditTrail
    });

  } catch (error) {
    console.error('❌ Enterprise Policy Creation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-orchestration/multi-client-conflict-resolution
 * Handle multi-client conflict resolution workflow
 */
router.post('/multi-client-conflict-resolution', checkJwt, requireOrganizationAccess, requirePermission('policy:write'), async (req, res) => {
  try {
    const { clients, conflicts, resolutionStrategy } = req.body;
    const userId = req.user.sub;
    const enterpriseId = req.organization?.id;

    console.log('🤝 Multi-Client Conflict Resolution');

    const input = {
      type: 'multi-client-conflict-resolution',
      content: {
        clients,
        conflicts,
        resolutionStrategy
      },
      userId,
      enterpriseId
    };

    const context = {
      userId,
      enterpriseId,
      userRole: 'enterprise_admin',
      requestType: 'multi-client-conflict-resolution',
      userContext: {
        clients,
        conflicts
      }
    };

    const result = await orchestrationEngine.orchestrateRequest(input, context);

    res.json({
      success: true,
      sessionId: result.sessionId,
      workflowType: result.workflowType,
      status: result.result.finalResult.status,
      conflictsResolved: result.result.finalResult.conflictsResolved || 0,
      requiresHumanReview: result.result.finalResult.requiresHumanReview,
      auditTrail: result.auditTrail
    });

  } catch (error) {
    console.error('❌ Multi-Client Conflict Resolution Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-orchestration/compliance-audit
 * Trigger compliance audit workflow
 */
router.post('/compliance-audit', checkJwt, requireOrganizationAccess, requirePermission('audit:read'), async (req, res) => {
  try {
    const { auditScope, targetOrganizations, reportType } = req.body;
    const userId = req.user.sub;
    const enterpriseId = req.organization?.id;

    console.log('📋 Compliance Audit Workflow');

    const input = {
      type: 'compliance-audit',
      content: {
        auditScope,
        targetOrganizations,
        reportType
      },
      userId,
      enterpriseId
    };

    const context = {
      userId,
      enterpriseId,
      userRole: 'compliance_officer',
      requestType: 'compliance-audit',
      userContext: {
        auditScope,
        targetOrganizations
      }
    };

    const result = await orchestrationEngine.orchestrateRequest(input, context);

    res.json({
      success: true,
      sessionId: result.sessionId,
      workflowType: result.workflowType,
      status: result.result.finalResult.status,
      reportGenerated: result.result.finalResult.reportGenerated || false,
      auditTrail: result.auditTrail
    });

  } catch (error) {
    console.error('❌ Compliance Audit Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/enhanced-orchestration/human-override-review
 * Handle human override review workflow
 */
router.post('/human-override-review', checkJwt, requireOrganizationAccess, requirePermission('review_overrides'), async (req, res) => {
  try {
    const { overrideRequestId, decision, reasoning, notes } = req.body;
    const userId = req.user.sub;
    const enterpriseId = req.organization?.id;

    console.log('👤 Human Override Review:', overrideRequestId);

    const input = {
      type: 'human-override-review',
      content: {
        overrideRequestId,
        decision,
        reasoning,
        notes
      },
      userId,
      enterpriseId
    };

    const context = {
      userId,
      enterpriseId,
      userRole: 'reviewer',
      requestType: 'human-override-review',
      userContext: {
        overrideRequestId,
        decision
      }
    };

    const result = await orchestrationEngine.orchestrateRequest(input, context);

    res.json({
      success: true,
      sessionId: result.sessionId,
      workflowType: result.workflowType,
      status: result.result.finalResult.status,
      overrideResolved: result.result.finalResult.overrideResolved || false,
      auditTrail: result.auditTrail
    });

  } catch (error) {
    console.error('❌ Human Override Review Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-orchestration/transparency-report/:sessionId
 * Get transparency report for a session
 */
router.get('/transparency-report/:sessionId', checkJwt, requireOrganizationAccess, requirePermission('audit:read'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🔍 Generating transparency report for session:', sessionId);

    const report = await trustTransparencyLayer.generateTransparencyReport(sessionId);

    res.json({
      success: true,
      sessionId,
      report
    });

  } catch (error) {
    console.error('❌ Transparency Report Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-orchestration/distribution-stats/:enterpriseId
 * Get distribution statistics for an enterprise
 */
router.get('/distribution-stats/:enterpriseId', checkJwt, requireOrganizationAccess, requirePermission('policy:read'), async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    console.log('📊 Getting distribution stats for enterprise:', enterpriseId);

    const stats = await agencyEnterpriseBridge.getDistributionStats(enterpriseId);

    res.json({
      success: true,
      enterpriseId,
      stats
    });

  } catch (error) {
    console.error('❌ Distribution Stats Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-orchestration/agency-compliance/:agencyId
 * Get compliance report for an agency
 */
router.get('/agency-compliance/:agencyId', checkJwt, requireOrganizationAccess, requirePermission('policy:read'), async (req, res) => {
  try {
    const { agencyId } = req.params;

    console.log('📋 Getting compliance report for agency:', agencyId);

    const complianceReport = await agencyEnterpriseBridge.getAgencyComplianceReport(agencyId);

    res.json({
      success: true,
      agencyId,
      complianceReport
    });

  } catch (error) {
    console.error('❌ Agency Compliance Report Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-orchestration/workflows
 * Get available workflow configurations
 */
router.get('/workflows', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const workflows = {
      'agency-tool-submission': {
        description: 'Agency AI tool submission workflow with enterprise review',
        agents: ['pre-flight', 'context', 'policy', 'conflict-detection', 'negotiation', 'audit'],
        sla_hours: 48,
        auto_distribute: true
      },
      'enterprise-policy-creation': {
        description: 'Enterprise policy creation with automatic distribution',
        agents: ['context', 'policy', 'conflict-detection', 'audit'],
        sla_hours: 24,
        auto_distribute: true
      },
      'multi-client-conflict-resolution': {
        description: 'Multi-client conflict resolution with human oversight',
        agents: ['context', 'conflict-detection', 'negotiation', 'audit'],
        sla_hours: 72,
        requires_human_review: true
      },
      'compliance-audit-workflow': {
        description: 'Scheduled compliance audit with automated reporting',
        agents: ['audit', 'pattern-recognition', 'policy'],
        sla_hours: 168, // 1 week
        generates_reports: true
      },
      'human-override-review': {
        description: 'Human override review workflow',
        agents: ['context', 'audit'],
        sla_hours: 4,
        requires_human_review: true
      },
      'policy-distribution-sync': {
        description: 'Real-time policy distribution and sync',
        agents: ['policy', 'conflict-detection', 'audit'],
        sla_hours: 1,
        real_time_sync: true
      }
    };

    res.json({
      success: true,
      workflows
    });

  } catch (error) {
    console.error('❌ Workflows Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-orchestration/status
 * Get orchestration engine status
 */
router.get('/status', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const status = {
      orchestrationEngine: 'operational',
      trustTransparencyLayer: 'operational',
      agencyEnterpriseBridge: 'operational',
      activeSessions: orchestrationEngine.activeWorkflows.size,
      activeConnections: agencyEnterpriseBridge.activeConnections.size,
      distributionQueue: agencyEnterpriseBridge.distributionQueue.length,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('❌ Status Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 