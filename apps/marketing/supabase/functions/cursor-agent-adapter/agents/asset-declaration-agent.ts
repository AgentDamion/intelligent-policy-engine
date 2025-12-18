import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AuditAgent } from "./audit-agent.ts";

/**
 * Asset Declaration Interfaces
 */
export interface AssetDeclaration {
  id: string;
  file_hash: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  enterprise_id: string;
  partner_id: string;
  project_id?: string;
  tools_used: Array<{
    tool_id: string;
    tool_name: string;
    how_used: string;
  }>;
  usage_description?: string;
  validation_status: 'pending' | 'compliant' | 'violation' | 'error';
  validation_result?: {
    approved: boolean;
    violations: Array<{tool_id: string; tool_name: string; reason: string}>;
    aggregated_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  aggregated_risk_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  proof_bundle_id?: string;
  proof_bundle_metadata?: any;
  declared_by_user_id?: string;
  role_credential?: string;
  role_verified?: boolean;
  declared_at: string;
  validated_at?: string;
}

export interface DeclareAssetInput {
  file_hash: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  enterprise_id: string;
  partner_id: string;
  project_id?: string;
  tools_used: Array<{
    tool_id: string;
    tool_name: string;
    how_used: string;
  }>;
  usage_description?: string;
  declared_by_user_id?: string;
  role_credential?: string;
}

export interface DeclareAssetOutput {
  success: boolean;
  declaration_id?: string;
  proof_bundle_id?: string;
  validation_status: 'compliant' | 'violation' | 'error';
  violations?: Array<{tool_id: string; tool_name: string; reason: string}>;
  aggregated_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  error?: string;
}

export interface ListDeclarationsFilters {
  enterprise_id?: string;
  partner_id?: string;
  project_id?: string;
  validation_status?: 'pending' | 'compliant' | 'violation' | 'error';
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface DeclarationStats {
  total_declarations: number;
  compliant_count: number;
  violation_count: number;
  by_file_type: Record<string, number>;
  by_risk_tier: Record<string, number>;
  recent_violations: Array<{
    declaration_id: string;
    file_name: string;
    violation_count: number;
    declared_at: string;
  }>;
}

/**
 * AssetDeclarationAgent - Universal AI Asset Governance
 * 
 * Orchestrates the complete asset declaration lifecycle:
 * - Validates tool usage against ai_tool_registry
 * - Generates cryptographic proof bundles for asset declarations
 * - Persists declarations with full audit trail
 * - Routes policy violations to InboxAgent for human review
 * 
 * Implements "Digital Customs" model: every deliverable must arrive with
 * an Asset Passport declaring which AI tools were used and policy compliance.
 */
export class AssetDeclarationAgent {
  private supabase: SupabaseClient;
  private auditAgent: AuditAgent;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.auditAgent = new AuditAgent(supabase);
  }

  /**
   * Main process entry point
   */
  async process(input: any, context: Record<string, unknown>): Promise<any> {
    const action = input.action;

    console.log('AssetDeclarationAgent processing:', {
      action,
      has_file_hash: !!input.file_hash
    });

    switch (action) {
      case 'declare_asset':
        return this.declareAsset(input, context);
      case 'get_asset_declaration':
        return this.getAssetDeclaration(input.declaration_id, context);
      case 'list_asset_declarations':
        return this.listAssetDeclarations(input.filters, context);
      case 'validate_asset_compliance':
        return this.validateAssetCompliance(input.declaration_id, context);
      case 'get_declaration_stats':
        return this.getDeclarationStats(input.enterprise_id, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Declare an asset with tool usage
   * 
   * This is the core method that:
   * 1. Validates input
   * 2. Calls AuditAgent.validateToolDeclaration()
   * 3. Generates proof bundle via AuditAgent.generateAssetProofBundle()
   * 4. Persists declaration to asset_declarations table
   * 5. Routes violations to InboxAgent
   */
  async declareAsset(
    payload: DeclareAssetInput,
    context: Record<string, unknown>
  ): Promise<DeclareAssetOutput> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateDeclareAssetInput(payload);

      // Priority 2: Validate partner-enterprise relationship BEFORE processing
      const { data: partnerAuth, error: authError } = await this.supabase
        .from('partner_api_keys')
        .select('id, enterprise_id, is_active, expires_at')
        .eq('partner_id', payload.partner_id)
        .eq('enterprise_id', payload.enterprise_id)
        .eq('is_active', true)
        .single();

      if (authError || !partnerAuth) {
        throw new Error(
          `Partner ${payload.partner_id} is not authorized for enterprise ${payload.enterprise_id}. ` +
          `Please verify your API key and enterprise configuration.`
        );
      }

      // Check API key expiration
      if (partnerAuth.expires_at && new Date(partnerAuth.expires_at) < new Date()) {
        throw new Error(
          `Partner API key has expired (${partnerAuth.expires_at}). ` +
          `Please contact the enterprise administrator to renew your key.`
        );
      }

      // Priority 3: Set session context for multi-client partners
      if (context.partner_id && context.enterprise_id) {
        await this.supabase.rpc('set_current_context', {
          p_partner_id: context.partner_id as string,
          p_enterprise_id: context.enterprise_id as string,
          p_workspace_id: (context.workspace_id as string) || null
        });
      }

      // Check for duplicate declarations
      const existingDeclaration = await this.checkDuplicateDeclaration(
        payload.file_hash,
        payload.partner_id
      );

      if (existingDeclaration) {
        console.log('Duplicate declaration detected:', existingDeclaration.id);
        return {
          success: true,
          declaration_id: existingDeclaration.id,
          proof_bundle_id: existingDeclaration.proof_bundle_id,
          validation_status: existingDeclaration.validation_status,
          violations: existingDeclaration.validation_result?.violations,
          aggregated_risk: existingDeclaration.aggregated_risk_tier
        };
      }

      // Extract tool IDs for validation
      const toolIds = payload.tools_used.map(t => t.tool_id);

      // Step 1: Validate tools against registry
      console.log('Validating tools:', toolIds);
      const validationResult = await this.auditAgent.validateToolDeclaration(
        toolIds,
        payload.enterprise_id,
        payload.project_id
      );

      // Generate temporary declaration ID for proof bundle
      const declarationId = crypto.randomUUID();

      // Step 2: Generate proof bundle
      console.log('Generating proof bundle for declaration:', declarationId);
      const proofBundle = await this.auditAgent.generateAssetProofBundle(
        payload.file_hash,
        payload.tools_used,
        validationResult,
        declarationId
      );

      // Determine validation status
      const validation_status = validationResult.approved ? 'compliant' : 'violation';

      // Step 3: Persist declaration
      const { data: declaration, error: insertError } = await this.supabase
        .from('asset_declarations')
        .insert({
          id: declarationId,
          file_hash: payload.file_hash,
          file_name: payload.file_name,
          file_type: payload.file_type,
          file_size_bytes: payload.file_size_bytes,
          enterprise_id: payload.enterprise_id,
          partner_id: payload.partner_id,
          project_id: payload.project_id,
          tools_used: payload.tools_used,
          usage_description: payload.usage_description,
          validation_status,
          validation_result: validationResult,
          aggregated_risk_tier: validationResult.aggregated_risk,
          proof_bundle_id: proofBundle.bundle_id,
          proof_bundle_metadata: proofBundle,
          declared_by_user_id: payload.declared_by_user_id,
          role_credential: payload.role_credential,
          role_verified: !!payload.role_credential,
          declared_at: new Date().toISOString(),
          validated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting asset declaration:', insertError);
        throw new Error(`Failed to store declaration: ${insertError.message}`);
      }

      // Step 4: Route violations to InboxAgent if detected
      if (!validationResult.approved && validationResult.violations.length > 0) {
        await this.routeViolationToInbox(declaration, validationResult, context);
      }

      // Log to agent_activities
      await this.logAgentActivity({
        action: 'asset_declared',
        status: validation_status,
        details: {
          declaration_id: declarationId,
          file_hash: payload.file_hash,
          tools_count: payload.tools_used.length,
          validation_status,
          violations_count: validationResult.violations.length,
          aggregated_risk: validationResult.aggregated_risk,
          duration_ms: Date.now() - startTime
        },
        enterprise_id: payload.enterprise_id
      });

      console.log('Asset declaration complete:', {
        declaration_id: declarationId,
        validation_status,
        proof_bundle_id: proofBundle.bundle_id
      });

      return {
        success: true,
        declaration_id: declarationId,
        proof_bundle_id: proofBundle.bundle_id,
        validation_status,
        violations: validationResult.approved ? undefined : validationResult.violations,
        aggregated_risk: validationResult.aggregated_risk
      };

    } catch (error) {
      console.error('AssetDeclarationAgent.declareAsset error:', error);
      
      // Log error to agent_activities
      await this.logAgentActivity({
        action: 'asset_declared',
        status: 'error',
        details: {
          error: error.message,
          file_hash: payload.file_hash,
          duration_ms: Date.now() - startTime
        },
        enterprise_id: payload.enterprise_id
      });

      return {
        success: false,
        validation_status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get single asset declaration by ID
   */
  async getAssetDeclaration(
    declarationId: string,
    context: Record<string, unknown>
  ): Promise<AssetDeclaration | null> {
    const { data, error } = await this.supabase
      .from('asset_declarations')
      .select('*')
      .eq('id', declarationId)
      .single();

    if (error) {
      console.error('Error fetching asset declaration:', error);
      throw new Error(`Failed to fetch declaration: ${error.message}`);
    }

    return data as AssetDeclaration;
  }

  /**
   * List asset declarations with filtering
   */
  async listAssetDeclarations(
    filters: ListDeclarationsFilters,
    context: Record<string, unknown>
  ): Promise<AssetDeclaration[]> {
    let query = this.supabase
      .from('asset_declarations')
      .select('*');

    // Apply filters
    if (filters.enterprise_id) {
      query = query.eq('enterprise_id', filters.enterprise_id);
    }
    if (filters.partner_id) {
      query = query.eq('partner_id', filters.partner_id);
    }
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters.validation_status) {
      query = query.eq('validation_status', filters.validation_status);
    }
    if (filters.start_date) {
      query = query.gte('declared_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('declared_at', filters.end_date);
    }

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query
      .order('declared_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error listing asset declarations:', error);
      throw new Error(`Failed to list declarations: ${error.message}`);
    }

    return (data || []) as AssetDeclaration[];
  }

  /**
   * Re-validate existing declaration against current policies
   */
  async validateAssetCompliance(
    declarationId: string,
    context: Record<string, unknown>
  ): Promise<DeclareAssetOutput> {
    const declaration = await this.getAssetDeclaration(declarationId, context);
    
    if (!declaration) {
      throw new Error('Declaration not found');
    }

    const toolIds = declaration.tools_used.map(t => t.tool_id);
    const validationResult = await this.auditAgent.validateToolDeclaration(
      toolIds,
      declaration.enterprise_id,
      declaration.project_id
    );

    const validation_status = validationResult.approved ? 'compliant' : 'violation';

    // Update declaration with new validation
    const { error: updateError } = await this.supabase
      .from('asset_declarations')
      .update({
        validation_status,
        validation_result: validationResult,
        aggregated_risk_tier: validationResult.aggregated_risk,
        validated_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (updateError) {
      console.error('Error updating declaration validation:', updateError);
      throw new Error(`Failed to update validation: ${updateError.message}`);
    }

    return {
      success: true,
      declaration_id: declarationId,
      validation_status,
      violations: validationResult.approved ? undefined : validationResult.violations,
      aggregated_risk: validationResult.aggregated_risk
    };
  }

  /**
   * Get declaration statistics for dashboard
   */
  async getDeclarationStats(
    enterpriseId: string,
    context: Record<string, unknown>
  ): Promise<DeclarationStats> {
    // Use analytics view if available, otherwise query directly
    const { data, error } = await this.supabase
      .from('asset_declaration_summary')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching declaration stats:', error);
      // Fallback to direct query
      return this.calculateStatsDirectly(enterpriseId);
    }

    if (!data) {
      return this.calculateStatsDirectly(enterpriseId);
    }

    return {
      total_declarations: data.total_declarations || 0,
      compliant_count: data.compliant_count || 0,
      violation_count: data.violation_count || 0,
      by_file_type: data.by_file_type || {},
      by_risk_tier: data.by_risk_tier || {},
      recent_violations: data.recent_violations || []
    };
  }

  /**
   * Private helper: Validate declare asset input
   */
  private validateDeclareAssetInput(payload: DeclareAssetInput): void {
    if (!payload.file_hash || !/^[a-f0-9]{64}$/i.test(payload.file_hash)) {
      throw new Error('Invalid file_hash: must be 64-character SHA-256 hex string');
    }
    if (!payload.enterprise_id || !payload.partner_id) {
      throw new Error('Missing required fields: enterprise_id, partner_id');
    }
    if (!payload.tools_used || payload.tools_used.length === 0) {
      throw new Error('tools_used array is required and cannot be empty');
    }
    for (const tool of payload.tools_used) {
      if (!tool.tool_id || !tool.tool_name || !tool.how_used) {
        throw new Error('Each tool must have tool_id, tool_name, and how_used');
      }
    }
  }

  /**
   * Private helper: Check for duplicate declarations
   */
  private async checkDuplicateDeclaration(
    fileHash: string,
    partnerId: string
  ): Promise<AssetDeclaration | null> {
    const { data, error } = await this.supabase
      .from('asset_declarations')
      .select('*')
      .eq('file_hash', fileHash)
      .eq('partner_id', partnerId)
      .order('declared_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking duplicate declaration:', error);
      return null;
    }

    return data as AssetDeclaration | null;
  }

  /**
   * Private helper: Route violation to InboxAgent
   */
  private async routeViolationToInbox(
    declaration: any,
    validationResult: any,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      // Invoke InboxAgent to create task
      const { data: inboxResponse, error: inboxError } = await this.supabase.functions.invoke(
        'cursor-agent-adapter',
        {
          body: {
            agent: 'inbox',
            action: 'create_task',
            source_agent: 'asset-declaration',
            user_role_target: 'POLICY_OWNER',
            priority: validationResult.aggregated_risk === 'CRITICAL' ? 'critical' : 'high',
            severity: validationResult.aggregated_risk.toLowerCase(),
            title: `Asset Declaration Violation: ${declaration.file_name || declaration.file_hash.substring(0, 8)}`,
            summary_html: this.generateViolationSummaryHtml(declaration, validationResult),
            task_type: 'asset_violation',
            action_type: 'REVIEW_ASSET',
            action_payload: {
              declaration_id: declaration.id,
              file_hash: declaration.file_hash,
              violations: validationResult.violations
            },
            source_url: `/agentic?tab=configuration&declaration=${declaration.id}`,
            source_entity_id: declaration.id,
            context_data: {
              tools_count: declaration.tools_used.length,
              violation_count: validationResult.violations.length,
              aggregated_risk: validationResult.aggregated_risk
            },
            workspace_id: context.workspace_id,
            enterprise_id: declaration.enterprise_id
          }
        }
      );

      if (inboxError) {
        console.error('Error routing to inbox:', inboxError);
      } else {
        console.log('Violation routed to inbox:', inboxResponse);
      }
    } catch (error) {
      console.error('Failed to route violation to inbox:', error);
      // Don't throw - this is not critical to declaration success
    }
  }

  /**
   * Private helper: Generate violation summary HTML
   */
  private generateViolationSummaryHtml(
    declaration: any,
    validationResult: any
  ): string {
    const violationsList = validationResult.violations
      .map((v: any) => `<li><strong>${v.tool_name}</strong>: ${v.reason}</li>`)
      .join('');

    return `
      <div>
        <p><strong>File:</strong> ${declaration.file_name || 'N/A'}</p>
        <p><strong>File Hash:</strong> <code>${declaration.file_hash.substring(0, 16)}...</code></p>
        <p><strong>Partner:</strong> ${declaration.partner_id}</p>
        <p><strong>Risk Tier:</strong> <span class="badge-${validationResult.aggregated_risk.toLowerCase()}">${validationResult.aggregated_risk}</span></p>
        <h4>Policy Violations (${validationResult.violations.length}):</h4>
        <ul>
          ${violationsList}
        </ul>
        <p>This asset cannot be accepted until violations are resolved.</p>
      </div>
    `;
  }

  /**
   * Private helper: Calculate stats directly from table
   */
  private async calculateStatsDirectly(enterpriseId: string): Promise<DeclarationStats> {
    const { data, error } = await this.supabase
      .from('asset_declarations')
      .select('validation_status, file_type, aggregated_risk_tier, file_name, declared_at')
      .eq('enterprise_id', enterpriseId);

    if (error) {
      console.error('Error calculating stats directly:', error);
      return {
        total_declarations: 0,
        compliant_count: 0,
        violation_count: 0,
        by_file_type: {},
        by_risk_tier: {},
        recent_violations: []
      };
    }

    const declarations = data || [];
    const byFileType: Record<string, number> = {};
    const byRiskTier: Record<string, number> = {};
    const violations = declarations.filter(d => d.validation_status === 'violation');

    declarations.forEach(d => {
      if (d.file_type) {
        byFileType[d.file_type] = (byFileType[d.file_type] || 0) + 1;
      }
      if (d.aggregated_risk_tier) {
        byRiskTier[d.aggregated_risk_tier] = (byRiskTier[d.aggregated_risk_tier] || 0) + 1;
      }
    });

    return {
      total_declarations: declarations.length,
      compliant_count: declarations.filter(d => d.validation_status === 'compliant').length,
      violation_count: violations.length,
      by_file_type: byFileType,
      by_risk_tier: byRiskTier,
      recent_violations: violations.slice(0, 10).map(v => ({
        declaration_id: v.id,
        file_name: v.file_name || v.file_hash.substring(0, 8),
        violation_count: 1,
        declared_at: v.declared_at
      }))
    };
  }

  /**
   * Private helper: Log to agent_activities
   */
  private async logAgentActivity(activity: {
    action: string;
    status: string;
    details: any;
    enterprise_id: string;
  }): Promise<void> {
    try {
      await this.supabase
        .from('agent_activities')
        .insert({
          agent: 'asset-declaration',
          action: activity.action,
          status: activity.status,
          details: activity.details,
          enterprise_id: activity.enterprise_id
        });
    } catch (error) {
      console.error('Error logging agent activity:', error);
      // Don't throw - logging failure shouldn't break the flow
    }
  }
}
