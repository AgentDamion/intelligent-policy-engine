import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tool } from 'ai';

/**
 * AICOMPLYR Approvals Tools for AI SDK
 *
 * Provides AI SDK tool wrappers for intelligent approval routing and orchestration:
 * 1. routeApproval - Determine correct approvers based on jurisdiction and expertise
 * 2. calculateSLA - Compute approval SLAs based on risk and priority
 * 3. orchestrateWorkflow - Manage complex approval chains and parallel reviews
 * 4. determineJurisdiction - Map decisions to appropriate regulatory jurisdictions
 * 5. enrichApprovalContext - Add context for informed decision making
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
 * Tool 1: routeApproval
 * Intelligently route approval requests to the correct people based on jurisdiction, expertise, and role hierarchy
 */
export const routeApproval = tool({
  name: 'routeApproval',
  description: 'Routes approval requests to appropriate reviewers.',
  parameters: z.object({
    approvalRequestId: z.string().describe('Approval request ID'),
    decisionStatus: z.string().describe('The decision status'),
    decisionReason: z.string().describe('The decision reason'),
    enterpriseId: z.string().describe('Enterprise context'),
    riskLevel: z.string().describe('Risk level'),
    urgencyLevel: z.number().optional().describe('Urgency score')
  }),
  execute: async ({ approvalRequestId, decisionStatus, decisionReason, enterpriseId, riskLevel, urgencyLevel }) => {
    try {
      const approvalRequest = {
        id: approvalRequestId,
        decision: { status: decisionStatus, reason: decisionReason },
        enterpriseId,
        riskLevel,
        urgencyLevel
      };
      console.log(`[APPROVALS-TOOLS] Routing approval ${approvalRequestId} with risk ${riskLevel}`);

      const routingDecision = await determineOptimalReviewers(approvalRequest, routingContext);

      console.log(`[APPROVALS-TOOLS] Routed to ${routingDecision.selectedReviewers.length} reviewers: ${routingDecision.selectedReviewers.map(r => r.userId).join(', ')}`);

      return {
        success: true,
        routing: routingDecision,
        approvalRequest: approvalRequest.id,
        confidence: routingDecision.confidence
      };
    } catch (error) {
      console.error('[APPROVALS-TOOLS] Error routing approval:', error);
      return {
        success: false,
        error: error.message,
        approvalRequest: approvalRequest.id,
        fallbackRouting: await getFallbackRouting(approvalRequest)
      };
    }
  }
});

/**
 * Tool 2: calculateSLA
 * Compute approval SLAs based on risk level, priority, and organizational policies
 */
export const calculateSLA = tool({
  name: 'calculateSLA',
  description: 'Calculates Service Level Agreements (SLAs) for approval requests.',
  parameters: z.object({
    approvalRequestId: z.string().describe('Approval request ID'),
    riskLevel: z.string().describe('Risk level'),
    priority: z.string().describe('Priority level'),
    enterpriseId: z.string().describe('Enterprise ID')
  }),
  execute: async ({ approvalRequestId, riskLevel, priority, enterpriseId }) => {
    try {
      const approvalRequest = {
        id: approvalRequestId,
        riskLevel,
        priority,
        enterpriseId
      };
      console.log(`[APPROVALS-TOOLS] Calculating SLA for ${riskLevel} risk approval`);

      const slaCalculation = await computeApprovalSLA(approvalRequest, slaPolicies);

      console.log(`[APPROVALS-TOOLS] SLA calculated: ${slaCalculation.totalHours} hours, ${slaCalculation.escalationPoints.length} escalation points`);

      return {
        success: true,
        sla: slaCalculation,
        approvalRequest: approvalRequest.id
      };
    } catch (error) {
      console.error('[APPROVALS-TOOLS] Error calculating SLA:', error);
      return {
        success: false,
        error: error.message,
        approvalRequest: approvalRequest.id,
        defaultSLA: getDefaultSLA(approvalRequest.riskLevel)
      };
    }
  }
});

/**
 * Tool 3: orchestrateWorkflow
 * Manage complex approval workflows with parallel reviews, sequential approvals, and conditional logic
 */
export const orchestrateWorkflow = tool({
  name: 'orchestrateWorkflow',
  description: 'Orchestrates complex approval workflows.',
  parameters: z.object({
    workflowId: z.string().describe('Workflow definition ID'),
    workflowType: z.string().describe('Workflow orchestration type'),
    requestId: z.string().describe('Request ID'),
    enterpriseId: z.string().describe('Enterprise ID')
  }),
  execute: async ({ workflowId, workflowType, requestId, enterpriseId }) => {
    try {
      const workflowDefinition = { id: workflowId, type: workflowType, stages: [], sla: { total: 24 } };
      const approvalContext = { requestId, enterpriseId };
      console.log(`[APPROVALS-TOOLS] Orchestrating ${workflowType} workflow for request ${requestId}`);

      const orchestrationResult = await orchestrateApprovalWorkflow(workflowDefinition, approvalContext);

      console.log(`[APPROVALS-TOOLS] Workflow orchestration: ${orchestrationResult.status}, next stage: ${orchestrationResult.nextStage || 'complete'}`);

      return {
        success: true,
        orchestration: orchestrationResult,
        workflow: workflowDefinition.id,
        request: approvalContext.requestId
      };
    } catch (error) {
      console.error('[APPROVALS-TOOLS] Error orchestrating workflow:', error);
      return {
        success: false,
        error: error.message,
        workflow: workflowDefinition.id,
        request: approvalContext.requestId,
        fallbackAction: 'escalate_to_admin'
      };
    }
  }
});

/**
 * Tool 4: determineJurisdiction
 * Map decisions to appropriate regulatory jurisdictions based on content, geography, and industry
 */
export const determineJurisdiction = tool({
  name: 'determineJurisdiction',
  description: 'Determines regulatory jurisdictions for approval requests.',
  parameters: z.object({
    requestId: z.string().describe('Request ID'),
    enterpriseId: z.string().describe('Enterprise ID'),
    toolDataHandling: z.string().optional().describe('Data handling practices'),
    geographicScope: z.array(z.string()).optional().describe('Geographic scope'),
    industry: z.string().optional().describe('Industry context')
  }),
  execute: async ({ requestId, enterpriseId, toolDataHandling, geographicScope, industry }) => {
    try {
      const approvalRequest = {
        id: requestId,
        enterpriseId,
        dataHandling: toolDataHandling,
        geographicScope,
        industry
      };
      console.log(`[APPROVALS-TOOLS] Determining jurisdiction for approval ${requestId}`);

      const jurisdictionAnalysis = await analyzeJurisdictionRequirements(approvalRequest, jurisdictionRules);

      console.log(`[APPROVALS-TOOLS] Determined ${jurisdictionAnalysis.jurisdictions.length} applicable jurisdictions: ${jurisdictionAnalysis.jurisdictions.join(', ')}`);

      return {
        success: true,
        jurisdiction: jurisdictionAnalysis,
        approvalRequest: approvalRequest.id
      };
    } catch (error) {
      console.error('[APPROVALS-TOOLS] Error determining jurisdiction:', error);
      return {
        success: false,
        error: error.message,
        approvalRequest: approvalRequest.id,
        defaultJurisdiction: ['US'] // Fallback
      };
    }
  }
});

/**
 * Tool 5: enrichApprovalContext
 * Add comprehensive context for informed approval decisions
 */
export const enrichApprovalContext = tool({
  name: 'enrichApprovalContext',
  description: 'Enriches approval requests with comprehensive context.',
  parameters: z.object({
    requestId: z.string().describe('Request ID'),
    enterpriseId: z.string().describe('Enterprise context'),
    riskLevel: z.string().describe('Risk level'),
    decisionStatus: z.string().describe('Decision status')
  }),
  execute: async ({ requestId, enterpriseId, riskLevel, decisionStatus }) => {
    try {
      const approvalRequest = {
        id: requestId,
        enterpriseId,
        riskLevel,
        decision: { status: decisionStatus }
      };
      console.log(`[APPROVALS-TOOLS] Enriching context for approval ${requestId}`);

      const enrichedContext = await buildComprehensiveApprovalContext(approvalRequest, enrichmentSources);

      console.log(`[APPROVALS-TOOLS] Context enriched with ${enrichedContext.contextElements.length} elements`);

      return {
        success: true,
        enriched: enrichedContext,
        approvalRequest: approvalRequest.id
      };
    } catch (error) {
      console.error('[APPROVALS-TOOLS] Error enriching context:', error);
      return {
        success: false,
        error: error.message,
        approvalRequest: approvalRequest.id,
        enriched: { contextElements: [], enrichedRequest: approvalRequest }
      };
    }
  }
});

// Helper functions for tool implementations

async function determineOptimalReviewers(approvalRequest, routingContext) {
  const { riskLevel, jurisdiction = [], toolCategories = [] } = approvalRequest;

  // Risk-based routing logic
  const riskRouting = {
    minimal: ['junior-reviewer', 'auto-approve'],
    low: ['compliance-officer'],
    medium: ['senior-compliance-officer', 'department-head'],
    high: ['chief-compliance-officer', 'legal-counsel'],
    critical: ['ceo', 'board-member', 'external-auditor']
  };

  // Jurisdiction-based routing
  const jurisdictionExperts = {
    'FDA': ['regulatory-specialist', 'medical-legal-counsel'],
    'GDPR': ['privacy-officer', 'eu-compliance-lead'],
    'HIPAA': ['healthcare-compliance', 'privacy-officer'],
    'SOX': ['financial-compliance', 'audit-committee']
  };

  // Determine required reviewers
  const requiredReviewers = riskRouting[riskLevel] || riskRouting.medium;

  // Add jurisdiction experts
  jurisdiction.forEach(juris => {
    const experts = jurisdictionExperts[juris];
    if (experts) {
      requiredReviewers.push(...experts);
    }
  });

  // Remove duplicates and filter by availability
  const uniqueRoles = [...new Set(requiredReviewers)];
  const availableReviewers = routingContext.availableReviewers || [];

  // Map roles to actual users (simplified)
  const selectedReviewers = uniqueRoles.map(role => ({
    userId: `${role}@${approvalRequest.enterpriseId}`,
    role,
    reason: `Required for ${riskLevel} risk ${jurisdiction.join(',')} approval`
  }));

  return {
    selectedReviewers,
    routingLogic: {
      riskBased: riskLevel,
      jurisdictionBased: jurisdiction,
      categoryBased: toolCategories
    },
    confidence: 0.85,
    fallbackReviewers: ['compliance-admin']
  };
}

async function computeApprovalSLA(approvalRequest, slaPolicies) {
  const { riskLevel, jurisdiction = [], priority } = approvalRequest;

  // Base SLAs in hours
  const baseSLAs = slaPolicies?.baseSLAs || {
    minimal: 168, // 1 week
    low: 72,      // 3 days
    medium: 24,   // 1 day
    high: 8,      // 8 hours
    critical: 2   // 2 hours
  };

  let totalHours = baseSLAs[riskLevel] || baseSLAs.medium;

  // Apply jurisdiction multipliers
  const jurisdictionMultipliers = slaPolicies?.jurisdictionMultipliers || {
    'FDA': 2.0,
    'GDPR': 1.5,
    'HIPAA': 1.8,
    'SOX': 1.3
  };

  jurisdiction.forEach(juris => {
    const multiplier = jurisdictionMultipliers[juris];
    if (multiplier) {
      totalHours *= multiplier;
    }
  });

  // Priority adjustments
  const priorityMultipliers = {
    low: 1.5,
    medium: 1.0,
    high: 0.7,
    critical: 0.3
  };

  totalHours *= priorityMultipliers[priority] || 1.0;

  // Calculate escalation points
  const escalationPoints = [];
  const escalationTriggers = slaPolicies?.escalationTriggers || [
    { threshold: 0.5, action: 'remind_reviewer', notify: ['reviewer'] },
    { threshold: 0.8, action: 'notify_supervisor', notify: ['supervisor'] },
    { threshold: 1.0, action: 'escalate_to_admin', notify: ['admin', 'reviewer'] }
  ];

  escalationTriggers.forEach(trigger => {
    escalationPoints.push({
      timeHours: totalHours * trigger.threshold,
      action: trigger.action,
      notify: trigger.notify
    });
  });

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    baseHours: baseSLAs[riskLevel],
    multipliers: {
      jurisdiction: jurisdiction.map(j => ({ [j]: jurisdictionMultipliers[j] || 1 })),
      priority: priorityMultipliers[priority] || 1
    },
    escalationPoints,
    breachConsequences: ['escalation', 'audit_flag', 'supervisor_notification']
  };
}

async function orchestrateApprovalWorkflow(workflowDefinition, approvalContext) {
  const { type, stages } = workflowDefinition;
  const { currentStage, completedStages = [], pendingApprovals = [] } = approvalContext;

  let nextStage = null;
  let status = 'in_progress';
  let requiredActions = [];

  switch (type) {
    case 'sequential':
      // Find next stage after current completed ones
      const nextSequentialStage = stages.find(stage =>
        !completedStages.includes(stage.id)
      );
      if (nextSequentialStage) {
        nextStage = nextSequentialStage.id;
        requiredActions = [{
          type: 'request_approvals',
          reviewers: nextSequentialStage.reviewers,
          quorum: nextSequentialStage.quorum || nextSequentialStage.reviewers.length
        }];
      } else {
        status = 'completed';
      }
      break;

    case 'parallel':
      // All stages run simultaneously
      if (pendingApprovals.length === 0) {
        status = 'completed';
      } else {
        requiredActions = [{
          type: 'wait_for_parallel_approvals',
          pending: pendingApprovals
        }];
      }
      break;

    case 'conditional':
      // Route based on conditions (simplified)
      const conditionalStage = stages.find(stage =>
        stage.conditions?.every(cond => evaluateCondition(cond, approvalContext))
      );
      if (conditionalStage) {
        nextStage = conditionalStage.id;
        requiredActions = [{
          type: 'request_conditional_approvals',
          reviewers: conditionalStage.reviewers,
          conditions: conditionalStage.conditions
        }];
      }
      break;

    case 'quorum':
      // Require majority or specific number of approvals
      const quorumStage = stages[0]; // Simplified - single stage
      const approvalsReceived = completedStages.length;
      const quorumRequired = quorumStage.quorum || Math.ceil(quorumStage.reviewers.length / 2);

      if (approvalsReceived >= quorumRequired) {
        status = 'completed';
      } else {
        requiredActions = [{
          type: 'wait_for_quorum',
          received: approvalsReceived,
          required: quorumRequired,
          remainingReviewers: quorumStage.reviewers.slice(approvalsReceived)
        }];
      }
      break;
  }

  return {
    status,
    nextStage,
    requiredActions,
    workflowProgress: {
      completedStages: completedStages.length,
      totalStages: stages.length,
      pendingApprovals: pendingApprovals.length
    }
  };
}

async function analyzeJurisdictionRequirements(approvalRequest, jurisdictionRules) {
  const { toolCategories = [], dataHandling, geographicScope = [], industry } = approvalRequest;

  const jurisdictions = new Set();

  // Tool category mappings
  const categoryMappings = jurisdictionRules?.mappings || {
    'medical': ['FDA', 'HIPAA'],
    'financial': ['SOX', 'SEC'],
    'privacy': ['GDPR', 'CCPA'],
    'advertising': ['FDA', 'FTC']
  };

  toolCategories.forEach(category => {
    const mapped = categoryMappings[category];
    if (mapped) {
      mapped.forEach(j => jurisdictions.add(j));
    }
  });

  // Data handling mappings
  if (dataHandling === 'customer_data' || dataHandling === 'sensitive_data') {
    jurisdictions.add('GDPR');
    if (geographicScope.includes('US')) {
      jurisdictions.add('CCPA');
    }
  }

  // Geographic mappings
  const geographicMappings = jurisdictionRules?.geographicRules || {
    'EU': ['GDPR'],
    'US': ['FTC', 'CCPA'],
    'healthcare': ['FDA', 'HIPAA']
  };

  geographicScope.forEach(geo => {
    const mapped = geographicMappings[geo];
    if (mapped) {
      mapped.forEach(j => jurisdictions.add(j));
    }
  });

  // Industry mappings
  const industryMappings = jurisdictionRules?.industryRules || {
    'pharmaceutical': ['FDA'],
    'healthcare': ['HIPAA', 'FDA'],
    'finance': ['SOX', 'SEC']
  };

  if (industry && industryMappings[industry]) {
    industryMappings[industry].forEach(j => jurisdictions.add(j));
  }

  return {
    jurisdictions: Array.from(jurisdictions),
    primaryJurisdiction: Array.from(jurisdictions)[0] || 'US',
    complianceRequirements: Array.from(jurisdictions).map(j => ({
      jurisdiction: j,
      requirements: getJurisdictionRequirements(j)
    })),
    confidence: 0.9
  };
}

async function buildComprehensiveApprovalContext(approvalRequest, enrichmentSources) {
  const contextElements = [];
  const enrichedRequest = { ...approvalRequest };

  // Historical patterns
  if (enrichmentSources.historicalApprovals) {
    const similarDecisions = enrichmentSources.historicalApprovals.filter(approval =>
      approval.decision.status === approvalRequest.decision.status &&
      approval.riskLevel === approvalRequest.riskLevel
    );

    if (similarDecisions.length > 0) {
      contextElements.push({
        type: 'historical_patterns',
        title: 'Similar Past Decisions',
        content: `${similarDecisions.length} similar approvals found`,
        details: similarDecisions.slice(0, 3).map(d => ({
          decision: d.decision.reason,
          outcome: d.status,
          approvedBy: d.approved_by
        }))
      });
    }
  }

  // Policy references
  if (enrichmentSources.policyReferences) {
    contextElements.push({
      type: 'policy_guidance',
      title: 'Relevant Policy Sections',
      content: `${enrichmentSources.policyReferences.length} policy sections apply`,
      details: enrichmentSources.policyReferences
    });
  }

  // Regulatory guidance
  if (enrichmentSources.regulatoryGuidance) {
    const jurisdictionGuidance = Object.entries(enrichmentSources.regulatoryGuidance)
      .map(([juris, guidance]) => `${juris}: ${guidance.requirements?.join(', ') || 'Standard compliance'}`);

    contextElements.push({
      type: 'regulatory_requirements',
      title: 'Regulatory Guidance',
      content: jurisdictionGuidance.join('; '),
      details: enrichmentSources.regulatoryGuidance
    });
  }

  // Risk analysis summary
  if (enrichmentSources.riskAnalysis) {
    contextElements.push({
      type: 'risk_summary',
      title: 'Risk Assessment Summary',
      content: `Risk Level: ${enrichmentSources.riskAnalysis.level || 'Unknown'}`,
      details: enrichmentSources.riskAnalysis
    });
  }

  // Reviewer-specific guidance
  if (enrichmentSources.userContext) {
    const { role, expertise = [], approvalHistory } = enrichmentSources.userContext;

    let guidance = `As a ${role}, you have authority to `;
    if (role.includes('admin') || role.includes('chief')) {
      guidance += 'approve high-risk decisions and override standard policies when business-critical.';
    } else if (role.includes('compliance')) {
      guidance += 'ensure regulatory compliance and recommend appropriate safeguards.';
    } else {
      guidance += 'review standard operational decisions within your scope.';
    }

    if (expertise.length > 0) {
      guidance += ` Your expertise in ${expertise.join(', ')} is particularly relevant here.`;
    }

    contextElements.push({
      type: 'reviewer_guidance',
      title: 'Your Review Authority',
      content: guidance,
      details: { role, expertise, approvalHistory }
    });
  }

  return {
    enrichedRequest,
    contextElements,
    enrichmentMetadata: {
      sourcesUsed: Object.keys(enrichmentSources).filter(k => enrichmentSources[k]),
      totalElements: contextElements.length,
      enrichedAt: new Date().toISOString()
    }
  };
}

// Utility functions
function getFallbackRouting(approvalRequest) {
  return {
    selectedReviewers: [{
      userId: `compliance-admin@${approvalRequest.enterpriseId}`,
      role: 'compliance-admin',
      reason: 'Fallback routing for high-risk approval'
    }],
    confidence: 0.5
  };
}

function getDefaultSLA(riskLevel) {
  const defaultSLAs = {
    minimal: 168,
    low: 72,
    medium: 24,
    high: 8,
    critical: 2
  };
  return { totalHours: defaultSLAs[riskLevel] || 24 };
}

function evaluateCondition(condition, context) {
  // Simplified condition evaluation
  // In production, this would parse complex conditions
  return true; // Placeholder
}

function getJurisdictionRequirements(jurisdiction) {
  const requirements = {
    'FDA': ['Truthful advertising', 'Substantiated claims', 'Adverse event reporting'],
    'GDPR': ['Lawful processing', 'Data minimization', 'Individual rights'],
    'HIPAA': ['Privacy rule compliance', 'Security rule compliance', 'Breach notification'],
    'SOX': ['Internal controls', 'Financial reporting accuracy', 'Audit trail integrity']
  };
  return requirements[jurisdiction] || ['Standard compliance requirements'];
}

// Add names to tools for internal identification
routeApproval.name = 'routeApproval';
calculateSLA.name = 'calculateSLA';
orchestrateWorkflow.name = 'orchestrateWorkflow';
determineJurisdiction.name = 'determineJurisdiction';
enrichApprovalContext.name = 'enrichApprovalContext';

export const approvalsTools = [
  routeApproval,
  calculateSLA,
  orchestrateWorkflow,
  determineJurisdiction,
  enrichApprovalContext
];
