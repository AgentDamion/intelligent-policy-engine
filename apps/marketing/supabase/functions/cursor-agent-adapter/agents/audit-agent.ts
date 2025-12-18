import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AIRequestEvent } from "./policy-agent.ts";
import type { PolicyEvaluationResult } from "./policy-agent.ts";
import type { RequestAnalysis } from "./context-agent.ts";

/**
 * ProofBundle - Cryptographic audit trail
 */
export interface ProofBundle {
  bundle_id: string;
  request_hash: string;
  response_hash: string;
  policy_evaluation_hash: string;
  hmac_signature: string;
  timestamp: string;
  metadata: {
    algorithm: string;
    version: string;
    generation_time_ms: number;
    // Tool attestation fields (optional for backward compatibility)
    tool_declaration_hash?: string;
    tools_declared?: string[];
    asset_file_hash?: string;
    declaration_id?: string;
  };
}

/**
 * AuditRecord - Structured audit log entry
 */
export interface AuditRecord {
  id: string;
  event_type: 'ai_request' | 'policy_evaluation' | 'access_granted' | 'access_denied';
  partner_id: string;
  enterprise_id: string;
  workspace_id?: string;
  request_data: AIRequestEvent;
  policy_result: PolicyEvaluationResult;
  context_analysis: RequestAnalysis;
  proof_bundle: ProofBundle;
  created_at: string;
}

/**
 * AuditAgent - Evolved for Cryptographic Proof Bundles
 * 
 * Responsibilities:
 * - Generate cryptographic proof bundles for every request
 * - Hash request/response data with HMAC-SHA256
 * - Store tamper-evident audit trails
 * - Support compliance export and verification
 */
export class AuditAgent {
  private supabase: SupabaseClient;
  private secretKey: string;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    // In production, this should come from Supabase secrets/vault
    this.secretKey = Deno.env.get('PROOF_BUNDLE_SECRET_KEY') || 'default-secret-key-change-in-production';
  }

  /**
   * Process audit trail generation
   */
  async process(input: {
    request: AIRequestEvent;
    policyResult: PolicyEvaluationResult;
    contextAnalysis: RequestAnalysis;
    response?: { content: string; tokens: number };
  }, context: Record<string, unknown>): Promise<AuditRecord> {
    const startTime = Date.now();
    
    console.log('AuditAgent generating proof bundle:', {
      partner_id: input.request.partner_id,
      enterprise_id: input.request.enterprise_id,
      policy_decision: input.policyResult.decision
    });

    try {
      // Generate proof bundle
      const proofBundle = await this.generateProofBundle(
        input.request,
        input.policyResult,
        input.contextAnalysis,
        input.response
      );

      // Create audit record
      const auditRecord: AuditRecord = {
        id: crypto.randomUUID(),
        event_type: input.policyResult.decision === 'block' ? 'access_denied' : 'access_granted',
        partner_id: input.request.partner_id,
        enterprise_id: input.request.enterprise_id,
        workspace_id: input.request.workspace_id,
        request_data: input.request,
        policy_result: input.policyResult,
        context_analysis: input.contextAnalysis,
        proof_bundle: proofBundle,
        created_at: new Date().toISOString()
      };

      // Store in database
      await this.storeAuditRecord(auditRecord);

      // Log to agent_activities for observability
      await this.logAgentActivity(auditRecord, Date.now() - startTime);

      console.log('AuditAgent proof bundle generated:', {
        bundle_id: proofBundle.bundle_id,
        generation_time_ms: proofBundle.metadata.generation_time_ms
      });

      return auditRecord;

    } catch (error) {
      console.error('AuditAgent error:', error);
      throw error;
    }
  }

  /**
   * Generate cryptographic proof bundle
   */
  private async generateProofBundle(
    request: AIRequestEvent,
    policyResult: PolicyEvaluationResult,
    contextAnalysis: RequestAnalysis,
    response?: { content: string; tokens: number }
  ): Promise<ProofBundle> {
    const startTime = Date.now();
    
    // Generate hashes
    const requestHash = await this.sha256Hash(JSON.stringify({
      partner_id: request.partner_id,
      enterprise_id: request.enterprise_id,
      model: request.model,
      prompt: request.prompt,
      timestamp: request.timestamp
    }));

    const responseHash = response 
      ? await this.sha256Hash(JSON.stringify({
          content: response.content,
          tokens: response.tokens,
          timestamp: new Date().toISOString()
        }))
      : 'no-response';

    const policyEvaluationHash = await this.sha256Hash(JSON.stringify({
      decision: policyResult.decision,
      reasons: policyResult.reasons,
      policy_ids: policyResult.policy_ids,
      confidence: policyResult.confidence
    }));

    // Generate HMAC signature
    const dataToSign = `${requestHash}|${responseHash}|${policyEvaluationHash}`;
    const hmacSignature = await this.hmacSha256(dataToSign, this.secretKey);

    return {
      bundle_id: crypto.randomUUID(),
      request_hash: requestHash,
      response_hash: responseHash,
      policy_evaluation_hash: policyEvaluationHash,
      hmac_signature: hmacSignature,
      timestamp: new Date().toISOString(),
      metadata: {
        algorithm: 'HMAC-SHA256',
        version: '1.0',
        generation_time_ms: Date.now() - startTime
      }
    };
  }

  /**
   * SHA-256 hash function
   */
  private async sha256Hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * HMAC-SHA256 signature function
   */
  private async hmacSha256(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store audit record in database
   */
  private async storeAuditRecord(record: AuditRecord): Promise<void> {
    const { error } = await this.supabase
      .from('middleware_requests')
      .insert({
        id: record.id,
        partner_id: record.partner_id,
        enterprise_id: record.enterprise_id,
        workspace_id: record.workspace_id,
        event_type: record.event_type,
        request_data: record.request_data,
        policy_result: record.policy_result,
        context_analysis: record.context_analysis,
        proof_bundle: record.proof_bundle,
        created_at: record.created_at
      });

    if (error) {
      console.error('Error storing audit record:', error);
      throw new Error(`Failed to store audit record: ${error.message}`);
    }
  }

  /**
   * Log to agent_activities for observability
   */
  private async logAgentActivity(record: AuditRecord, durationMs: number): Promise<void> {
    await this.supabase
      .from('agent_activities')
      .insert({
        agent: 'audit',
        action: 'proof_bundle_generated',
        status: 'complete',
        details: {
          bundle_id: record.proof_bundle.bundle_id,
          event_type: record.event_type,
          partner_id: record.partner_id,
          enterprise_id: record.enterprise_id,
          policy_decision: record.policy_result.decision,
          risk_score: record.context_analysis.risk_score,
          metadata: {
            duration_ms: durationMs,
            algorithm: record.proof_bundle.metadata.algorithm,
            version: record.proof_bundle.metadata.version
          }
        },
        workspace_id: record.workspace_id,
        enterprise_id: record.enterprise_id
      });
  }

  /**
   * Verify proof bundle integrity
   */
  async verifyProofBundle(bundle: ProofBundle): Promise<boolean> {
    try {
      const dataToVerify = `${bundle.request_hash}|${bundle.response_hash}|${bundle.policy_evaluation_hash}`;
      const expectedSignature = await this.hmacSha256(dataToVerify, this.secretKey);
      return expectedSignature === bundle.hmac_signature;
    } catch (error) {
      console.error('Proof bundle verification error:', error);
      return false;
    }
  }

  /**
   * Validate tool declarations against ai_tool_registry
   */
  async validateToolDeclaration(
    toolIds: string[],
    enterpriseId: string,
    policyInstanceId?: string
  ): Promise<{
    approved: boolean;
    violations: Array<{tool_id: string; tool_name: string; reason: string}>;
    aggregated_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    if (toolIds.length === 0) {
      return { approved: true, violations: [], aggregated_risk: 'LOW' };
    }

    // Query ai_tool_registry for all declared tools
    const { data: tools, error } = await this.supabase
      .from('ai_tool_registry')
      .select('id, name, deployment_status, risk_tier')
      .in('id', toolIds);

    if (error) {
      console.error('Error querying ai_tool_registry:', error);
      throw new Error('Failed to validate tools');
    }

    const violations: Array<{tool_id: string; tool_name: string; reason: string}> = [];
    const riskTiers: string[] = [];

    // Check each tool
    for (const toolId of toolIds) {
      const tool = tools?.find(t => t.id === toolId);
      
      if (!tool) {
        violations.push({
          tool_id: toolId,
          tool_name: 'Unknown Tool',
          reason: 'Tool not found in registry'
        });
        continue;
      }

      // Check deployment status
      if (tool.deployment_status === 'banned') {
        violations.push({
          tool_id: tool.id,
          tool_name: tool.name,
          reason: `Tool is banned for use in this enterprise`
        });
      }

      // Collect risk tiers for aggregation
      if (tool.risk_tier) {
        riskTiers.push(tool.risk_tier);
      }
    }

    // Aggregate risk (highest tier wins)
    const riskHierarchy = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const aggregatedRisk = riskTiers.reduce((highest, current) => {
      const currentIndex = riskHierarchy.indexOf(current);
      const highestIndex = riskHierarchy.indexOf(highest);
      return currentIndex < highestIndex ? current : highest;
    }, 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    return {
      approved: violations.length === 0,
      violations,
      aggregated_risk: aggregatedRisk
    };
  }

  /**
   * Generate proof bundle specifically for asset declarations
   */
  async generateAssetProofBundle(
    fileHash: string,
    toolsUsed: Array<{tool_id: string; tool_name: string; how_used: string}>,
    validationResult: {
      approved: boolean;
      violations: Array<{tool_id: string; tool_name: string; reason: string}>;
      aggregated_risk: string;
    },
    declarationId: string
  ): Promise<ProofBundle> {
    const startTime = Date.now();
    
    // Hash the tool declarations
    const toolDeclarationHash = await this.sha256Hash(
      JSON.stringify(toolsUsed.map(t => ({ tool_id: t.tool_id, how_used: t.how_used })))
    );

    // Hash the validation result
    const validationHash = await this.sha256Hash(JSON.stringify({
      approved: validationResult.approved,
      violations: validationResult.violations,
      aggregated_risk: validationResult.aggregated_risk
    }));

    // Generate HMAC signature for the asset declaration
    const dataToSign = `${fileHash}|${toolDeclarationHash}|${validationHash}`;
    const hmacSignature = await this.hmacSha256(dataToSign, this.secretKey);

    return {
      bundle_id: crypto.randomUUID(),
      request_hash: fileHash, // File hash serves as "request"
      response_hash: 'asset-declaration', // Not applicable for assets
      policy_evaluation_hash: validationHash,
      hmac_signature: hmacSignature,
      timestamp: new Date().toISOString(),
      metadata: {
        algorithm: 'HMAC-SHA256',
        version: '2.0', // Version 2.0 for asset declarations
        generation_time_ms: Date.now() - startTime,
        tool_declaration_hash: toolDeclarationHash,
        tools_declared: toolsUsed.map(t => t.tool_id),
        asset_file_hash: fileHash,
        declaration_id: declarationId
      }
    };
  }

  /**
   * Export audit trail for compliance
   */
  async exportAuditTrail(
    enterpriseId: string,
    startDate: string,
    endDate: string
  ): Promise<AuditRecord[]> {
    const { data, error } = await this.supabase
      .from('middleware_requests')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error exporting audit trail:', error);
      throw new Error(`Failed to export audit trail: ${error.message}`);
    }

    return data || [];
  }
}
