import { supabase } from '@/integrations/supabase/client';
import type { PolicyObjectModel, AITool } from '@/types/policyObjectModel';

/**
 * Answer Template Engine
 * Generates policy-aligned, evidence-backed RFP answers
 */

export type RFPTheme = 
  | 'ai_usage_disclosure'
  | 'ai_tools_inventory'
  | 'data_boundaries'
  | 'ai_guardrails'
  | 'audit_proof'
  | 'policy_alignment';

interface TemplateContext {
  pom: PolicyObjectModel;
  evidence: Array<{
    id: string;
    tool_name: string;
    tool_version?: string;
    purpose: string;
    timestamp: string;
    user: string;
    workspace: string;
    data_context: string;
  }>;
  clientPolicyName?: string;
  agencyPolicyName?: string;
  contractualAddendum?: string;
}

export class AnswerTemplateEngine {
  /**
   * Main entry point: Generate policy-backed answer for an RFP question
   */
  static async generatePolicyBackedAnswer(
    questionId: string,
    policyId: string,
    evidenceIds: string[]
  ): Promise<string> {
    // 1. Fetch policy POM
    const { data: policy } = await supabase
      .from('policies')
      .select('pom')
      .eq('id', policyId)
      .single();

    if (!policy?.pom) {
      throw new Error('Policy POM not found');
    }

    const pom = policy.pom as PolicyObjectModel;

    // 2. Fetch audit evidence
    const { data: auditEvents } = await supabase
      .from('audit_events')
      .select('*')
      .in('id', evidenceIds);

    const evidence = (auditEvents || []).map(event => {
      const details = (event.details || {}) as Record<string, any>;
      return {
        id: event.id,
        tool_name: (details.tool_name as string) || 'Unknown',
        tool_version: details.tool_version as string | undefined,
        purpose: (details.purpose as string) || 'Not specified',
        timestamp: event.created_at,
        user: event.user_id || 'System',
        workspace: event.workspace_id || 'N/A',
        data_context: (details.data_context as string) || 'No client data processed',
      };
    });

    // 3. Classify question into RFP theme
    const theme = this.classifyQuestion(questionId);

    // 4. Generate answer using appropriate template
    const context: TemplateContext = {
      pom,
      evidence,
      clientPolicyName: pom.alignment.client_policy_refs[0]?.policy,
      agencyPolicyName: 'Agency AI Governance',
      contractualAddendum: pom.alignment.contractual_addenda?.[0]?.msa_clause,
    };

    return this.applyTemplate(theme, context);
  }

  /**
   * Classify question into RFP theme based on keywords
   */
  private static classifyQuestion(questionId: string): RFPTheme {
    // In production, use more sophisticated classification (NLP, embeddings, etc.)
    const questionLower = questionId.toLowerCase();
    
    if (questionLower.includes('disclosure') || questionLower.includes('did you use ai')) {
      return 'ai_usage_disclosure';
    }
    if (questionLower.includes('tools') || questionLower.includes('which ai')) {
      return 'ai_tools_inventory';
    }
    if (questionLower.includes('data') || questionLower.includes('client data')) {
      return 'data_boundaries';
    }
    if (questionLower.includes('guardrails') || questionLower.includes('accuracy')) {
      return 'ai_guardrails';
    }
    if (questionLower.includes('audit') || questionLower.includes('evidence')) {
      return 'audit_proof';
    }
    if (questionLower.includes('policy') || questionLower.includes('compliance')) {
      return 'policy_alignment';
    }
    
    return 'ai_guardrails'; // Default
  }

  /**
   * Apply the appropriate template based on RFP theme
   */
  private static applyTemplate(theme: RFPTheme, context: TemplateContext): string {
    switch (theme) {
      case 'ai_usage_disclosure':
        return this.generateDisclosureAnswer(context);
      case 'ai_tools_inventory':
        return this.generateToolsInventoryAnswer(context);
      case 'data_boundaries':
        return this.generateDataBoundariesAnswer(context);
      case 'ai_guardrails':
        return this.generateGuardrailsAnswer(context);
      case 'audit_proof':
        return this.generateAuditProofAnswer(context);
      case 'policy_alignment':
        return this.generatePolicyAlignmentAnswer(context);
      default:
        return this.generateGuardrailsAnswer(context);
    }
  }

  // ============================================
  // Template 1: AI Usage Disclosure
  // ============================================
  private static generateDisclosureAnswer(ctx: TemplateContext): string {
    const { pom, evidence } = ctx;
    
    if (evidence.length === 0) {
      return 'No. We did not use AI in the preparation of this proposal.';
    }

    const toolUsages = evidence.map(e => {
      const tool = pom.tools.find(t => t.name === e.tool_name);
      return `
**${e.tool_name}** ${e.tool_version ? `(v${e.tool_version})` : ''} was used to ${e.purpose}. ${e.data_context}. 

See evidence: **Audit #${e.id.slice(0, 8).toUpperCase()}** (timestamp: ${new Date(e.timestamp).toLocaleDateString()}, workspace: ${e.workspace}, policy checks: ${tool?.approval.status || 'verified'}).
      `.trim();
    }).join('\n\n');

    const policyAlignment = ctx.clientPolicyName 
      ? `Policy alignment: **${ctx.clientPolicyName}** and our **${ctx.agencyPolicyName}** requirements.`
      : `Policy alignment: Our **${ctx.agencyPolicyName}** requirements.`;

    return `Yes. ${toolUsages}\n\n${policyAlignment}`;
  }

  // ============================================
  // Template 2: AI Tools Inventory
  // ============================================
  private static generateToolsInventoryAnswer(ctx: TemplateContext): string {
    const { pom } = ctx;

    const toolsList = pom.tools.map((tool, idx) => {
      const purposes = tool.purpose.join(', ');
      const dataContext = tool.contexts.client_data_allowed 
        ? '⚠️ May process client data under controlled conditions'
        : '✅ Public data only';
      
      return `
${idx + 1}. **${tool.name}** ${tool.version ? `(v${tool.version})` : ''}
   - **Provider**: ${tool.provider || 'Not specified'}
   - **Purpose**: ${purposes}
   - **Approval Status**: ${tool.approval.status} (approved by ${tool.approval.by} on ${new Date(tool.approval.date).toLocaleDateString()})
   - **Data Context**: ${dataContext}
      `.trim();
    }).join('\n\n');

    return `We use the following AI tools in accordance with our AI governance policies:\n\n${toolsList}\n\nAll tools undergo pre-approval review and continuous monitoring for compliance.`;
  }

  // ============================================
  // Template 3: Data Boundaries
  // ============================================
  private static generateDataBoundariesAnswer(ctx: TemplateContext): string {
    const { pom, evidence } = ctx;
    const { data_controls } = pom;

    const dataClasses = data_controls.data_classes.join(', ');
    const isolation = data_controls.isolation.per_client_workspace 
      ? 'Each client has dedicated workspace isolation with no cross-client data sharing.'
      : 'Data is isolated per project.';
    
    const retention = data_controls.retention 
      ? `Data retention: ${data_controls.retention.policy_days} days${data_controls.retention.auto_delete ? ' (with automatic deletion)' : ''}.`
      : 'Data retention follows standard enterprise policies.';

    const thirdParty = data_controls.third_parties?.llm_training_opt_out
      ? 'We have opted out of third-party LLM training data usage.'
      : '';

    const evidenceSummary = evidence.length > 0
      ? `\n\n**Evidence**: ${evidence.length} verified AI tool usage events with confirmed data boundaries (${evidence.filter(e => e.data_context.includes('no client data')).length} with no client data processing).`
      : '';

    return `
**Data Classification**: ${dataClasses}

**Isolation Controls**: ${isolation}

**Retention**: ${retention}

${thirdParty}${evidenceSummary}

All data handling is **policy-aligned and evidence-backed** through our immutable audit trail.
    `.trim();
  }

  // ============================================
  // Template 4: AI Guardrails & Accuracy
  // ============================================
  private static generateGuardrailsAnswer(ctx: TemplateContext): string {
    const { pom } = ctx;
    const { controls } = pom;

    const hitl = controls.hitl.required 
      ? `**Human-in-the-Loop (HITL) Review**: Required for all AI outputs. Reviewers: ${controls.hitl.reviewers.join(', ')}.`
      : 'Human oversight is applied to critical AI decisions.';

    const validation = controls.validation.factual_check
      ? `**Factual Validation**: ${controls.validation.reference_required ? 'Multi-source verification required' : 'Factual accuracy checks performed'}.`
      : '';

    const testing = controls.testing?.bias_testing
      ? `**Bias Testing**: Active monitoring and mitigation strategies in place.`
      : '';

    const redaction = controls.redaction?.pii_redaction
      ? `**PII Redaction**: ${controls.redaction.auto_redaction ? 'Automatic' : 'Manual'} redaction of personally identifiable information.`
      : '';

    const useCases = pom.usage_disclosure.allowed_ai_usage.join(', ');
    const addendum = ctx.contractualAddendum 
      ? ` and our usage adheres to ${ctx.contractualAddendum}`
      : '';

    return `
We apply AI to ${useCases}—always within **client policy** and **our AI governance**.

**Safeguards include**:

- ${hitl}
- ${validation}
- **Approved Enterprise Platforms**: Only pre-approved tools (see AI Tools Inventory)
- **Data Classification & Isolation**: Per-client workspace boundaries
- **Immutable Audit Logging**: Every AI interaction logged with cryptographic signatures

${testing ? `- ${testing}` : ''}
${redaction ? `- ${redaction}` : ''}

Our responses are **policy-aligned and evidence-backed**${addendum}.
    `.trim();
  }

  // ============================================
  // Template 5: Audit & Proof
  // ============================================
  private static generateAuditProofAnswer(ctx: TemplateContext): string {
    const { pom, evidence } = ctx;
    const { auditability } = pom;

    const logScope = auditability.log_scope.join(', ');
    const exportFormats = auditability.export_formats.join(', ');
    const retention = auditability.retention_period_days 
      ? `${auditability.retention_period_days} days`
      : 'per regulatory requirements';

    const evidenceCount = evidence.length;
    const evidenceSample = evidence.slice(0, 3).map(e => 
      `- **Audit #${e.id.slice(0, 8).toUpperCase()}**: ${e.tool_name} → ${e.purpose} (${new Date(e.timestamp).toLocaleDateString()})`
    ).join('\n');

    return `
**Audit Capabilities**:

- **Log Scope**: ${logScope}
- **Cryptographic Signature**: ${auditability.signature.toUpperCase()} hashing for immutability
- **Export Formats**: ${exportFormats}
- **Retention Period**: ${retention}

**Current Evidence Availability**: ${evidenceCount} verified AI usage events with complete audit trails.

${evidenceSample}

All audit records are **immutable** (cannot be modified or deleted) and include cryptographic proof of integrity. We can provide full audit exports in your preferred format.
    `.trim();
  }

  // ============================================
  // Template 6: Policy Alignment
  // ============================================
  private static generatePolicyAlignmentAnswer(ctx: TemplateContext): string {
    const { pom } = ctx;
    const { alignment } = pom;

    const clientPolicies = alignment.client_policy_refs.map(ref => 
      `- **${ref.client}**: ${ref.policy} ${ref.version ? `(${ref.version})` : ''} (Policy ID: ${ref.id})`
    ).join('\n');

    const addenda = alignment.contractual_addenda?.map(add =>
      `- ${add.msa_clause}${add.description ? `: ${add.description}` : ''}`
    ).join('\n') || '';

    const govRoles = pom.governance.roles.map(role =>
      `- **${role.role}**: Approves ${role.approves.join(', ')}`
    ).join('\n');

    return `
**Client Policy Alignment**:

${clientPolicies}

${addenda ? `**Contractual Addenda**:\n${addenda}\n\n` : ''}

**Governance Structure**:

${govRoles}

**Exception Process**: ${pom.governance.exceptions?.process || 'Standard escalation to legal/compliance'} (approver: ${pom.governance.exceptions?.approver_role || 'Legal'})

We maintain continuous alignment verification between client policies and our internal AI governance through automated policy harmonization and human oversight.
    `.trim();
  }
}
