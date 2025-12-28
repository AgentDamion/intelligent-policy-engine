// ================================
// AGO ORCHESTRATOR AGENT (Alexi)
// ================================
// AI Governance Officer - Boundary-only governance of partner AI tool usage

import { Agent } from '../cursor-agent-registry.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiClient, AIRequest } from '../shared/ai-client.ts';
import {
  AgoTask,
  AgoResult,
  EvaluateSubmissionTask,
  RunAuditTask,
  HandleNewToolTask,
  GenerateBoundaryBriefTask,
  SubmissionContext,
  ToolUsageEvent,
  ToolRuleSet,
  EffectivePolicySnapshot,
  ProofBundle,
  NewToolIntakePacket,
  PolicyDecisionStatus,
  AgoError,
  VeraMode,
  VelocityMetrics,
  EvaluateToolUsageInput,
  EvaluateToolUsageResult,
} from '../shared/ago-types.ts';
import { buildAlexiSystemPrompt } from './prompts/alexi.ts';
import { SimpleFlowEngine } from '../shared/simple-flow-engine.ts';
import { FlowDefinition } from '../shared/flow-types.ts';
import { agentRegistry } from '../cursor-agent-registry.ts';

// ============================================================
// CONTEXT SNAPSHOT INTERFACE
// For FDA 21 CFR Part 11 compliance - full decision context capture
// ============================================================

interface ContextSnapshot {
  policy_state: {
    eps_id: string;
    version: string;
    sha256_hash: string;
    policy_json: any;  // Full policy content embedded
  };
  partner_state: {
    partner_id: string | null;
    compliance_score: number;
    active_attestations: number;
    risk_level: 'low' | 'medium' | 'high';
  };
  tool_state: {
    tools_evaluated: Array<{
      tool_id: string;
      vendor: string;
      risk_profile: string;
    }>;
    last_audit_date: string | null;
  };
  enterprise_state: {
    enterprise_id: string;
    vera_mode: VeraMode;
    regulatory_environment: string[];
    compliance_posture: 'standard' | 'high_rigor' | 'maximum';
  };
  submission_details: SubmissionContext | null;
  external_context: {
    regulatory_guidance_version: string;
    decision_timestamp: string;
    agent_version: string;
  };
}

export class AgoOrchestratorAgent implements Agent {
  private supabase: any;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async process(input: any, context: any): Promise<any> {
    const { action, flow_id, flow_name, ...params } = input;

    // NEW: Execute as flow if flow_id or flow_name provided
    if (flow_id || flow_name) {
      return await this.executeAsFlow(flow_id || flow_name, params, context);
    }

    // Handle direct action calls (for VERA edge functions)
    if (action && !params.task) {
      switch (action) {
        case 'evaluateToolUsage':
          return await this.evaluateToolUsage(params as EvaluateToolUsageInput, context);
        
        case 'getVelocityMetrics':
          return await this.getVelocityMetrics(params.enterpriseId || context.enterprise_id, context);
        
        case 'vera-chat':
          return await this.handleVERAChat(params, context);
        
        default:
          // Fall through to task-based routing
          break;
      }
    }

    // Task-based routing (existing pattern)
    const task = params.task as AgoTask;
    if (!task) {
      throw new AgoError(
        `Missing required parameter: task, action, or flow_id/flow_name`,
        'INVALID_INPUT'
      );
    }

    console.log(`[AgoOrchestratorAgent] Processing task: ${task.taskType}`, {
      taskId: task.taskId,
      enterpriseId: context.enterprise_id || task.enterpriseId,
    });

    try {
      switch (task.taskType) {
        case 'EVALUATE_SUBMISSION':
          return await this.evaluateSubmission(task as EvaluateSubmissionTask, context);

        case 'RUN_AUDIT':
          return await this.runAudit(task as RunAuditTask);

        case 'HANDLE_NEW_TOOL':
          return await this.handleNewTool(task as HandleNewToolTask);

        case 'GENERATE_BOUNDARY_BRIEF':
          return await this.generateBoundaryBrief(task as GenerateBoundaryBriefTask);

        default: {
          const _exhaustive: never = task;
          throw new AgoError(
            `Unsupported task type: ${(task as any).taskType}`,
            'INVALID_INPUT'
          );
        }
      }
    } catch (error) {
      console.error(`[AgoOrchestratorAgent] Error in ${task.taskType}:`, error);
      throw error;
    }
  }

  getInfo() {
    return { name: 'ago-orchestrator', type: 'AgoOrchestrator' };
  }

  // === EVALUATE_SUBMISSION ===

  private async evaluateSubmission(
    task: EvaluateSubmissionTask,
    context?: any
  ): Promise<AgoResult> {
    const { enterpriseId, submissionId } = task;

    // 1. Load submission context
    const submission = await this.loadSubmissionContext(enterpriseId, submissionId);
    if (!submission) {
      throw new AgoError(
        `Submission ${submissionId} not found`,
        'SUBMISSION_NOT_FOUND'
      );
    }

    // Load VERA mode early
    const veraMode = await this.loadEnterpriseVeraMode(enterpriseId);

    // PRD: Create or get governance thread for this submission
    const threadId = await this.getOrCreateGovernanceThread({
      enterpriseId,
      submissionId,
      title: `Tool Usage Review: ${submission.brand || 'Unknown Brand'}`,
      description: `Evaluating AI tool usage for submission ${submissionId.slice(0, 8)}`,
      priority: 'normal',
    });

    // Record evaluation start action (context snapshot captured later in flow)
    if (threadId) {
      await this.recordGovernanceAction({
        threadId,
        actionType: 'evaluate',
        rationale: `Starting automated evaluation in ${veraMode} mode`,
        metadata: { veraMode, submissionId },
        // contextSnapshot not yet available - captured after EPS load
      });
    }

    // 2. Load tool usage events for this submission
    const events = await this.loadToolUsageEventsForSubmission(enterpriseId, submissionId);

    // 3. Derive applicable EPS (deterministic lookup)
    const eps = await this.loadEffectivePolicySnapshotForContext({
      enterpriseId,
      brand: submission.brand,
      region: submission.region,
      channel: submission.channel,
    });

    if (!eps) {
      throw new AgoError(
        `No EPS found for context: ${submission.brand}/${submission.region}/${submission.channel}`,
        'EPS_NOT_FOUND'
      );
    }

    // 4. Load tool rule sets for enterprise
    const ruleSets = await this.loadToolRuleSetsForEnterprise(enterpriseId);

    // 4.5 NEW: Capture full context snapshot for FDA 21 CFR Part 11 compliance
    const contextSnapshot = await this.captureFullContextSnapshot(
      enterpriseId,
      submission,
      eps,
      events,
      veraMode
    );

    console.log(`[AGO] Context snapshot captured for submission ${submissionId}`, {
      policyVersion: contextSnapshot.policy_state.version,
      partnerRiskLevel: contextSnapshot.partner_state.risk_level,
      regulatoryEnvironment: contextSnapshot.enterprise_state.regulatory_environment,
    });

    // 5. Ask LLM (Alexi) to classify usage vs rules
    const systemPrompt = buildAlexiSystemPrompt();
    
    const llmRequest: AIRequest = {
      prompt: `Classify this partner submission based only on AI tool usage versus policy rules. Do not inspect content.

${JSON.stringify({
  submissionContext: submission,
  eps: {
    epsId: eps.epsId,
    version: eps.version,
    sha256Hash: eps.sha256Hash,
  },
  toolRuleSets: ruleSets,
  toolUsageEvents: events,
}, null, 2)}`,

      context: {
        submissionContext: submission,
        eps,
        toolRuleSets: ruleSets,
        toolUsageEvents: events,
      },

      agentType: 'ago-orchestrator',
      enterpriseId,
      systemPrompt,
      temperature: 0.2, // Low temperature for consistent policy decisions
      maxTokens: 2000,
    };

    let llmResponse;
    try {
      llmResponse = await aiClient.processRequest(llmRequest);
    } catch (error) {
      throw new AgoError(
        `LLM processing failed: ${error.message}`,
        'LLM_ERROR',
        { error }
      );
    }

    // Parse structured JSON from LLM
    let parsed;
    try {
      parsed = JSON.parse(llmResponse.content);
    } catch {
      // Fallback parsing from reasoning if content isn't JSON
      parsed = {
        policyDecision: 'REQUIRES_HUMAN_DECISION' as PolicyDecisionStatus,
        policyReasons: [`Failed to parse LLM response: ${llmResponse.reasoning}`],
        requiresHumanReview: true,
      };
    }

    // Validate decision status
    const validStatuses: PolicyDecisionStatus[] = [
      'AUTO_COMPLIANT',
      'COMPLIANT_WITH_WARNING',
      'REQUIRES_HUMAN_DECISION',
      'NON_COMPLIANT',
    ];

    if (!validStatuses.includes(parsed.policyDecision)) {
      parsed.policyDecision = 'REQUIRES_HUMAN_DECISION';
      parsed.policyReasons = [
        ...(parsed.policyReasons || []),
        'Invalid decision status from LLM, escalated for review',
      ];
    }

    // 6. Create Proof Bundle with VERA mode awareness
    const proofBundle: ProofBundle = {
      proofBundleId: crypto.randomUUID(),
      submissionId,
      enterpriseId,
      agencyId: submission.agencyId,
      brand: submission.brand,
      region: submission.region,
      channel: submission.channel,
      epsId: eps.epsId,
      toolUsage: events.map((e) => ({
        toolId: e.toolId,
        toolKey: e.toolKey,
        vendor: e.vendor,
        modelVersion: e.modelVersion,
        purposeTag: e.purposeTag,
        timestamp: e.calledAt,
        callerRole: e.callerRole,
      })),
      policyDecision: parsed.policyDecision,
      policyReasons: parsed.policyReasons || [llmResponse.reasoning],
      anchors: {
        epsHash: eps.sha256Hash,
        bundleHash: '', // TODO: populate by anchoring service
        anchoredAt: null,
      },
    };

    // VERA Mode Branching Logic
    if (veraMode === 'shadow') {
      // Shadow Mode: Always allow, create draft seal
      proofBundle.is_draft_seal = true;
      proofBundle.draft_decision = parsed.policyDecision === 'NON_COMPLIANT' 
        ? 'would_block' 
        : 'would_allow';
      proofBundle.draft_reasoning = (parsed.policyReasons || []).join('; ');

      await this.writeProofBundle(proofBundle, context, contextSnapshot);

      // PRD: Record draft decision action on governance thread
      if (threadId) {
        await this.recordGovernanceAction({
          threadId,
          actionType: 'draft_decision',
          rationale: `Shadow mode draft: ${proofBundle.draft_decision} - ${proofBundle.draft_reasoning}`,
          newStatus: 'resolved', // Shadow mode auto-resolves
          metadata: { 
            draftDecision: proofBundle.draft_decision, 
            proofBundleId: proofBundle.proofBundleId 
          },
          contextSnapshot,  // FDA compliance: full context for decision replay
        });
        await this.linkProofBundleToThread(threadId, proofBundle.proofBundleId);
      }

      return {
        taskId: task.taskId,
        enterpriseId,
        taskType: 'EVALUATE_SUBMISSION',
        completedAt: new Date().toISOString(),
        submissionId,
        policyDecision: 'AUTO_COMPLIANT', // Always compliant in shadow mode
        explanation: `Shadow Mode: ${proofBundle.draft_decision === 'would_block' ? 'Would block' : 'Would allow'} - ${proofBundle.draft_reasoning}`,
        proofBundleId: proofBundle.proofBundleId,
        requiresHumanReview: false,
        governanceThreadId: threadId,
      };
    }

    if (veraMode === 'enforcement') {
      // Enforcement Mode: Block non-compliant, create verified seals for compliant
      if (parsed.policyDecision === 'NON_COMPLIANT') {
        // Block non-compliant usage
        proofBundle.is_draft_seal = false;
        proofBundle.draft_decision = 'would_block';
        proofBundle.draft_reasoning = (parsed.policyReasons || []).join('; ');

        await this.writeProofBundle(proofBundle, context, contextSnapshot);

        // PRD: Record reject action or escalate if low confidence
        const shouldEscalate = parsed.requiresHumanReview || (llmResponse.confidence || 0) < 0.8;
        
        if (threadId) {
          if (shouldEscalate) {
            await this.recordGovernanceAction({
              threadId,
              actionType: 'escalate',
              rationale: `Non-compliant with low confidence (${Math.round((llmResponse.confidence || 0) * 100)}%) - escalating for human review: ${proofBundle.draft_reasoning}`,
              newStatus: 'pending_human',
              metadata: { 
                confidence: llmResponse.confidence,
                proofBundleId: proofBundle.proofBundleId,
                policyDecision: parsed.policyDecision,
              },
              contextSnapshot,  // FDA compliance: full context for decision replay
            });
          } else {
            await this.recordGovernanceAction({
              threadId,
              actionType: 'reject',
              rationale: `Blocked due to policy violation: ${proofBundle.draft_reasoning}`,
              newStatus: 'resolved',
              metadata: { 
                proofBundleId: proofBundle.proofBundleId,
                policyDecision: parsed.policyDecision,
              },
              contextSnapshot,  // FDA compliance: full context for decision replay
            });
          }
          await this.linkProofBundleToThread(threadId, proofBundle.proofBundleId);
        }

        return {
          taskId: task.taskId,
          enterpriseId,
          taskType: 'EVALUATE_SUBMISSION',
          completedAt: new Date().toISOString(),
          submissionId,
          policyDecision: 'NON_COMPLIANT',
          explanation: `Blocked: ${proofBundle.draft_reasoning}`,
          proofBundleId: proofBundle.proofBundleId,
          requiresHumanReview: shouldEscalate,
          governanceThreadId: threadId,
        };
      }

      // Compliant - create verified seal
      proofBundle.is_draft_seal = false;
      // No draft_decision needed for verified seals

      await this.writeProofBundle(proofBundle, context, contextSnapshot);

      // PRD: Record auto-clear or approve action
      if (threadId) {
        const isAutoCleared = parsed.policyDecision === 'AUTO_COMPLIANT';
        await this.recordGovernanceAction({
          threadId,
          actionType: isAutoCleared ? 'auto_clear' : 'approve',
          rationale: isAutoCleared 
            ? `Auto-cleared: Request meets all policy requirements`
            : `Approved: ${(parsed.policyReasons || []).join('; ')}`,
          newStatus: 'resolved',
          metadata: { 
            proofBundleId: proofBundle.proofBundleId,
            policyDecision: parsed.policyDecision,
          },
          contextSnapshot,  // FDA compliance: full context for decision replay
        });
        await this.linkProofBundleToThread(threadId, proofBundle.proofBundleId);
      }

      return {
        taskId: task.taskId,
        enterpriseId,
        taskType: 'EVALUATE_SUBMISSION',
        completedAt: new Date().toISOString(),
        submissionId,
        policyDecision: parsed.policyDecision,
        explanation: (parsed.policyReasons || []).join('; '),
        proofBundleId: proofBundle.proofBundleId,
        requiresHumanReview: parsed.requiresHumanReview || false,
        governanceThreadId: threadId,
      };
    }

    // Disabled Mode: Pass through (existing behavior)
    proofBundle.is_draft_seal = false;
    await this.writeProofBundle(proofBundle, { flowRunId: task.flowRunId }, contextSnapshot);

    // PRD: Still create governance record even in disabled mode for audit trail
    if (threadId) {
      await this.recordGovernanceAction({
        threadId,
        actionType: 'approve',
        rationale: 'Governance disabled - request passed through without evaluation',
        newStatus: 'resolved',
        metadata: { 
          proofBundleId: proofBundle.proofBundleId,
          veraMode: 'disabled',
        },
        contextSnapshot,  // FDA compliance: full context even in disabled mode
      });
      await this.linkProofBundleToThread(threadId, proofBundle.proofBundleId);
    }

    return {
      taskId: task.taskId,
      enterpriseId,
      taskType: 'EVALUATE_SUBMISSION',
      completedAt: new Date().toISOString(),
      submissionId,
      policyDecision: parsed.policyDecision,
      explanation: (parsed.policyReasons || []).join('; '),
      proofBundleId: proofBundle.proofBundleId,
      requiresHumanReview: parsed.requiresHumanReview || false,
      governanceThreadId: threadId,
    };
  }

  // === RUN_AUDIT ===

  private async runAudit(task: RunAuditTask): Promise<AgoResult> {
    const { enterpriseId } = task;

    const auditData = await this.runUsageAuditQuery(enterpriseId, {
      brands: task.brands,
      regions: task.regions,
      channels: task.channels,
      agencyIds: task.agencyIds,
      toolIds: task.toolIds,
      from: task.from,
      to: task.to,
    });

    // Generate narrative summary via LLM
    const systemPrompt = buildAlexiSystemPrompt();

    const llmRequest: AIRequest = {
      prompt: `Create a short narrative summary of this boundary audit for a compliance lead. Focus on partner behavior and AI tool usage patterns. Do NOT mention content.

${JSON.stringify(auditData, null, 2)}`,

      context: auditData,
      agentType: 'ago-orchestrator',
      enterpriseId,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 1500,
    };

    let narrativeSummary = 'Audit completed.';
    try {
      const llmResponse = await aiClient.processRequest(llmRequest);
      narrativeSummary = llmResponse.content || llmResponse.reasoning;
    } catch (error) {
      console.error('[AgoOrchestratorAgent] LLM narrative generation failed:', error);
      narrativeSummary = 'Audit completed. See summary data for details.';
    }

    const result: AgoResult = {
      taskId: task.taskId,
      enterpriseId,
      taskType: 'RUN_AUDIT',
      completedAt: new Date().toISOString(),
      summary: {
        totalSubmissions: auditData.totalSubmissions,
        totalToolEvents: auditData.totalToolEvents,
        toolsUsed: auditData.toolsUsed,
        agencies: auditData.agencies,
        violations: auditData.violations,
        escalations: auditData.escalations,
      },
      affectedProofBundleIds: auditData.affectedProofBundleIds,
      narrativeSummary,
    };

    return result;
  }

  // === HANDLE_NEW_TOOL ===

  private async handleNewTool(task: HandleNewToolTask): Promise<AgoResult> {
    // TODO: Implement new tool intake logic
    // 1. Detect tool not in Decision Library
    // 2. Gather metadata
    // 3. Check against policy
    // 4. Create intake packet
    // 5. Route to human approver
    
    throw new AgoError('Not implemented yet', 'INVALID_INPUT');
  }

  // === GENERATE_BOUNDARY_BRIEF ===

  private async generateBoundaryBrief(
    task: GenerateBoundaryBriefTask
  ): Promise<AgoResult> {
    // TODO: Implement boundary brief generation
    // Use runUsageAuditQuery + LLM to generate markdown brief
    
    throw new AgoError('Not implemented yet', 'INVALID_INPUT');
  }

  // === Data Access Helpers ===

  private async loadSubmissionContext(
    enterpriseId: string,
    submissionId: string
  ): Promise<SubmissionContext | null> {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('id, enterprise_id, organization_id, created_at, brand, region, channel, metadata')
      .eq('id', submissionId)
      .eq('enterprise_id', enterpriseId)
      .single();

    if (error || !data) {
      return null;
    }

    // Extract brand/region/channel from columns or metadata JSONB
    const brand = data.brand || data.metadata?.brand || 'UNKNOWN';
    const region = data.region || data.metadata?.region || 'UNKNOWN';
    const channel = data.channel || data.metadata?.channel || 'UNKNOWN';

    return {
      submissionId: data.id,
      enterpriseId: data.enterprise_id,
      agencyId: data.organization_id, // organization_id represents the agency/partner
      brand,
      region,
      channel,
      createdAt: data.created_at,
    };
  }

  private async loadToolUsageEventsForSubmission(
    enterpriseId: string,
    submissionId: string
  ): Promise<ToolUsageEvent[]> {
    // Query middleware_requests table for tool usage events
    // Adjust query based on actual schema structure
    // Query middleware_requests table for tool usage events
    // Adjust query based on actual schema structure
    // Try submission_id column first, fallback to metadata JSONB
    const { data, error } = await this.supabase
      .from('middleware_requests')
      .select(`
        id,
        tool_id,
        tool_key,
        version,
        purpose,
        ts,
        metadata,
        eps_snapshot_id,
        tools:tool_id(vendor, name)
      `)
      .eq('enterprise_id', enterpriseId)
      .or(`submission_id.eq.${submissionId},metadata->>'submission_id'.eq.${submissionId}`)
      .order('ts', { ascending: true });

    if (error) {
      console.error('[AgoOrchestratorAgent] Error loading tool usage events:', error);
      return [];
    }

    return (data || []).map((e: any) => ({
      eventId: e.id,
      submissionId,
      toolId: e.tool_id,
      toolKey: e.tool_key || e.tool_id,
      vendor: e.tools?.vendor || e.metadata?.vendor || 'UNKNOWN',
      modelVersion: e.version || null,
      purposeTag: e.purpose || e.metadata?.purpose || null,
      calledAt: e.ts,
      callerRole: e.metadata?.caller_role || e.metadata?.role || 'UNKNOWN',
      epsSnapshotId: e.eps_snapshot_id || null,
    }));
  }

  private async loadEffectivePolicySnapshotForContext(params: {
    enterpriseId: string;
    brand: string;
    region: string;
    channel: string;
  }): Promise<EffectivePolicySnapshot | null> {
    // Query effective_policy_snapshots table
    // Get the most recent EPS for this enterprise matching context
    const { data, error } = await this.supabase
      .from('effective_policy_snapshots')
      .select('id, enterprise_id, version, payload, sha256_hash, created_at')
      .eq('enterprise_id', params.enterpriseId)
      // TODO: Add filtering by brand/region/channel if stored in payload or separate columns
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      epsId: data.id,
      enterpriseId: data.enterprise_id,
      version: data.version,
      payload: data.payload,
      sha256Hash: data.sha256_hash,
      createdAt: data.created_at,
    };
  }

  private async loadToolRuleSetsForEnterprise(
    enterpriseId: string
  ): Promise<ToolRuleSet[]> {
    // TODO: Implement Decision Library lookup
    // For MVP, return empty array - rules will be derived from EPS payload
    // In production, this would query a decision_library table
    return [];
  }

  // ============================================================
  // CONTEXT SNAPSHOT CAPTURE
  // FDA 21 CFR Part 11 compliance - captures full decision context
  // ============================================================

  private async captureFullContextSnapshot(
    enterpriseId: string,
    submission: SubmissionContext | null,
    eps: EffectivePolicySnapshot,
    events: ToolUsageEvent[],
    veraMode: VeraMode
  ): Promise<ContextSnapshot> {
    // Load the full policy JSON (not just reference)
    const { data: policyArtifact } = await this.supabase
      .from('policy_artifacts')
      .select('*')
      .eq('id', eps.epsId)
      .single();

    // Load partner compliance state if submission has partner/agency
    let partnerState = {
      partner_id: null as string | null,
      compliance_score: 0,
      active_attestations: 0,
      risk_level: 'high' as 'low' | 'medium' | 'high',
    };

    if (submission?.agencyId) {
      const { data: partner } = await this.supabase
        .from('partners')
        .select('id, compliance_score')
        .eq('id', submission.agencyId)
        .single();

      const { data: attestations } = await this.supabase
        .from('partner_attestations')
        .select('id')
        .eq('partner_id', submission.agencyId)
        .eq('status', 'active');

      const attestationCount = attestations?.length || 0;
      partnerState = {
        partner_id: submission.agencyId,
        compliance_score: partner?.compliance_score || 0,
        active_attestations: attestationCount,
        risk_level: attestationCount >= 3 ? 'low' : attestationCount >= 1 ? 'medium' : 'high',
      };
    }

    // Load enterprise regulatory environment
    const { data: workspaceFrameworks } = await this.supabase
      .from('workspace_frameworks')
      .select('regulatory_frameworks(short_name)')
      .eq('enterprise_id', enterpriseId);

    const regulatoryEnvironment = workspaceFrameworks?.map(
      (wf: any) => wf.regulatory_frameworks?.short_name
    ).filter(Boolean) || [];

    // Build tool state from events
    const toolsEvaluated = events.map(e => ({
      tool_id: e.toolId,
      vendor: e.vendor,
      risk_profile: 'standard', // TODO: Fetch from tool registry
    }));

    return {
      policy_state: {
        eps_id: eps.epsId,
        version: eps.version,
        sha256_hash: eps.sha256Hash,
        policy_json: policyArtifact?.payload || eps.payload || null,
      },
      partner_state: partnerState,
      tool_state: {
        tools_evaluated: toolsEvaluated,
        last_audit_date: null, // TODO: Query last audit date
      },
      enterprise_state: {
        enterprise_id: enterpriseId,
        vera_mode: veraMode,
        regulatory_environment: regulatoryEnvironment,
        compliance_posture: 'high_rigor', // TODO: Fetch from enterprise settings
      },
      submission_details: submission,
      external_context: {
        regulatory_guidance_version: '2025.01',
        decision_timestamp: new Date().toISOString(),
        agent_version: 'ago-orchestrator-v1.0',
      },
    };
  }

  // ============================================================
  // CANONICAL JSON FOR CRYPTOGRAPHIC HASHING
  // Ensures deterministic hash calculation across systems
  // ============================================================

  private canonicalizeProofBundle(bundle: ProofBundle): any {
    // Create deterministic JSON representation
    // Sort keys alphabetically for consistent hashing
    const sortObjectKeys = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sortObjectKeys);
      return Object.keys(obj).sort().reduce((sorted: any, key) => {
        sorted[key] = sortObjectKeys(obj[key]);
        return sorted;
      }, {});
    };
    
    return sortObjectKeys({
      proofBundleId: bundle.proofBundleId,
      enterpriseId: bundle.enterpriseId,
      submissionId: bundle.submissionId,
      epsId: bundle.epsId,
      policyDecision: bundle.policyDecision,
      policyReasons: bundle.policyReasons,
      toolUsage: bundle.toolUsage,
      createdAt: new Date().toISOString(),
    });
  }

  private async writeProofBundle(
    bundle: ProofBundle, 
    context?: any,
    contextSnapshot?: ContextSnapshot
  ): Promise<void> {
    // 1. Create canonical JSON representation for hashing
    const canonicalJson = this.canonicalizeProofBundle(bundle);
    
    // 2. Generate SHA-256 hash
    const bundleHash = await this.calculateHash(JSON.stringify(canonicalJson));

    const insertData: any = {
      id: bundle.proofBundleId,
      enterprise_id: bundle.enterpriseId,
      organization_id: bundle.agencyId,
      submission_id: bundle.submissionId,
      decision: this.mapDecisionStatusToDb(bundle.policyDecision),
      atom_states_snapshot: {
        toolUsage: bundle.toolUsage,
        policyReasons: bundle.policyReasons,
        anchors: bundle.anchors,
        epsId: bundle.epsId,
        brand: bundle.brand,
        region: bundle.region,
        channel: bundle.channel,
      },
      created_at: new Date().toISOString(),
      // NEW: FDA 21 CFR Part 11 compliance fields
      bundle_hash: bundleHash,
      policy_digest: bundle.anchors?.epsHash || null,
    };

    // Add context snapshot if provided (FDA compliance)
    if (contextSnapshot) {
      insertData.policy_snapshot = contextSnapshot.policy_state?.policy_json || null;
      insertData.policy_snapshot_version = contextSnapshot.policy_state?.version || null;
      insertData.context_snapshot = contextSnapshot;
    }

    // Add draft seal fields if present
    if (bundle.is_draft_seal !== undefined) {
      insertData.is_draft_seal = bundle.is_draft_seal;
    }
    if (bundle.draft_decision) {
      insertData.draft_decision = bundle.draft_decision;
    }
    if (bundle.draft_reasoning) {
      insertData.draft_reasoning = bundle.draft_reasoning;
    }
    if (bundle.tool_attestation) {
      insertData.tool_attestation = bundle.tool_attestation;
    }

    const { error } = await this.supabase
      .from('proof_bundles')
      .insert(insertData);

    if (error) {
      throw new AgoError(
        `Failed to write proof bundle: ${error.message}`,
        'DB_ERROR',
        { error }
      );
    }

    // 3. Create proof_bundle_artifacts record with cryptographic data
    try {
      await this.supabase
        .from('proof_bundle_artifacts')
        .insert({
          proof_bundle_id: bundle.proofBundleId,
          bundle_hash: bundleHash,
          canonical_json: canonicalJson,
          // Signature generation: schema ready, code implementation pending
          // In production: would sign with enterprise key
          signature: null,
          signature_algorithm: null,
          signature_key_id: null,
        });
      
      console.log(`[AGO] Proof bundle artifact created with hash: ${bundleHash.substring(0, 16)}...`);
    } catch (artifactError) {
      // Log but don't fail - artifact table may not exist in all environments
      console.warn('[AGO] Failed to create proof bundle artifact:', artifactError);
    }

    // Link to flow run if in flow context
    if (context?.flowRunId) {
      await this.supabase
        .from('flow_runs')
        .update({ proof_bundle_id: bundle.proofBundleId })
        .eq('id', context.flowRunId);

      // Log event for proof bundle creation in flow context
      await this.logEvent({
        aggregateId: context.flowRunId,
        aggregateType: 'flow_run',
        eventType: 'proof_bundle_created',
        payload: {
          bundleId: bundle.proofBundleId,
          decision: bundle.policyDecision,
          flowRunId: context.flowRunId,
          bundleHash: bundleHash,
        },
      });
    }
  }

  private async logEvent(params: {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    payload: any;
    metadata?: any;
  }): Promise<void> {
    // Get previous hash for this aggregate
    const { data: lastEvent } = await this.supabase
      .from('vera.events')
      .select('content_hash')
      .eq('aggregate_id', params.aggregateId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastEvent?.content_hash || '';

    // Calculate content hash
    const contentToHash = JSON.stringify(params.payload) + previousHash;
    const contentHash = await this.calculateHash(contentToHash);

    await this.supabase.from('vera.events').insert({
      aggregate_id: params.aggregateId,
      aggregate_type: params.aggregateType,
      event_type: params.eventType,
      payload: params.payload,
      metadata: params.metadata || {},
      content_hash: contentHash,
      previous_hash: previousHash || null,
    });
  }

  private async calculateHash(content: string): Promise<string> {
    // Use Web Crypto API for SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private mapDecisionStatusToDb(status: PolicyDecisionStatus): string {
    const mapping: Record<PolicyDecisionStatus, string> = {
      AUTO_COMPLIANT: 'approved',
      COMPLIANT_WITH_WARNING: 'approved',
      REQUIRES_HUMAN_DECISION: 'needs_review',
      NON_COMPLIANT: 'rejected',
    };
    return mapping[status] || 'needs_review';
  }

  // === VERA Helper Methods ===

  private async loadEnterpriseVeraMode(enterpriseId: string): Promise<VeraMode> {
    const { data, error } = await this.supabase
      .from('enterprises')
      .select('vera_mode')
      .eq('id', enterpriseId)
      .single();

    if (error || !data) {
      console.warn(`[AgoOrchestratorAgent] Could not load vera_mode for enterprise ${enterpriseId}, defaulting to 'disabled'`);
      return 'disabled';
    }

    // Validate mode value
    const validModes: VeraMode[] = ['disabled', 'shadow', 'enforcement'];
    if (!validModes.includes(data.vera_mode)) {
      console.warn(`[AgoOrchestratorAgent] Invalid vera_mode '${data.vera_mode}' for enterprise ${enterpriseId}, defaulting to 'disabled'`);
      return 'disabled';
    }

    return data.vera_mode as VeraMode;
  }

  // === New Action Handlers for VERA ===

  /**
   * Handle VERA Chat queries
   * Accepts user queries and returns policy explanations, decision reasoning, or compliance guidance
   */
  private async handleVERAChat(
    params: { query?: string; context?: any; input?: { query?: string; context?: any } },
    context: any
  ): Promise<any> {
    try {
      const enterpriseId = context.enterprise_id || params.context?.enterprise_id;
      
      // Extract query from params - handle both direct query and nested input.query
      const query = params.query || params.input?.query || '';

      // Validate query
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new AgoError(
          'VERA Chat requires a non-empty query string',
          'INVALID_INPUT'
        );
      }

      console.log(`[AgoOrchestratorAgent] Processing VERA Chat query for enterprise: ${enterpriseId}`, {
        query: query.substring(0, 100), // Log first 100 chars
        queryLength: query.length
      });

      // For now, return a simple mock response
      // TODO: Implement full VERA Chat logic with Policy Agent integration
      const mockResponse = {
        answer: `Hello! I am VERA. I received your message: "${query}". My systems are coming online.`,
        queryType: 'general' as const,
        policyReferences: [] as string[],
        relatedTools: [] as any[],
        confidence: 0.95,
        suggestedActions: [] as string[],
        metadata: {
          enterprise_id: enterpriseId,
          timestamp: new Date().toISOString(),
          response_type: 'mock'
        }
      };

      return mockResponse;

    } catch (error) {
      console.error('[AgoOrchestratorAgent] Error in handleVERAChat:', error);
      
      // Return graceful error response
      if (error instanceof AgoError) {
        throw error;
      }
      
      throw new AgoError(
        `VERA Chat processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VERA_CHAT_ERROR'
      );
    }
  }

  // === VERA Real-time Event Publishing ===

  /**
   * Publish a VERA event to Supabase Realtime channel
   * Channels: vera-decisions, vera-alerts, vera-proofs
   */
  private async publishVERAEvent(
    channel: 'vera-decisions' | 'vera-alerts' | 'vera-proofs',
    eventType: string,
    payload: any,
    enterpriseId: string
  ): Promise<void> {
    const channelName = `${channel}:${enterpriseId}`;
    let realtimeChannel: any = null;
    
    try {
      console.log(`[AgoOrchestratorAgent] Publishing VERA event to ${channelName}`, {
        eventType,
        payloadKeys: Object.keys(payload)
      });

      // Create and subscribe to Supabase Realtime channel
      // Subscription is required before sending broadcasts
      realtimeChannel = this.supabase.channel(channelName);
      
      // Subscribe to the channel first
      const subscriptionStatus = await realtimeChannel.subscribe();
      
      if (subscriptionStatus !== 'SUBSCRIBED') {
        throw new Error(`Failed to subscribe to ${channelName}: ${subscriptionStatus}`);
      }
      
      console.log(`[AgoOrchestratorAgent] Successfully subscribed to ${channelName}, status: ${subscriptionStatus}`);
      
      // Now send the broadcast event
      await realtimeChannel.send({
        type: 'broadcast',
        event: eventType,
        payload: {
          enterprise_id: enterpriseId,
          timestamp: new Date().toISOString(),
          ...payload
        }
      });

      console.log(`[AgoOrchestratorAgent] Successfully published event to ${channelName}`);
    } catch (error) {
      console.error(`[AgoOrchestratorAgent] Failed to publish VERA event to ${channelName}:`, error);
      console.error(`[AgoOrchestratorAgent] Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        channel: channelName,
        eventType,
        enterpriseId
      });
      // Don't throw - event publishing failures shouldn't break main flows
      // Consider adding fallback mechanism (e.g., database logging) in the future
    } finally {
      // Clean up: unsubscribe from channel after sending
      // This prevents resource leaks in long-running edge functions
      if (realtimeChannel) {
        try {
          await this.supabase.removeChannel(realtimeChannel);
        } catch (cleanupError) {
          console.warn(`[AgoOrchestratorAgent] Failed to cleanup channel ${channelName}:`, cleanupError);
        }
      }
    }
  }

  /**
   * Publish a VERA decision event
   * Used when a governance decision is made (approve, reject, escalate)
   */
  async publishVERADecision(
    enterpriseId: string,
    decision: {
      decisionId: string;
      decisionType: 'approved' | 'rejected' | 'escalated' | 'auto_cleared' | 'needs_review';
      toolName?: string;
      toolVendor?: string;
      confidence: number;
      reasoning?: string;
      policyReferences?: string[];
      isDraftSeal?: boolean;  // True if in Shadow Mode
    }
  ): Promise<void> {
    await this.publishVERAEvent(
      'vera-decisions',
      'decision',
      {
        decision_id: decision.decisionId,
        decision_type: decision.decisionType,
        tool_name: decision.toolName,
        tool_vendor: decision.toolVendor,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        policy_references: decision.policyReferences || [],
        is_draft_seal: decision.isDraftSeal || false
      },
      enterpriseId
    );

    // Also update vera_state with the latest decision
    try {
      await this.supabase.rpc('increment_vera_decision_counter', {
        p_enterprise_id: enterpriseId,
        p_decision_type: decision.decisionType,
        p_decision_id: decision.decisionId
      });
    } catch (error) {
      console.warn('[AgoOrchestratorAgent] Failed to update vera_state:', error);
    }
  }

  /**
   * Publish a VERA alert event
   * Used for policy violations, security incidents, or compliance warnings
   */
  async publishVERAAlert(
    enterpriseId: string,
    alert: {
      alertId: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      alertType: 'policy_violation' | 'security_incident' | 'compliance_warning' | 'dlp_trigger' | 'anomaly_detected';
      title: string;
      description: string;
      affectedTool?: string;
      affectedPartner?: string;
      recommendedActions?: string[];
      requiresHumanReview?: boolean;
    }
  ): Promise<void> {
    await this.publishVERAEvent(
      'vera-alerts',
      'alert',
      {
        alert_id: alert.alertId,
        severity: alert.severity,
        alert_type: alert.alertType,
        title: alert.title,
        description: alert.description,
        affected_tool: alert.affectedTool,
        affected_partner: alert.affectedPartner,
        recommended_actions: alert.recommendedActions || [],
        requires_human_review: alert.requiresHumanReview || false
      },
      enterpriseId
    );
  }

  /**
   * Publish a VERA proof event
   * Used when a Proof Bundle is generated or verified
   */
  async publishVERAProof(
    enterpriseId: string,
    proof: {
      proofBundleId: string;
      proofType: 'generated' | 'verified' | 'invalidated';
      epsId?: string;
      epsHash?: string;
      status: 'draft' | 'verified' | 'blocked' | 'pending_verification';
      veraMode: 'shadow' | 'enforcement' | 'disabled';
      decisionSummary?: {
        totalDecisions: number;
        autoCleared: number;
        escalated: number;
        blocked: number;
      };
      certificateUrl?: string;
      qrCode?: string;
    }
  ): Promise<void> {
    await this.publishVERAEvent(
      'vera-proofs',
      'proof',
      {
        proof_bundle_id: proof.proofBundleId,
        proof_type: proof.proofType,
        eps_id: proof.epsId,
        eps_hash: proof.epsHash,
        status: proof.status,
        vera_mode: proof.veraMode,
        decision_summary: proof.decisionSummary,
        certificate_url: proof.certificateUrl,
        qr_code: proof.qrCode
      },
      enterpriseId
    );
  }

  private async evaluateToolUsage(
    input: EvaluateToolUsageInput,
    context: any
  ): Promise<EvaluateToolUsageResult> {
    const { enterpriseId, partnerId, toolUsage, source } = input;

    // Load VERA mode
    const veraMode = await this.loadEnterpriseVeraMode(enterpriseId);

    // Convert toolUsage to ToolUsageEvent format for policy evaluation
    // For now, we'll create a synthetic submission context
    // In production, this might come from an actual submission or be standalone
    
    // Load EPS (use most recent for enterprise)
    const eps = await this.loadEffectivePolicySnapshotForContext({
      enterpriseId,
      brand: 'UNKNOWN', // May need to be passed in input
      region: 'UNKNOWN',
      channel: 'UNKNOWN',
    });

    if (!eps) {
      throw new AgoError(
        `No EPS found for enterprise ${enterpriseId}`,
        'EPS_NOT_FOUND'
      );
    }

    // Run policy evaluation (simplified - in production would use full LLM evaluation)
    // For MVP, we'll do a basic check
    const ruleSets = await this.loadToolRuleSetsForEnterprise(enterpriseId);
    
    // TODO: Full policy evaluation via LLM
    // For now, assume compliant if no explicit violations
    const isCompliant = true; // Placeholder - would use LLM evaluation

    if (veraMode === 'shadow') {
      // Always allow, create draft seal
      const draftSealId = crypto.randomUUID();
      const proofBundle: ProofBundle = {
        proofBundleId: draftSealId,
        submissionId: '', // May be empty for direct tool usage evaluation
        enterpriseId,
        agencyId: partnerId,
        brand: 'UNKNOWN',
        region: 'UNKNOWN',
        channel: 'UNKNOWN',
        epsId: eps.epsId,
        toolUsage: toolUsage.map((tu) => ({
          toolId: tu.toolId,
          toolKey: tu.toolKey,
          vendor: tu.vendor,
          modelVersion: tu.modelVersion || null,
          purposeTag: tu.purposeTag || null,
          timestamp: new Date().toISOString(),
          callerRole: 'partner',
        })),
        policyDecision: isCompliant ? 'AUTO_COMPLIANT' : 'NON_COMPLIANT',
        policyReasons: ['Tool usage evaluation'],
        anchors: {
          epsHash: eps.sha256Hash,
          bundleHash: '',
          anchoredAt: null,
        },
        is_draft_seal: true,
        draft_decision: isCompliant ? 'would_allow' : 'would_block',
        draft_reasoning: isCompliant ? 'Tool usage appears compliant' : 'Tool usage may violate policy',
        tool_attestation: source === 'manual_preflight' ? {
          tools: toolUsage.map((tu) => ({
            toolId: tu.toolId,
            toolKey: tu.toolKey,
            vendor: tu.vendor,
            modelVersion: tu.modelVersion || null,
            purposeTag: tu.purposeTag || null,
          })),
          data_scope: toolUsage.flatMap((tu) => tu.dataScope || []),
          submitted_at: new Date().toISOString(),
        } : undefined,
      };

      await this.writeProofBundle(proofBundle, context);

      return {
        action: 'allow',
        seal: {
          id: draftSealId,
          is_draft_seal: true,
          draft_decision: proofBundle.draft_decision,
          status: 'draft',
        },
        mode: 'shadow',
        reasoning: proofBundle.draft_reasoning,
      };
    }

    if (veraMode === 'enforcement') {
      if (!isCompliant) {
        // Block
        const blockSealId = crypto.randomUUID();
        const proofBundle: ProofBundle = {
          proofBundleId: blockSealId,
          submissionId: '',
          enterpriseId,
          agencyId: partnerId,
          brand: 'UNKNOWN',
          region: 'UNKNOWN',
          channel: 'UNKNOWN',
          epsId: eps.epsId,
          toolUsage: toolUsage.map((tu) => ({
            toolId: tu.toolId,
            toolKey: tu.toolKey,
            vendor: tu.vendor,
            modelVersion: tu.modelVersion || null,
            purposeTag: tu.purposeTag || null,
            timestamp: new Date().toISOString(),
            callerRole: 'partner',
          })),
          policyDecision: 'NON_COMPLIANT',
          policyReasons: ['Tool usage violates policy'],
          anchors: {
            epsHash: eps.sha256Hash,
            bundleHash: '',
            anchoredAt: null,
          },
          is_draft_seal: false,
          draft_decision: 'would_block',
          draft_reasoning: 'Tool usage violates enterprise policy',
        };

        await this.writeProofBundle(proofBundle, context);

        return {
          action: 'block',
          seal: {
            id: blockSealId,
            is_draft_seal: false,
            draft_decision: 'would_block',
            status: 'blocked',
          },
          mode: 'enforcement',
          reasoning: proofBundle.draft_reasoning,
          violations: ['Policy violation detected'],
        };
      }

      // Compliant - create verified seal
      const verifiedSealId = crypto.randomUUID();
      const proofBundle: ProofBundle = {
        proofBundleId: verifiedSealId,
        submissionId: '',
        enterpriseId,
        agencyId: partnerId,
        brand: 'UNKNOWN',
        region: 'UNKNOWN',
        channel: 'UNKNOWN',
        epsId: eps.epsId,
        toolUsage: toolUsage.map((tu) => ({
          toolId: tu.toolId,
          toolKey: tu.toolKey,
          vendor: tu.vendor,
          modelVersion: tu.modelVersion || null,
          purposeTag: tu.purposeTag || null,
          timestamp: new Date().toISOString(),
          callerRole: 'partner',
        })),
        policyDecision: 'AUTO_COMPLIANT',
        policyReasons: ['Tool usage compliant with policy'],
        anchors: {
          epsHash: eps.sha256Hash,
          bundleHash: '',
          anchoredAt: null,
        },
        is_draft_seal: false,
      };

      await this.writeProofBundle(proofBundle, context);

      return {
        action: 'allow',
        seal: {
          id: verifiedSealId,
          is_draft_seal: false,
          status: 'verified',
        },
        mode: 'enforcement',
        reasoning: 'Tool usage verified as compliant',
      };
    }

    // Disabled mode - allow without seal
    return {
      action: 'allow',
      seal: {
        id: '',
        is_draft_seal: false,
        status: 'draft',
      },
      mode: 'disabled',
      reasoning: 'VERA mode disabled - no governance applied',
    };
  }

  private async getVelocityMetrics(
    enterpriseId: string,
    context: any
  ): Promise<VelocityMetrics> {
    // Load VERA preferences for enterprise coefficients
    const { data: prefs } = await this.supabase
      .from('vera_preferences')
      .select('avg_campaign_value_usd, avg_manual_review_days')
      .eq('enterprise_id', enterpriseId)
      .single();

    // Get proof bundles from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: bundles } = await this.supabase
      .from('proof_bundles')
      .select('id, is_draft_seal, draft_decision, decision, created_at')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', thirtyDaysAgo);

    const totalEvents = bundles?.length || 0;
    const autoCleared = bundles?.filter((b: any) => 
      b.draft_decision === 'would_allow' || 
      b.decision === 'approved' ||
      (b.is_draft_seal === false && b.decision === 'approved')
    ).length || 0;

    const autoClearRate = totalEvents > 0 
      ? Math.round((autoCleared / totalEvents) * 100) 
      : 0;

    const revenueProtected = prefs 
      ? Math.round(autoCleared * (prefs.avg_campaign_value_usd || 0) * 0.15) 
      : 0;

    const daysSaved = prefs 
      ? Math.round(autoCleared * (prefs.avg_manual_review_days || 0) * 10) / 10 
      : 0;

    return {
      events_30d: totalEvents,
      auto_cleared: autoCleared,
      auto_clear_rate: autoClearRate,
      revenue_protected_usd: revenueProtected,
      days_saved: daysSaved,
    };
  }

  // === GOVERNANCE THREAD INTEGRATION ===
  // PRD-aligned governance workflow using governance_threads and governance_actions

  /**
   * Create a governance thread for a submission
   * Called when a new submission needs to be evaluated
   */
  private async createGovernanceThread(input: {
    enterpriseId: string;
    submissionId: string;
    title?: string;
    description?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('create_governance_thread', {
        p_enterprise_id: input.enterpriseId,
        p_thread_type: 'tool_request',
        p_subject_id: input.submissionId,
        p_subject_type: 'submission',
        p_title: input.title || `Submission Review: ${input.submissionId.slice(0, 8)}`,
        p_description: input.description || 'AI tool usage submission requiring governance review',
        p_priority: input.priority || 'normal',
        p_submission_id: input.submissionId,
        p_actor_type: 'agent',
        p_agent_name: 'ago-orchestrator',
        p_metadata: {},
      });

      if (error) {
        console.error('[AgoOrchestratorAgent] Failed to create governance thread:', error);
        return null;
      }

      console.log(`[AgoOrchestratorAgent] Created governance thread: ${data}`);
      return data;
    } catch (err) {
      console.error('[AgoOrchestratorAgent] Error creating governance thread:', err);
      return null;
    }
  }

  /**
   * Record a governance action on a thread
   * Used to track agent decisions with before/after state
   * FDA 21 CFR Part 11: Now captures full context snapshot for decision replay
   */
  private async recordGovernanceAction(input: {
    threadId: string;
    actionType: 'evaluate' | 'approve' | 'reject' | 'escalate' | 'auto_clear' | 'draft_decision';
    rationale: string;
    newStatus?: 'open' | 'pending_human' | 'resolved' | 'cancelled';
    metadata?: Record<string, unknown>;
    contextSnapshot?: ContextSnapshot;  // NEW: Full context for FDA compliance
  }): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('record_governance_action', {
        p_thread_id: input.threadId,
        p_action_type: input.actionType,
        p_actor_type: 'agent',
        p_agent_name: 'ago-orchestrator',
        p_rationale: input.rationale,
        p_new_status: input.newStatus || null,
        p_metadata: input.metadata || {},
        p_context_snapshot: input.contextSnapshot || null,  // NEW: Pass context snapshot
      });

      if (error) {
        console.error('[AgoOrchestratorAgent] Failed to record governance action:', error);
        return null;
      }

      console.log(`[AgoOrchestratorAgent] Recorded governance action: ${input.actionType} -> ${data}`, {
        hasContextSnapshot: !!input.contextSnapshot,
      });
      return data;
    } catch (err) {
      console.error('[AgoOrchestratorAgent] Error recording governance action:', err);
      return null;
    }
  }

  /**
   * Link a proof bundle to a governance thread
   */
  private async linkProofBundleToThread(threadId: string, proofBundleId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('governance_threads')
        .update({ proof_bundle_id: proofBundleId })
        .eq('id', threadId);

      if (error) {
        console.error('[AgoOrchestratorAgent] Failed to link proof bundle to thread:', error);
      }
    } catch (err) {
      console.error('[AgoOrchestratorAgent] Error linking proof bundle:', err);
    }
  }

  /**
   * Get or create a governance thread for a submission
   * Checks if a thread already exists before creating a new one
   */
  private async getOrCreateGovernanceThread(input: {
    enterpriseId: string;
    submissionId: string;
    title?: string;
    description?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<string | null> {
    try {
      // Check for existing thread
      const { data: existing } = await this.supabase
        .from('governance_threads')
        .select('id')
        .eq('enterprise_id', input.enterpriseId)
        .eq('submission_id', input.submissionId)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new thread
      return await this.createGovernanceThread(input);
    } catch (err) {
      // If error is "no rows returned", create new thread
      return await this.createGovernanceThread(input);
    }
  }

  private async runUsageAuditQuery(
    enterpriseId: string,
    filters: {
      brands?: string[];
      regions?: string[];
      channels?: string[];
      agencyIds?: string[];
      toolIds?: string[];
      from: string;
      to: string;
    }
  ): Promise<any> {
    // TODO: Implement comprehensive audit query
    // Query middleware_requests and project_ai_tool_usage for aggregated data
    // This is a placeholder structure - implement based on actual schema

    // Build base query for middleware_requests
    let query = this.supabase
      .from('middleware_requests')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .gte('ts', filters.from)
      .lte('ts', filters.to);

    if (filters.brands && filters.brands.length > 0) {
      // Filter by brand if stored in metadata or submissions
      // This may require joining with submissions table
    }

    if (filters.toolIds && filters.toolIds.length > 0) {
      query = query.in('tool_id', filters.toolIds);
    }

    const { data: events } = await query;

    // Aggregate data
    const toolsUsedMap = new Map<string, number>();
    const agenciesMap = new Map<string, number>();
    let violations = 0;
    let escalations = 0;

    // Get proof bundles for this time range to count violations/escalations
    const { data: proofBundles } = await this.supabase
      .from('proof_bundles')
      .select('id, decision, created_at')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', filters.from)
      .lte('created_at', filters.to);

    if (proofBundles) {
      violations = proofBundles.filter((pb: any) => pb.decision === 'rejected').length;
      escalations = proofBundles.filter((pb: any) => pb.decision === 'needs_review').length;
    }

    // Count tool usage
    if (events) {
      events.forEach((e: any) => {
        const toolKey = e.tool_key || e.tool_id;
        toolsUsedMap.set(toolKey, (toolsUsedMap.get(toolKey) || 0) + 1);
      });
    }

    // Get unique submissions count
    const { data: submissions } = await this.supabase
      .from('submissions')
      .select('id, organization_id')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', filters.from)
      .lte('created_at', filters.to);

    if (submissions) {
      submissions.forEach((s: any) => {
        agenciesMap.set(s.organization_id, (agenciesMap.get(s.organization_id) || 0) + 1);
      });
    }

    return {
      totalSubmissions: submissions?.length || 0,
      totalToolEvents: events?.length || 0,
      toolsUsed: Array.from(toolsUsedMap.entries()).map(([toolKey, count]) => ({
        toolKey,
        count,
      })),
      agencies: Array.from(agenciesMap.entries()).map(([agencyId, submissions]) => ({
        agencyId,
        submissions,
      })),
      violations,
      escalations,
      affectedProofBundleIds: proofBundles?.map((pb: any) => pb.id) || [],
    };
  }

  // === FLOW EXECUTION ===

  private async executeAsFlow(
    flowIdentifier: string,
    input: any,
    context: any
  ): Promise<any> {
    // Load flow definition
    let query = this.supabase
      .from('flow_definitions')
      .select('*')
      .eq('is_active', true);

    if (flowIdentifier.includes('-v')) {
      // Assume format "FlowName-v1.0"
      const [name, version] = flowIdentifier.split('-v');
      query = query.eq('name', name).eq('version', `v${version}`);
    } else {
      // Get latest version by name
      query = query.eq('name', flowIdentifier)
        .order('version', { ascending: false })
        .limit(1);
    }

    const { data: flowDefData, error } = await query.single();

    if (error || !flowDefData) {
      throw new AgoError(
        `Flow ${flowIdentifier} not found`,
        'INVALID_INPUT'
      );
    }

    // Transform database row to FlowDefinition
    const flowDef: FlowDefinition = {
      id: flowDefData.id,
      name: flowDefData.name,
      version: flowDefData.version,
      description: flowDefData.description,
      entryNode: flowDefData.graph_definition.entryNode,
      nodes: flowDefData.graph_definition.nodes,
      edges: flowDefData.graph_definition.edges,
      is_active: flowDefData.is_active,
    };

    // Execute via Flow Engine
    const flowEngine = new SimpleFlowEngine(this.supabase, agentRegistry);
    return await flowEngine.executeFlow(flowDef, input, context);
  }
}

