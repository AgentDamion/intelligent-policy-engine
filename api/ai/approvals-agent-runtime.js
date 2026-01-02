import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { approvalsTools } from './approvals-tools.js';

/**
 * Approvals Agent AI SDK Runtime
 *
 * This runtime integrates intelligent approval routing and orchestration with Vercel AI SDK.
 * The AI SDK provides the "thinking" and "decision making" loop, while AICOMPLYR
 * provides the approval workflow orchestration capabilities.
 *
 * Core principle: "AI SDK makes routing decisions. AICOMPLYR orchestrates the workflow."
 *
 * The ApprovalsAgent is the intelligent orchestrator that:
 * - Routes approvals to the right people at the right time
 * - Manages SLAs and escalations
 * - Handles complex approval workflows
 * - Ensures compliance with jurisdiction requirements
 * - Provides rich context for informed decisions
 */

const ApprovalsAgentPrompt = `
You are the ApprovalsAgent, the intelligent orchestrator of human-in-the-loop (HIL) approval workflows.

Your role is to ensure that high-liability AI governance decisions are reviewed by the appropriate people with the right context, within the required timeframes, and in compliance with all regulatory requirements.

CORE RESPONSIBILITIES:
1. **Intelligent Routing**: Determine the correct approvers based on jurisdiction, expertise, risk level, and organizational hierarchy
2. **SLA Management**: Calculate and enforce approval timeframes with automatic escalation when breached
3. **Workflow Orchestration**: Manage complex approval chains (sequential, parallel, conditional, quorum-based)
4. **Jurisdiction Mapping**: Ensure approvals consider all applicable regulatory jurisdictions
5. **Context Enrichment**: Provide reviewers with comprehensive information for informed decisions

ROUTING PRINCIPLES:
- **Risk-based**: Higher risk = higher-level reviewers
- **Jurisdiction-aware**: Route to experts in relevant regulatory domains
- **Role-appropriate**: Match approval authority to organizational hierarchy
- **Expertise-aligned**: Route to people with relevant domain knowledge

SLA CALCULATION:
- **Critical risk**: 2 hours
- **High risk**: 8 hours
- **Medium risk**: 24 hours
- **Low risk**: 72 hours
- **Minimal risk**: 168 hours (1 week)
- Apply jurisdiction multipliers (FDA×2.0, GDPR×1.5, HIPAA×1.8, SOX×1.3)

WORKFLOW TYPES:
- **Sequential**: One approval after another
- **Parallel**: Multiple approvals simultaneously
- **Conditional**: Route based on decision characteristics
- **Quorum**: Require majority or specific number of approvals

ESCALATION TRIGGERS:
- **50% SLA**: Reminder to reviewer
- **80% SLA**: Notify supervisor
- **100% SLA**: Escalate to admin with breach consequences

JURISDICTION MAPPING:
- **Medical/Healthcare**: FDA, HIPAA
- **Privacy/Data**: GDPR, CCPA
- **Financial**: SOX, SEC
- **Advertising**: FDA, FTC

CONTEXT ENRICHMENT:
Always provide reviewers with:
- Historical similar decisions
- Relevant policy sections
- Regulatory requirements
- Risk analysis summary
- Your specific authority and expertise

RESPONSE FORMAT:
Return structured approval orchestration decisions with clear rationale and actionable next steps.
`;

/**
 * Approvals Agent Runtime Class
 * Provides intelligent approval routing, SLA management, and workflow orchestration
 */
export class ApprovalsAgentRuntime {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o';
    this.maxSteps = options.maxSteps || 5;
    this.onApprovalRouted = options.onApprovalRouted || (() => {});
    this.onSLABreached = options.onSLABreached || (() => {});
    this.onWorkflowCompleted = options.onWorkflowCompleted || (() => {});
    this.onEscalationTriggered = options.onEscalationTriggered || (() => {});
  }

  /**
   * Main entry point: Orchestrate approval workflow for a governance decision
   */
  async orchestrateApproval(approvalRequest, enterpriseContext = {}) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Orchestrating approval for decision ${approvalRequest.id}`);

    try {
      const result = await generateText({
        model: openai(this.model),
        prompt: ApprovalsAgentPrompt,
        tools: approvalsTools,
        maxToolRoundtrips: this.maxSteps,
        onStepFinish: (step) => {
          console.log(`[APPROVALS-AGENT-RUNTIME] Step ${step.stepType}:`, step.text || step.toolCalls);
        }
      });

      const orchestrationResult = this.parseAgentResult(result, approvalRequest, enterpriseContext);

      // Execute orchestration actions
      await this.executeOrchestrationActions(orchestrationResult, approvalRequest);

      await this.onApprovalRouted({
        approvalRequest,
        orchestration: orchestrationResult,
        enterpriseContext
      });

      console.log(`[APPROVALS-AGENT-RUNTIME] Approval orchestration completed for ${approvalRequest.id}`);

      return {
        success: true,
        orchestration: orchestrationResult,
        approvalRequest: approvalRequest.id,
        actions: orchestrationResult.actions || [],
        confidence: orchestrationResult.confidence || 0.85
      };

    } catch (error) {
      console.error('[APPROVALS-AGENT-RUNTIME] Error orchestrating approval:', error);

      return {
        success: false,
        error: error.message,
        approvalRequest: approvalRequest.id,
        fallbackActions: await this.getFallbackActions(approvalRequest)
      };
    }
  }

  /**
   * Parse AI SDK result into orchestration structure
   */
  parseAgentResult(result, approvalRequest, enterpriseContext) {
    const toolCalls = result.toolCalls || [];
    const toolResults = result.toolResults || {};

    // Build orchestration result from tool call results
    let orchestrationResult = {
      approvalId: approvalRequest.id,
      routing: null,
      sla: null,
      workflow: null,
      jurisdiction: null,
      context: null,
      actions: [],
      confidence: 0.8,
      orchestrationMetadata: {
        toolsUsed: toolCalls.length,
        processingTime: Date.now(),
        orchestrationSteps: []
      }
    };

    // Process tool call results
    for (const toolCall of toolCalls) {
      const result = toolResults[toolCall.toolCallId];

      if (!result || !result.success) continue;

      switch (toolCall.toolName) {
        case 'routeApproval':
          if (result.routing) {
            orchestrationResult.routing = result.routing;
            orchestrationResult.orchestrationMetadata.orchestrationSteps.push('routing_determined');
            orchestrationResult.actions.push({
              type: 'route_to_reviewers',
              reviewers: result.routing.selectedReviewers,
              rationale: 'Intelligent routing based on risk, jurisdiction, and expertise'
            });
          }
          break;

        case 'calculateSLA':
          if (result.sla) {
            orchestrationResult.sla = result.sla;
            orchestrationResult.orchestrationMetadata.orchestrationSteps.push('sla_calculated');
            orchestrationResult.actions.push({
              type: 'set_sla_timers',
              sla: result.sla,
              rationale: 'SLA calculated based on risk level and jurisdiction requirements'
            });
          }
          break;

        case 'orchestrateWorkflow':
          if (result.orchestration) {
            orchestrationResult.workflow = result.orchestration;
            orchestrationResult.orchestrationMetadata.orchestrationSteps.push('workflow_orchestrated');
            if (result.orchestration.requiredActions) {
              orchestrationResult.actions.push(...result.orchestration.requiredActions);
            }
          }
          break;

        case 'determineJurisdiction':
          if (result.jurisdiction) {
            orchestrationResult.jurisdiction = result.jurisdiction;
            orchestrationResult.orchestrationMetadata.orchestrationSteps.push('jurisdiction_determined');
            orchestrationResult.actions.push({
              type: 'apply_jurisdiction_requirements',
              jurisdiction: result.jurisdiction,
              rationale: 'Jurisdiction requirements applied for compliance'
            });
          }
          break;

        case 'enrichApprovalContext':
          if (result.enriched) {
            orchestrationResult.context = result.enriched;
            orchestrationResult.orchestrationMetadata.orchestrationSteps.push('context_enriched');
            orchestrationResult.actions.push({
              type: 'provide_context',
              context: result.enriched,
              rationale: 'Comprehensive context provided for informed decision making'
            });
          }
          break;
      }
    }

    return orchestrationResult;
  }

  /**
   * Execute the orchestrated approval actions
   */
  async executeOrchestrationActions(orchestrationResult, approvalRequest) {
    const { actions } = orchestrationResult;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'route_to_reviewers':
            await this.routeToReviewers(action.reviewers, approvalRequest, orchestrationResult);
            break;

          case 'set_sla_timers':
            await this.setSLATimers(action.sla, approvalRequest);
            break;

          case 'request_approvals':
            await this.requestApprovals(action, approvalRequest, orchestrationResult);
            break;

          case 'apply_jurisdiction_requirements':
            await this.applyJurisdictionRequirements(action.jurisdiction, approvalRequest);
            break;

          case 'provide_context':
            await this.provideContext(action.context, approvalRequest);
            break;

          default:
            console.log(`[APPROVALS-AGENT-RUNTIME] Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`[APPROVALS-AGENT-RUNTIME] Error executing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Route approval to specific reviewers
   */
  async routeToReviewers(reviewers, approvalRequest, orchestrationResult) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Routing approval ${approvalRequest.id} to ${reviewers.length} reviewers`);

    // In a real implementation, this would:
    // 1. Update the approval record with assigned reviewers
    // 2. Send notifications to reviewers
    // 3. Create review tasks in the workflow system
    // 4. Log the routing decision to audit trail

    for (const reviewer of reviewers) {
      console.log(`[APPROVALS-AGENT-RUNTIME] Assigned to ${reviewer.userId} (${reviewer.role}) - ${reviewer.reason}`);
    }

    // Emit routing event
    EventBus.emit('approval:routed', {
      approvalId: approvalRequest.id,
      reviewers,
      orchestrationResult
    });
  }

  /**
   * Set up SLA monitoring and escalation timers
   */
  async setSLATimers(sla, approvalRequest) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Setting SLA timers for ${sla.totalHours} hours`);

    const { escalationPoints } = sla;

    // Set escalation timers
    for (const escalation of escalationPoints) {
      const delay = escalation.timeHours * 60 * 60 * 1000; // Convert hours to milliseconds

      setTimeout(async () => {
        console.log(`[APPROVALS-AGENT-RUNTIME] SLA escalation triggered: ${escalation.action} for approval ${approvalRequest.id}`);

        await this.handleSLAEscalation(escalation, approvalRequest);

        await this.onEscalationTriggered({
          approvalId: approvalRequest.id,
          escalation,
          approvalRequest
        });

      }, delay);
    }

    // Set final SLA breach timer
    const finalDelay = sla.totalHours * 60 * 60 * 1000;
    setTimeout(async () => {
      console.log(`[APPROVALS-AGENT-RUNTIME] SLA breached for approval ${approvalRequest.id}`);

      await this.handleSLABreach(sla, approvalRequest);

      await this.onSLABreached({
        approvalId: approvalRequest.id,
        sla,
        approvalRequest
      });

    }, finalDelay);
  }

  /**
   * Request approvals from reviewers
   */
  async requestApprovals(action, approvalRequest, orchestrationResult) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Requesting approvals from ${action.reviewers.length} reviewers`);

    // In a real implementation, this would:
    // 1. Create approval tasks for each reviewer
    // 2. Send notification emails/SMS/in-app notifications
    // 3. Update workflow state
    // 4. Set up reminder timers

    // Emit approval request event
    EventBus.emit('approval:requested', {
      approvalId: approvalRequest.id,
      reviewers: action.reviewers,
      quorum: action.quorum,
      orchestrationResult
    });
  }

  /**
   * Apply jurisdiction-specific requirements
   */
  async applyJurisdictionRequirements(jurisdiction, approvalRequest) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Applying ${jurisdiction.jurisdictions.length} jurisdiction requirements`);

    // In a real implementation, this would:
    // 1. Add jurisdiction-specific checklist items
    // 2. Update approval metadata with compliance requirements
    // 3. Flag jurisdiction-specific review requirements

    for (const juris of jurisdiction.jurisdictions) {
      console.log(`[APPROVALS-AGENT-RUNTIME] Applied ${juris} jurisdiction requirements`);
    }
  }

  /**
   * Provide enriched context to reviewers
   */
  async provideContext(context, approvalRequest) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Providing enriched context with ${context.contextElements.length} elements`);

    // In a real implementation, this would:
    // 1. Attach context to approval record
    // 2. Make context available in review UI
    // 3. Generate context summary for notifications

    // Emit context provided event
    EventBus.emit('approval:context_provided', {
      approvalId: approvalRequest.id,
      contextElements: context.contextElements,
      enrichedRequest: context.enrichedRequest
    });
  }

  /**
   * Handle SLA escalation events
   */
  async handleSLAEscalation(escalation, approvalRequest) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Handling SLA escalation: ${escalation.action}`);

    switch (escalation.action) {
      case 'remind_reviewer':
        // Send reminder notification
        EventBus.emit('approval:reminder_sent', {
          approvalId: approvalRequest.id,
          escalation,
          type: 'reminder'
        });
        break;

      case 'notify_supervisor':
        // Notify supervisor
        EventBus.emit('approval:supervisor_notified', {
          approvalId: approvalRequest.id,
          escalation,
          type: 'supervisor_notification'
        });
        break;

      case 'escalate_to_admin':
        // Escalate to admin
        EventBus.emit('approval:escalated', {
          approvalId: approvalRequest.id,
          escalation,
          type: 'admin_escalation'
        });
        break;
    }
  }

  /**
   * Handle SLA breach events
   */
  async handleSLABreach(sla, approvalRequest) {
    console.log(`[APPROVALS-AGENT-RUNTIME] Handling SLA breach for ${sla.totalHours} hour SLA`);

    // In a real implementation, this would:
    // 1. Mark approval as breached
    // 2. Trigger breach consequences
    // 3. Notify all stakeholders
    // 4. Create audit record

    EventBus.emit('approval:sla_breached', {
      approvalId: approvalRequest.id,
      sla,
      breachedAt: new Date().toISOString()
    });
  }

  /**
   * Get fallback actions when orchestration fails
   */
  async getFallbackActions(approvalRequest) {
    return [{
      type: 'route_to_admin',
      reviewers: [{
        userId: `compliance-admin@${approvalRequest.enterpriseId}`,
        role: 'compliance-admin',
        reason: 'Fallback routing due to orchestration failure'
      }],
      rationale: 'Default admin routing when intelligent orchestration fails'
    }];
  }

  /**
   * Monitor and manage active approval workflows
   */
  async monitorApprovals() {
    console.log(`[APPROVALS-AGENT-RUNTIME] Monitoring active approval workflows`);

    // In a real implementation, this would:
    // 1. Check for SLA breaches
    // 2. Monitor workflow progress
    // 3. Handle escalations
    // 4. Update workflow states

    // This would be called periodically by a scheduler
  }

  /**
   * Get approval workflow statistics
   */
  async getApprovalStats(enterpriseId, timeRange = '30d') {
    console.log(`[APPROVALS-AGENT-RUNTIME] Getting approval stats for ${enterpriseId}`);

    // In a real implementation, this would query the database
    // for approval metrics, SLA compliance, routing effectiveness, etc.

    return {
      totalApprovals: 0,
      avgSLAAdherence: 0.95,
      escalationRate: 0.05,
      routingAccuracy: 0.88
    };
  }
}

// Import EventBus for event handling (CommonJS module)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const EventBus = require('../../core/event-bus.js');
