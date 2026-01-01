import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { CircuitBreaker, withResilience } from '../utils/resilience.js';
import { logger } from '../utils/logger.js';
import { TtlCache } from '../utils/cache.js';
import { createClient } from '@supabase/supabase-js';
import { 
  aicomplyrTools,
  fetchEffectivePolicySnapshot,
  evaluateRequest as evaluatePolicyRequest,
  generateProofBundle
} from './aicomplyr-tools.js';
import { 
  logAuditEvent,
  queryAuditTrail 
} from './audit-tools.js';
import {
  assessRiskProfile,
  calculateRiskScore
} from './risk-tools.js';
import { AuditAgentRuntime } from './audit-agent-runtime.js';
import { RiskAgentRuntime } from './risk-agent-runtime.js';
import { ToolRegistryAgentRuntime } from './tool-registry-agent-runtime.js';
import { IntakeAgentRuntime } from './intake-agent-runtime.js';
import { ApprovalsAgentRuntime } from './approvals-agent-runtime.js';
import { DecisionTokenService } from '../services/boundary/decision-token-service.js';
import { z } from 'zod';

/**
 * Policy Agent AI SDK Runtime
 *
 * This runtime integrates the existing PolicyAgent logic with Vercel AI SDK.
 * The AI SDK provides the "thinking" and "tool calling" loop, while AICOMPLYR
 * provides the governance decisions and cryptographic proof.
 *
 * Core principle: "AI SDK runs the agent. AICOMPLYR decides and proves."
 */

const PolicyAgentPrompt = `
You are the PolicyAgent, an AI-powered governance agent responsible for evaluating tool usage requests within an enterprise environment.

Your role is to:
1. Assess the risk and compliance implications of AI tool usage requests
2. Apply enterprise policy rules to determine appropriate actions
3. Ensure all decisions are auditable and provable
4. Escalate high-risk decisions for human review when necessary

IMPORTANT WORKFLOW:
1. FIRST: Always call fetchEffectivePolicySnapshot to get the current policy context
2. SECOND: Evaluate the request using evaluateRequest against the policy snapshot
3. THIRD: For high-risk decisions (Prohibited or RequiresReview), pause for human approval
4. FOURTH: Generate a proof bundle to cryptographically verify the final decision

You have access to three AICOMPLYR governance tools:
- fetchEffectivePolicySnapshot: Gets the immutable policy rules for the enterprise
- evaluateRequest: Evaluates a tool request against policy rules
- generateProofBundle: Creates tamper-evident proof of the decision

When making decisions, consider:
- Vendor reliability and compliance track record
- Data handling practices and privacy implications
- Intended use case and potential risks
- Enterprise risk tolerance and regulatory requirements
- Historical usage patterns and outcomes

Always provide clear reasoning for your decisions and recommend appropriate controls.
`;

/**
 * Policy Decision Schema for Agentic Loop
 */
const PolicyDecisionSchema = z.object({
  action: z.enum([
    'fetchEffectivePolicySnapshot',
    'evaluatePolicy',
    'generateProofBundle',
    'requestFormalApproval',
    'provideFinalDecision'
  ]),
  parameters: z.object({
    policySnapshotId: z.string().optional(),
    toolId: z.string().optional(),
    vendorId: z.string().optional(),
    useCase: z.string().optional(),
    dataHandling: z.string().optional(),
    reasoning: z.string().describe('Agent rationale for this action')
  })
});

/**
 * Policy Agent Runtime Class
 * Wraps the existing PolicyAgent logic in AI SDK execution
 */
export class PolicyAgentRuntime {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o';
    this.maxSteps = options.maxSteps || 10;
    this.onHumanApprovalNeeded = options.onHumanApprovalNeeded || this.defaultHumanApprovalHandler;
    this.onDecisionMade = options.onDecisionMade || (() => {});

    // Resilience components
    this.supabaseBreaker = new CircuitBreaker();
    this.openAIBreaker = new CircuitBreaker();
    this.retryOptions = {
      retries: 2,
      baseDelayMs: 200,
      timeoutMs: 10_000
    };

    // EPS cache (enterpriseId + scope)
    this.epsCache = new TtlCache(300_000, 500);
    
    // Initialize IntakeAgent, ToolRegistryAgent, AuditAgent, RiskAgent and ApprovalsAgent runtimes
    this.intakeAgent = options.intakeAgent || new IntakeAgentRuntime({
      onNormalizationComplete: options.onNormalizationComplete || (() => {}),
      onInputRejected: options.onInputRejected || (() => {}),
      onContextEnriched: options.onContextEnriched || (() => {})
    });
    this.toolRegistryAgent = options.toolRegistryAgent || new ToolRegistryAgentRuntime({
      onToolVerified: options.onToolVerified || (() => {}),
      onVerificationFailed: options.onVerificationFailed || (() => {})
    });
    this.auditAgent = options.auditAgent || new AuditAgentRuntime({
      onEventLogged: options.onAuditEventLogged || (() => {})
    });
    this.riskAgent = options.riskAgent || new RiskAgentRuntime({
      onRiskAssessed: options.onRiskAssessed || (() => {}),
      escalationThreshold: options.escalationThreshold || 80
    });
    this.approvalsAgent = options.approvalsAgent || new ApprovalsAgentRuntime({
      onApprovalRouted: options.onApprovalRouted || (() => {}),
      onSLABreached: options.onSLABreached || (() => {}),
      onWorkflowCompleted: options.onWorkflowCompleted || (() => {}),
      onEscalationTriggered: options.onEscalationTriggered || (() => {})
    });
  }

  /**
   * Execute a policy evaluation request using AI SDK
   */
  async evaluateRequest(requestData) {
    const {
      tool,
      vendor,
      usage,
      dataHandling,
      userId,
      enterpriseId,
      partnerId = null, // Optional: null means enterprise-run mode
      scopeId,
      urgencyLevel = 0.5,
      additionalContext = {},
      traceContext
    } = requestData;

    console.log(`[POLICY-AGENT-RUNTIME] Starting evaluation for tool: ${tool}, vendor: ${vendor}, user: ${userId}`);

    // Step 0: Verify tool identity and constraints (NEW - ToolRegistryAgent)
    let toolVerification = null;
    try {
      console.log(`[POLICY-AGENT-RUNTIME] Step 0: Verifying tool identity and constraints...`);
      toolVerification = await this.toolRegistryAgent.verifyTool(
        tool,
        vendor,
        requestData.version || 'latest',
        enterpriseId
      );

      if (!toolVerification.verified) {
        console.log(`[POLICY-AGENT-RUNTIME] Tool verification failed: ${toolVerification.violations.map(v => v.reason).join(', ')}`);
        
        // Log verification failure to audit agent
        try {
          await this.auditAgent.logDecision({
            agentType: 'tool-registry-agent',
            eventType: 'tool_verification_failed',
            decision: { verified: false },
            reasoning: `Tool verification failed: ${toolVerification.violations.map(v => v.reason).join(', ')}`,
            enterpriseId,
            traceContext: traceContext?.traceId,
            spanId: traceContext?.spanId
          });
        } catch (auditError) {
          // Ignore audit logging errors
        }

        return {
          success: false,
          error: 'Tool verification failed',
          violations: toolVerification.violations,
          toolVerification,
          request: requestData,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`[POLICY-AGENT-RUNTIME] Tool verified: ${toolVerification.toolId} (${toolVerification.toolMetadata.name})`);
    } catch (error) {
      console.error('[POLICY-AGENT-RUNTIME] Error in tool verification:', error);
      return {
        success: false,
        error: `Tool verification error: ${error.message}`,
        requestData,
        timestamp: new Date().toISOString()
      };
    }

    // Step 1: Assess risk profile BEFORE policy evaluation (now uses verified tool metadata)
    let riskAssessment = null;
    let escalationCheck = null;
    try {
      console.log(`[POLICY-AGENT-RUNTIME] Step 1: Assessing risk profile...`);
      const riskResult = await this.riskAgent.assessToolRisk(
        {
          name: toolVerification.toolMetadata.name,
          vendor: toolVerification.toolMetadata.provider,
          dataHandling: dataHandling,
          // Include verified metadata
          toolId: toolVerification.toolId,
          versionId: toolVerification.versionId,
          category: toolVerification.toolMetadata.category,
          riskTier: toolVerification.toolMetadata.risk_tier,
          deploymentStatus: toolVerification.toolMetadata.deployment_status
        },
        {
          name: vendor,
          vendor: vendor
        },
        {
          usage: usage,
          dataHandling: dataHandling,
          purpose: additionalContext.purpose || usage,
          industry: additionalContext.industry
        }
      );

      if (riskResult.success) {
        riskAssessment = riskResult.assessment;
        
        // Check if escalation is needed based on risk
        escalationCheck = await this.riskAgent.shouldEscalate(
          riskAssessment.riskProfile,
          riskAssessment.aggregateScore
        );

        // If critical risk, force human approval
        if (escalationCheck.shouldEscalate && escalationCheck.priority === 'critical') {
          console.log(`[POLICY-AGENT-RUNTIME] CRITICAL RISK DETECTED - Forcing human approval`);
          return {
            success: true,
            request: requestData,
            decision: {
              status: 'RequiresReview',
              reason: `Critical risk tier detected: ${riskAssessment.riskProfile}. ${escalationCheck.reason}`,
              confidence: 0.3
            },
            needsHumanApproval: true,
            riskAssessment,
            escalationCheck,
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('[POLICY-AGENT-RUNTIME] Error in risk assessment:', error);
      // Continue with policy evaluation even if risk assessment fails
    }

    // Step 2: Build evaluation prompt with risk context
    const riskContext = riskAssessment ? `
RISK ASSESSMENT CONTEXT:
- Risk Tier: ${riskAssessment.riskProfile.toUpperCase()}
- Aggregate Score: ${riskAssessment.aggregateScore}/100
- Risk Multiplier: ${riskAssessment.riskMultiplier}x
- Key Risk Factors: ${JSON.stringify(riskAssessment.dimensionScores, null, 2)}
- Recommended Controls: ${riskAssessment.recommendedControls.join(', ')}
- Escalation Required: ${escalationCheck?.shouldEscalate ? 'YES' : 'NO'}
` : '';

    const evaluationPrompt = `
${PolicyAgentPrompt}

REQUEST DETAILS:
- Tool: ${tool}
- Vendor: ${vendor}
- Usage: ${usage}
- Data Handling: ${dataHandling}
- User: ${userId}
- Enterprise: ${enterpriseId}
- Urgency Level: ${urgencyLevel}
- Additional Context: ${JSON.stringify(additionalContext, null, 2)}
${riskContext}

Please evaluate this request following the AICOMPLYR governance workflow.
${riskAssessment ? 'Consider the risk assessment above when making your decision.' : ''}
Start by fetching the effective policy snapshot, then evaluate the request, and finally generate proof.
`;

    try {
      // Initialize agentic loop context
      logger.info('Starting agentic policy evaluation loop', { traceId: requestData.traceContext?.traceId });
      
      const supabase = createClient(
        process.env.SUPABASE_URL || 'http://localhost:54321',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy_key'
      );

      const invoke = async (fnName, body, headers = {}) =>
        withResilience(
          () => supabase.functions.invoke(fnName, { body, headers }),
          {
            breaker: this.supabaseBreaker,
            retryOptions: this.retryOptions,
            onRetry: (err, attempt) => {
              logger.warn('Retrying Supabase call', { fnName, attempt, error: err.message, traceId: requestData.traceContext?.traceId });
            }
          }
        );

      let messages = [
        { role: 'system', content: PolicyAgentPrompt },
        { role: 'user', content: evaluationPrompt }
      ];
      
      let stepCount = 0;
      let policySnapshotData = null;
      let evaluationData = null;
      let proofData = null;
      let finalDecision = null;
      let agentReasoningChain = [];
      let toolCallsHistory = [];

      while (stepCount < this.maxSteps) {
        stepCount++;
        logger.info(`Agent loop step ${stepCount}/${this.maxSteps}`, { traceId: requestData.traceContext?.traceId });

        const { object: decision } = await withResilience(
          () => generateObject({
            model: openai(this.model),
            schema: PolicyDecisionSchema,
            messages
          }),
          {
            breaker: this.openAIBreaker,
            retryOptions: this.retryOptions,
            onRetry: (err, attempt) => logger.warn('Retrying generateObject', { attempt, error: err.message, traceId: requestData.traceContext?.traceId })
          }
        );

        logger.info(`Agent decided: ${decision.action}`, { reasoning: decision.parameters.reasoning });
        agentReasoningChain.push(decision.parameters.reasoning);

        if (decision.action === 'provideFinalDecision' || decision.action === 'requestFormalApproval') {
          finalDecision = decision;
          break;
        }

        let toolResult = null;
        try {
          switch (decision.action) {
            case 'fetchEffectivePolicySnapshot': {
              const epsCacheKey = `${enterpriseId || 'unknown'}::${requestData.scopeId || 'none'}`;
              policySnapshotData = this.epsCache.get(epsCacheKey);
              
              if (!policySnapshotData) {
                logger.info('Fetching EPS (cache miss)', { traceId: requestData.traceContext?.traceId, enterpriseId, scopeId: requestData.scopeId });
                const { data, error } = await invoke('generate-eps', {
                  policy_instance_id: enterpriseId,
                  scope_id: requestData.scopeId,
                  trigger_source: 'approval'
                });
                if (error) throw new Error(`Failed to fetch policy snapshot: ${error.message}`);
                policySnapshotData = data;
                if (policySnapshotData) this.epsCache.set(epsCacheKey, policySnapshotData);
              } else {
                logger.debug('Using cached EPS', { traceId: requestData.traceContext?.traceId });
              }
              toolResult = { success: true, policySnapshotId: policySnapshotData?.id || policySnapshotData?.eps_id };
              break;
            }

            case 'evaluatePolicy': {
              const snapshotId = decision.parameters.policySnapshotId || policySnapshotData?.id || policySnapshotData?.eps_id;
              if (!snapshotId) throw new Error('Policy snapshot ID is required for evaluation');
              
              logger.info('Evaluating request against policy', { traceId: requestData.traceContext?.traceId, snapshotId });
              const { data, error } = await invoke('policy-evaluate', {
                event: {
                  tool: { id: tool, name: tool, version: 'latest' },
                  actor: { role: 'user', id: userId },
                  action: { type: 'ToolUsage', note: usage },
                  context: { tenantId: enterpriseId, policySnapshotId: snapshotId },
                  ts: new Date().toISOString()
                }
              });
              if (error) throw new Error(`Failed to evaluate request: ${error.message}`);
              evaluationData = data;
              toolResult = { success: true, evaluation: evaluationData };
              break;
            }

            case 'generateProofBundle': {
              const snapshotId = decision.parameters.policySnapshotId || policySnapshotData?.id || policySnapshotData?.eps_id;
              if (!snapshotId) throw new Error('Policy snapshot ID is required for proof bundle');
              
              // We use evaluation result for proof if available
              const status = evaluationData?.status || 'RequiresReview';
              const reason = evaluationData?.reason || 'Policy evaluation completed';

              logger.info('Generating proof bundle', { traceId: requestData.traceContext?.traceId, snapshotId });
              const { data, error } = await invoke('generate-proof-bundle', {
                enterprise_id: enterpriseId,
                decision: {
                  status,
                  reason,
                  toolId: tool,
                  userId: userId,
                  evaluatedAt: new Date().toISOString()
                },
                policy_snapshot_id: snapshotId,
                trace_context: requestData.traceContext ? JSON.stringify(requestData.traceContext) : undefined,
                created_at: new Date().toISOString()
              }, requestData.traceContext?.traceId ? { traceparent: requestData.traceContext.traceId } : {});
              
              if (error) throw new Error(`Failed to generate proof bundle: ${error.message}`);
              proofData = data;
              toolResult = { success: true, proofBundleId: proofData?.id };
              break;
            }
          }
        } catch (toolError) {
          logger.error(`Error executing ${decision.action}`, { error: toolError.message });
          toolResult = { success: false, error: toolError.message };
        }

        toolCallsHistory.push({ tool: decision.action, success: toolResult.success, result: toolResult });
        messages.push({ role: 'assistant', content: `Executed ${decision.action}: ${JSON.stringify(toolResult)}` });
      }

      // Step 3: Finalize Decision
      const decision = evaluationData?.status 
        ? { 
            status: evaluationData.status, 
            reason: evaluationData.reason || 'Policy evaluation completed',
            confidence: evaluationData.confidence || 0.8
          }
        : {
            status: 'RequiresReview',
            reason: finalDecision?.parameters?.reasoning || 'Agent requested review or loop completed without clear decision',
            confidence: 0.5
          };

      const policySnapshotId = policySnapshotData?.id || policySnapshotData?.eps_id || `eps-${Date.now()}`;
      const policySnapshotDigest = policySnapshotData?.digest || policySnapshotData?.eps_digest;

      // Step 3c: Issue Decision Token for approved decisions (Boundary Governance)
      let decisionToken = null;
      if (decision.status === 'Approved' || decision.status === 'ApprovedWithControls') {
        try {
          logger.info('Issuing Decision Token for approved decision', { 
            traceId: requestData.traceContext?.traceId, 
            decision: decision.status,
            partnerId 
          });
          
          const dtService = new DecisionTokenService();
          decisionToken = await dtService.issueDecisionToken({
            enterpriseId,
            partnerId,
            epsId: policySnapshotId,
            epsDigest: policySnapshotDigest,
            toolRegistryId: toolVerification?.toolId || null,
            toolVersionId: toolVerification?.versionId || null,
            toolName: tool,
            toolVersion: toolVerification?.version || 'latest',
            vendorName: vendor,
            usageGrant: {
              purpose: usage,
              action_type: 'ToolUsage',
              data_handling: dataHandling,
              jurisdictions: riskAssessment?.jurisdictions || [],
              required_controls: riskAssessment?.recommendedControls || []
            },
            decision: {
              status: decision.status,
              reason: decision.reason,
              risk_score: riskAssessment?.aggregateScore || 0,
              requires_hil: escalationCheck?.shouldEscalate || false,
              approved_at: new Date().toISOString()
            },
            traceId: requestData.traceContext?.traceId
          });
          
          logger.info('Decision Token issued successfully', { dtId: decisionToken?.dt_id });
        } catch (dtError) {
          logger.warn('Decision Token issuance failed (graceful degradation)', { error: dtError.message });
        }
      }

      // Build final result
      const finalResult = {
        success: true,
        request: requestData,
        decision,
        needsHumanApproval: decision.status === 'Prohibited' || 
                           decision.status === 'RequiresReview' || 
                           decision.confidence < 0.8 ||
                           finalDecision?.action === 'requestFormalApproval',
        policySnapshot: policySnapshotData,
        evaluation: {
          success: true,
          decision,
          toolId: tool,
          vendorId: vendor,
          useCase: usage,
          dataHandling,
          userId,
          enterpriseId,
          evaluatedAt: new Date().toISOString()
        },
        proofBundle: proofData,
        agentReasoning: agentReasoningChain.join('\n\n'),
        toolCalls: toolCallsHistory,
        timestamp: new Date().toISOString(),
        decisionId: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        toolVerification,
        riskAssessment,
        escalationCheck,
        decisionToken,
        boundaryMode: partnerId ? 'partner-run' : 'enterprise-run'
      };

      // Step 6: Log decision to AuditAgent
      try {
        await this.auditAgent.logPolicyAgentDecision(
          {
            ...finalResult,
            toolVerification: {
              toolId: toolVerification.toolId,
              versionId: toolVerification.versionId,
              verified: toolVerification.verified
            }
          },
          requestData,
          traceContext || { traceId: `trace-${Date.now()}`, spanId: `span-${Date.now()}` }
        );
      } catch (auditError) {
        console.error('[POLICY-AGENT-RUNTIME] Error logging to audit agent:', auditError);
      }

      // Step 6: Notify about decision
      await this.onDecisionMade(finalResult);

      console.log(`[POLICY-AGENT-RUNTIME] Evaluation completed: ${finalResult.decision?.status || 'unknown'}`);
      return finalResult;

    } catch (error) {
      console.error('[POLICY-AGENT-RUNTIME] Error during evaluation:', error);
      
      // Log error to audit agent
      try {
        await this.auditAgent.logDecision({
          agentType: 'policy-agent',
          eventType: 'policy_evaluation_error',
          decision: { error: error.message },
          reasoning: 'Policy evaluation failed',
          enterpriseId: requestData.enterpriseId,
          traceContext: traceContext?.traceId
        });
      } catch (auditError) {
        // Ignore audit logging errors
      }

      return {
        success: false,
        error: error.message,
        requestData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse the agent result from AI SDK output
   */
  parseAgentResult(aiSdkResult, originalRequest) {
    const { text, toolResults } = aiSdkResult;

    // Extract decisions from tool calls
    const policySnapshot = toolResults.find(r => r.toolName === 'fetchEffectivePolicySnapshot')?.result;
    const evaluation = toolResults.find(r => r.toolName === 'evaluateRequest')?.result;
    const proofBundle = toolResults.find(r => r.toolName === 'generateProofBundle')?.result;

    // Determine final decision
    let decision = {
      status: 'RequiresReview', // Default to requiring review
      reason: 'Unable to determine decision automatically',
      confidence: 0.5
    };

    if (evaluation?.success && evaluation.decision) {
      decision = {
        status: evaluation.decision.status || 'RequiresReview',
        reason: evaluation.decision.reason || 'Policy evaluation completed',
        confidence: evaluation.decision.confidence || 0.8
      };
    }

    // Check if human approval is needed
    const needsHumanApproval = decision.status === 'Prohibited' ||
                              decision.status === 'RequiresReview' ||
                              decision.confidence < 0.8;

    return {
      success: true,
      request: originalRequest,
      decision,
      needsHumanApproval,
      policySnapshot: policySnapshot?.success ? policySnapshot.policySnapshot : null,
      evaluation: evaluation?.success ? evaluation : null,
      proofBundle: proofBundle?.success ? proofBundle.proofBundle : null,
      agentReasoning: text,
      toolCalls: toolResults.map(r => ({
        tool: r.toolName,
        success: r.result?.success || false,
        result: r.result
      })),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle intelligent approval orchestration for high-risk decisions
   */
  async requestHumanApproval(evaluationResult) {
    console.log(`[POLICY-AGENT-RUNTIME] Orchestrating intelligent approval for decision: ${evaluationResult.decision.status}`);

    try {
      // Step 6: Intelligent Approval Orchestration
      console.log(`[POLICY-AGENT-RUNTIME] Step 6: Orchestrating intelligent approval workflow...`);

      // Prepare approval request for ApprovalsAgent
      const approvalRequest = {
        id: evaluationResult.request?.id || `approval-${Date.now()}`,
        decision: evaluationResult.decision,
        requestContext: evaluationResult.request,
        enterpriseId: evaluationResult.request?.enterpriseId || evaluationResult.enterpriseId,
        riskLevel: evaluationResult.riskAssessment?.overallRisk || 'medium',
        jurisdiction: evaluationResult.jurisdiction || [],
        toolCategories: evaluationResult.request?.toolCategories || [],
        urgencyLevel: evaluationResult.riskAssessment?.urgencyScore || 0.5,
        priority: this.calculateApprovalPriority(evaluationResult),
        metadata: {
          toolVerification: evaluationResult.toolVerification,
          riskAssessment: evaluationResult.riskAssessment,
          policyEvaluation: evaluationResult.decision
        }
      };

      // Orchestrate approval with ApprovalsAgent
      const orchestrationResult = await this.approvalsAgent.orchestrateApproval(
        approvalRequest,
        {
          enterpriseId: approvalRequest.enterpriseId,
          availableReviewers: [], // Would be populated from user directory
          roleHierarchy: {}, // Would be populated from enterprise settings
          slaPolicies: {} // Would be populated from enterprise policies
        }
      );

      if (!orchestrationResult.success) {
        throw new Error(`Approval orchestration failed: ${orchestrationResult.error}`);
      }

      // For now, we'll use the basic HIL callback as a fallback while the approval workflow completes
      // In production, this would wait for the actual approval workflow to complete
      const approvalResult = await this.onHumanApprovalNeeded(evaluationResult);

      // If approved, generate proof bundle
      if (approvalResult.approved) {
        const proofResult = await this.generateFinalProofBundle(evaluationResult, approvalResult);
        return {
          ...evaluationResult,
          humanApproval: approvalResult,
          approvalOrchestration: orchestrationResult.orchestration,
          finalProofBundle: proofResult
        };
      }

      return {
        ...evaluationResult,
        humanApproval: approvalResult,
        approvalOrchestration: orchestrationResult.orchestration,
        finalDecision: {
          status: 'Prohibited',
          reason: approvalResult.reason || 'Rejected by human reviewer',
          approvedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[POLICY-AGENT-RUNTIME] Error in approval orchestration process:', error);
      return {
        ...evaluationResult,
        error: `Approval orchestration failed: ${error.message}`
      };
    }
  }

  /**
   * Generate final proof bundle after human approval
   */
  async generateFinalProofBundle(evaluationResult, approvalResult) {
    const { request } = evaluationResult;

    try {
      // Call the generateProofBundle tool directly
      const proofTool = aicomplyrTools.find(t => t.name === 'generateProofBundle');
      if (!proofTool) {
        throw new Error('generateProofBundle tool not found');
      }

      const proofResult = await proofTool.execute({
        enterpriseId: request.enterpriseId,
        decision: {
          status: 'Approved',
          reason: `Approved by human reviewer: ${approvalResult.reason || 'Approved'}`,
          toolId: request.tool,
          userId: request.userId,
          evaluatedAt: evaluationResult.timestamp
        },
        policySnapshotId: evaluationResult.policySnapshot?.id || 'unknown',
        traceContext: approvalResult.traceContext
      });

      return proofResult;
    } catch (error) {
      console.error('[POLICY-AGENT-RUNTIME] Error generating final proof bundle:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate approval priority based on evaluation result
   */
  calculateApprovalPriority(evaluationResult) {
    const { riskAssessment, decision } = evaluationResult;

    // Critical priority for critical risk or denied decisions
    if (riskAssessment?.overallRisk === 'critical' || decision?.status === 'denied') {
      return 'critical';
    }

    // High priority for high risk or conditional approvals
    if (riskAssessment?.overallRisk === 'high' || decision?.status === 'approved_with_conditions') {
      return 'high';
    }

    // Medium priority for medium risk
    if (riskAssessment?.overallRisk === 'medium') {
      return 'medium';
    }

    // Low priority for low/minimal risk approved decisions
    return 'low';
  }

  /**
   * Default human approval handler (logs and requires manual intervention)
   */
  async defaultHumanApprovalHandler(evaluationResult) {
    console.log('[POLICY-AGENT-RUNTIME] HUMAN APPROVAL REQUIRED:');
    console.log(`Decision: ${evaluationResult.decision.status}`);
    console.log(`Reason: ${evaluationResult.decision.reason}`);
    console.log(`Tool: ${evaluationResult.request.tool}`);
    console.log(`User: ${evaluationResult.request.userId}`);

    // In a real implementation, this would integrate with a UI or approval workflow
    // For now, we'll simulate approval for demonstration
    return {
      approved: true,
      approvedBy: 'system-admin',
      reason: 'Auto-approved for demonstration purposes',
      approvedAt: new Date().toISOString(),
      traceContext: `00-${Date.now()}-01`
    };
  }

  /**
   * Process a complete policy evaluation workflow
   */
  async processPolicyRequest(rawInput, inputType = 'unknown', context = {}) {
    console.log(`[POLICY-AGENT-RUNTIME] Processing ${inputType} input through governance workflow`);

    // Generate trace context for correlation
    const traceContext = {
      traceId: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spanId: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Step -1: Intake and Normalization (NEW - First gate)
    console.log(`[POLICY-AGENT-RUNTIME] Step -1: Intake and normalization`);
    const intakeResult = await this.intakeAgent.normalizeRequest(rawInput, inputType, {
      ...context,
      traceId: traceContext.traceId
    });

    if (!intakeResult.success) {
      console.error(`[POLICY-AGENT-RUNTIME] Intake normalization failed: ${intakeResult.error}`);

      // Start audit session for failed intake
      let auditSessionId = null;
      try {
        auditSessionId = await this.auditAgent.startAuditSession({
          userId: context.userId,
          enterpriseId: context.enterpriseId,
          userMessage: `Failed intake normalization: ${intakeResult.error}`,
          traceContext: traceContext.traceId
        });

        await this.auditAgent.logDecision({
          sessionId: auditSessionId,
          agentType: 'intake-agent',
          eventType: 'normalization_failed',
          decision: { status: 'rejected', reason: intakeResult.error },
          reasoning: `Input normalization failed: ${intakeResult.error}`,
          enterpriseId: context.enterpriseId,
          traceContext: traceContext.traceId,
          spanId: traceContext.spanId
        });
      } catch (auditError) {
        console.warn('[POLICY-AGENT-RUNTIME] Failed to audit intake failure:', auditError);
      }

      return {
        success: false,
        error: intakeResult.error,
        errors: intakeResult.errors,
        inputType,
        originalInput: rawInput,
        normalizedRequest: intakeResult.normalizedRequest,
        workflow: {
          steps: ['intake_failed'],
          completedAt: new Date().toISOString()
        },
        traceContext
      };
    }

    const normalizedRequest = intakeResult.normalizedRequest;
    console.log(`[POLICY-AGENT-RUNTIME] Successfully normalized to: ${normalizedRequest.tool} by ${normalizedRequest.vendor}`);

    // Start audit session with normalized data
    let auditSessionId = null;
    try {
      auditSessionId = await this.auditAgent.startAuditSession({
        userId: normalizedRequest.userId,
        enterpriseId: normalizedRequest.enterpriseId,
        userMessage: `Normalized policy evaluation request for ${normalizedRequest.tool}`,
        traceContext: traceContext.traceId
      });

      // Log intake normalization success
      await this.auditAgent.logDecision({
        sessionId: auditSessionId,
        agentType: 'intake-agent',
        eventType: 'normalization_complete',
        decision: { status: 'normalized', confidence: normalizedRequest.confidence },
        reasoning: `Successfully normalized ${inputType} input to policy request`,
        enterpriseId: normalizedRequest.enterpriseId,
        traceContext: traceContext.traceId,
        spanId: traceContext.spanId,
        beforeState: { inputType, rawInput },
        afterState: normalizedRequest
      });
    } catch (error) {
      console.warn('[POLICY-AGENT-RUNTIME] Failed to start audit session:', error);
    }

    // Step 0: Tool verification (handled in evaluateRequest)
    // Step 1: Risk assessment (handled in evaluateRequest)
    // Step 2: AI evaluation
    const evaluationResult = await this.evaluateRequest({
      ...normalizedRequest,
      traceContext,
      auditSessionId
    });

    // Step 3: Human approval if needed
    let finalResult = evaluationResult;
    if (evaluationResult.needsHumanApproval) {
      finalResult = await this.requestHumanApproval(evaluationResult);
      
      // Log human approval decision
      try {
        await this.auditAgent.logDecision({
          sessionId: auditSessionId,
          agentType: 'policy-agent',
          eventType: 'human_approval',
          decision: finalResult.humanApproval || finalResult.finalDecision,
          reasoning: finalResult.humanApproval?.reason || 'Human approval processed',
          enterpriseId: requestData.enterpriseId,
          traceContext: traceContext.traceId,
          spanId: traceContext.spanId
        });
      } catch (error) {
        console.warn('[POLICY-AGENT-RUNTIME] Failed to log human approval:', error);
      }
    }

    // Step 4: Complete audit session
    if (auditSessionId) {
      try {
        await this.auditAgent.completeAuditSession(auditSessionId, finalResult.decision);
      } catch (error) {
        console.warn('[POLICY-AGENT-RUNTIME] Failed to complete audit session:', error);
      }
    }

    // Step 7: Return complete result
    return {
      ...finalResult,
      intakeResult: {
        originalInput: rawInput,
        inputType,
        normalizedRequest,
        confidence: intakeResult.confidence,
        processingSteps: intakeResult.processingSteps
      },
      workflow: {
        steps: ['intake_normalization', 'tool_verification', 'risk_assessment', 'ai_evaluation', 'approval_orchestration', 'human_approval', 'audit_logging', 'proof_generation'],
        completedAt: new Date().toISOString()
      },
      traceContext
    };
  }
}

/**
 * Convenience function to create and run a policy evaluation
 */
export async function evaluatePolicyWithAI(requestData, options = {}) {
  const runtime = new PolicyAgentRuntime(options);
  return await runtime.processPolicyRequest(requestData);
}

export default PolicyAgentRuntime;
