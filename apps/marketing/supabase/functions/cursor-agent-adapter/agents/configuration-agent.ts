import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

/**
 * Configuration Agent
 * 
 * Manages the Asset Registry (models, data sources, partner credentials)
 * and enforces metadata consistency, validation, and dependency tracking.
 */

export interface ModelAsset {
  id: string;
  name: string;
  provider: string;
  category: string;
  risk_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data_sensitivity_used?: string[];
  jurisdictions?: string[];
  deployment_status?: 'draft' | 'active' | 'deprecated' | 'archived';
  version?: string;
  description?: string;
}

export interface DataSourceAsset {
  id: string;
  name: string;
  source_type: 'database' | 'api' | 'file_storage' | 'data_warehouse' | 'third_party';
  description?: string;
  sensitivity_level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'PHI' | 'PII';
  jurisdictions: string[];
  enterprise_id: string;
  deployment_status: 'active' | 'deprecated' | 'archived';
}

export interface MetadataValidationResult {
  valid: boolean;
  conflicts: Array<{
    conflict_type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affected_policies?: string[];
  }>;
  suggestions: string[];
}

export interface DependencyMapping {
  model_id: string;
  dependent_policies: Array<{
    policy_id: string;
    policy_name: string;
    version: number;
  }>;
  connected_data_sources: Array<{
    data_source_id: string;
    data_source_name: string;
    access_type: 'read' | 'write' | 'read_write';
  }>;
}

export interface PartnerKeyConfig {
  id: string;
  key_prefix: string;
  partner_id: string;
  enterprise_id: string;
  rate_limit_tier: 'budget' | 'standard' | 'premium' | 'enterprise';
  expires_at: string;
  is_active: boolean;
  created_at: string;
  name?: string;
}

export interface GenerateKeyResult {
  raw_key: string;
  key_config: PartnerKeyConfig;
  warning: string;
}

export interface ExpirationAlert {
  alert_id: string;
  type: 'critical' | 'warning';
  category: 'credential_expiration';
  title: string;
  description: string;
  days_remaining: number;
  key_id: string;
  key_prefix: string;
  partner_id: string;
  partner_name?: string;
  action_url: string;
}

export class ConfigurationAgent {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Process agent requests
   */
  async process(input: any, context: Record<string, unknown>): Promise<any> {
    const { action, payload } = input;

    switch (action) {
      case 'validate_model':
        return await this.validateModel(payload);
      case 'validate_data_source':
        return await this.validateDataSource(payload);
      case 'check_metadata_consistency':
        return await this.checkMetadataConsistency(payload);
      case 'get_dependencies':
        return await this.getDependencyMapping(payload);
      case 'suggest_tags':
        return await this.suggestTags(payload);
      case 'generate_partner_key':
        return await this.generatePartnerKey(payload, context);
      case 'check_key_expiration':
        return await this.checkKeyExpiration(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Validate model registration
   */
  private async validateModel(model: Partial<ModelAsset>): Promise<MetadataValidationResult> {
    const conflicts: MetadataValidationResult['conflicts'] = [];
    const suggestions: string[] = [];

    // FR-CA-1.1: Validate mandatory fields
    if (!model.risk_tier) {
      conflicts.push({
        conflict_type: 'missing_risk_tier',
        severity: 'critical',
        message: 'Risk tier is mandatory for all models'
      });
    }

    if (!model.data_sensitivity_used || model.data_sensitivity_used.length === 0) {
      conflicts.push({
        conflict_type: 'missing_data_sensitivity',
        severity: 'warning',
        message: 'Data sensitivity classification is recommended'
      });
      suggestions.push('Consider adding data sensitivity tags based on the model\'s purpose');
    }

    // FR-CA-1.2: Validate PHI/HIPAA consistency
    if (model.data_sensitivity_used?.includes('PHI') && !model.jurisdictions?.includes('HIPAA')) {
      conflicts.push({
        conflict_type: 'phi_without_hipaa',
        severity: 'critical',
        message: 'Models processing PHI must include HIPAA jurisdiction'
      });
    }

    // FR-CA-3.1: Check risk-sensitivity alignment
    if (
      (model.risk_tier === 'HIGH' || model.risk_tier === 'CRITICAL') &&
      model.data_sensitivity_used?.some(s => ['PUBLIC', 'INTERNAL'].includes(s))
    ) {
      conflicts.push({
        conflict_type: 'risk_data_mismatch',
        severity: 'warning',
        message: `Model tagged as ${model.risk_tier} risk but using lower sensitivity data sources`
      });
    }

    return {
      valid: conflicts.filter(c => c.severity === 'critical').length === 0,
      conflicts,
      suggestions
    };
  }

  /**
   * Validate data source registration
   */
  private async validateDataSource(dataSource: Partial<DataSourceAsset>): Promise<MetadataValidationResult> {
    const conflicts: MetadataValidationResult['conflicts'] = [];
    const suggestions: string[] = [];

    // Validate mandatory sensitivity level
    if (!dataSource.sensitivity_level) {
      conflicts.push({
        conflict_type: 'missing_sensitivity',
        severity: 'critical',
        message: 'Sensitivity level is mandatory for all data sources'
      });
    }

    // FR-CA-1.2: Validate PHI + HIPAA requirement
    if (dataSource.sensitivity_level === 'PHI' && !dataSource.jurisdictions?.includes('HIPAA')) {
      conflicts.push({
        conflict_type: 'phi_without_hipaa',
        severity: 'critical',
        message: 'Data sources containing PHI must include HIPAA jurisdiction'
      });
    }

    // Validate jurisdictions are not empty
    if (!dataSource.jurisdictions || dataSource.jurisdictions.length === 0) {
      conflicts.push({
        conflict_type: 'missing_jurisdictions',
        severity: 'warning',
        message: 'Data sources should specify applicable jurisdictions for compliance tracking'
      });
      suggestions.push('Common jurisdictions: HIPAA (health data), GDPR (EU data), FDA_SaMD (regulated software)');
    }

    return {
      valid: conflicts.filter(c => c.severity === 'critical').length === 0,
      conflicts,
      suggestions
    };
  }

  /**
   * FR-CA-3.1: Check metadata consistency using database function
   */
  private async checkMetadataConsistency(params: { model_id: string }): Promise<MetadataValidationResult> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_model_metadata_consistency', { p_model_id: params.model_id });

      if (error) throw error;

      const conflicts = (data || []).map((conflict: any) => ({
        conflict_type: conflict.conflict_type,
        severity: conflict.severity as 'critical' | 'warning' | 'info',
        message: conflict.message,
        affected_policies: conflict.affected_policies || []
      }));

      return {
        valid: conflicts.filter(c => c.severity === 'critical').length === 0,
        conflicts,
        suggestions: []
      };
    } catch (error) {
      console.error('[ConfigurationAgent] Metadata consistency check failed:', error);
      throw error;
    }
  }

  /**
   * FR-CA-3.2: Get dependency mapping for a model
   */
  private async getDependencyMapping(params: { model_id: string }): Promise<DependencyMapping> {
    const model_id = params.model_id;

    // Get connected data sources
    const { data: dataSources, error: dsError } = await this.supabase
      .from('model_data_source_mappings')
      .select(`
        data_source_id,
        access_type,
        data_source_registry!inner(
          id,
          name
        )
      `)
      .eq('model_id', model_id);

    if (dsError) throw dsError;

    // Get dependent policies (simplified - would need actual policy linkage)
    const { data: policies, error: policyError } = await this.supabase
      .from('policy_instances')
      .select('id, name, current_eps_id')
      .eq('is_active', true);

    if (policyError) throw policyError;

    return {
      model_id,
      connected_data_sources: (dataSources || []).map(ds => ({
        data_source_id: ds.data_source_id,
        data_source_name: (ds.data_source_registry as any).name,
        access_type: ds.access_type
      })),
      dependent_policies: (policies || []).map(p => ({
        policy_id: p.id,
        policy_name: p.name,
        version: 1 // Would need to parse from EPS
      }))
    };
  }

  /**
   * FR-CA-3.3: Agentic guidance - suggest tags based on description
   */
  private async suggestTags(params: { description: string; asset_type: 'model' | 'data_source' }): Promise<{
    suggested_tags: {
      sensitivity?: string[];
      jurisdictions?: string[];
      risk_tier?: string;
    };
    reasoning: string;
  }> {
    const description = params.description.toLowerCase();
    const suggestions: any = {
      sensitivity: [],
      jurisdictions: [],
      risk_tier: undefined
    };
    let reasoning = '';

    // Pattern matching for PHI/PII
    if (description.includes('health') || description.includes('medical') || description.includes('patient') || description.includes('clinical')) {
      suggestions.sensitivity.push('PHI');
      suggestions.jurisdictions.push('HIPAA');
      if (description.includes('device') || description.includes('diagnostic')) {
        suggestions.jurisdictions.push('FDA_SaMD');
      }
      suggestions.risk_tier = 'CRITICAL';
      reasoning = 'Detected healthcare/clinical context. PHI handling requires HIPAA compliance and critical risk tier.';
    }

    // Pattern matching for personal data
    if (description.includes('email') || description.includes('name') || description.includes('address') || description.includes('personal')) {
      suggestions.sensitivity.push('PII');
      if (description.includes('eu') || description.includes('europe') || description.includes('gdpr')) {
        suggestions.jurisdictions.push('GDPR');
      }
      if (!suggestions.risk_tier) {
        suggestions.risk_tier = 'MEDIUM';
      }
      reasoning += ' Detected personal identifiable information. Recommend PII classification.';
    }

    // Pattern matching for trial/study data
    if (description.includes('trial') || description.includes('study') || description.includes('research')) {
      suggestions.sensitivity.push('PHI');
      suggestions.jurisdictions.push('FDA_SaMD', 'HIPAA');
      suggestions.risk_tier = 'HIGH';
      reasoning += ' Clinical trial/research data detected. Regulatory oversight required.';
    }

    // Default fallback
    if (suggestions.sensitivity.length === 0) {
      suggestions.sensitivity.push('INTERNAL');
      suggestions.risk_tier = 'LOW';
      reasoning = 'No sensitive data patterns detected. Defaulting to internal classification.';
    }

    return {
      suggested_tags: suggestions,
      reasoning
    };
  }

  /**
   * FR-CA-2.1: Generate a secure, time-bound partner API key
   */
  private async generatePartnerKey(params: {
    partner_id: string;
    enterprise_id: string;
    rate_limit_tier: 'budget' | 'standard' | 'premium' | 'enterprise';
    validity_days: number;
    name?: string;
  }, context: Record<string, unknown>): Promise<GenerateKeyResult> {
    // 1. Generate cryptographically secure key
    const raw_key = 'pak_live_' + crypto.randomUUID().replace(/-/g, '');
    const key_prefix = raw_key.substring(0, 12); // "pak_live_abc"
    
    // 2. Hash key using bcrypt (rounds=10 for security/performance balance)
    const key_hash = await bcrypt.hash(raw_key);
    
    // 3. Calculate expiration
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + params.validity_days);
    
    // 4. Insert into database
    const { data, error } = await this.supabase
      .from('partner_api_keys')
      .insert({
        partner_id: params.partner_id,
        enterprise_id: params.enterprise_id,
        key_hash,
        key_prefix,
        name: params.name || `API Key - ${new Date().toISOString().split('T')[0]}`,
        rate_limit_tier: params.rate_limit_tier,
        expires_at: expires_at.toISOString(),
        is_active: true,
        created_by: context.user_id as string || null
      })
      .select()
      .single();
      
    if (error) throw new Error(`Failed to create API key: ${error.message}`);
    
    return {
      raw_key, // ONLY returned once
      key_config: data as PartnerKeyConfig,
      warning: "CRITICAL: Save this key immediately. It cannot be retrieved again."
    };
  }

  /**
   * FR-CA-2.2: Check for expiring keys and generate alerts
   */
  private async checkKeyExpiration(params: {
    check_days_ahead: number;
    enterprise_id?: string;
  }): Promise<ExpirationAlert[]> {
    const threshold_date = new Date();
    threshold_date.setDate(threshold_date.getDate() + params.check_days_ahead);
    
    // 1. Build query
    let query = this.supabase
      .from('partner_api_keys')
      .select(`
        id,
        key_prefix,
        partner_id,
        enterprise_id,
        expires_at,
        name,
        enterprises!partner_api_keys_enterprise_id_fkey(name)
      `)
      .lt('expires_at', threshold_date.toISOString())
      .eq('is_active', true)
      .order('expires_at', { ascending: true });
      
    // Optional: filter by enterprise
    if (params.enterprise_id) {
      query = query.eq('enterprise_id', params.enterprise_id);
    }
    
    const { data: expiringKeys, error } = await query;
    
    if (error) {
      console.error('[ConfigurationAgent] Expiration check failed:', error);
      return [];
    }
    
    // 2. Generate alerts
    const alerts: ExpirationAlert[] = (expiringKeys || []).map(key => {
      const days_remaining = Math.ceil(
        (new Date(key.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      const severity = days_remaining <= 7 ? 'critical' : 'warning';
      
      return {
        alert_id: crypto.randomUUID(),
        type: severity,
        category: 'credential_expiration',
        title: `Partner API Key Expiring in ${days_remaining} Days`,
        description: `Key "${key.name}" (${key.key_prefix}...) for partner ${(key.enterprises as any)?.name || key.partner_id} requires renewal.`,
        days_remaining,
        key_id: key.id,
        key_prefix: key.key_prefix,
        partner_id: key.partner_id,
        partner_name: (key.enterprises as any)?.name,
        action_url: `/agentic?tab=configuration&view=credentials&key=${key.id}`
      };
    });
    
    // 3. Send alerts to Inbox for human review
    for (const alert of alerts) {
      try {
        await this.supabase.functions.invoke('cursor-agent-adapter', {
          body: {
            agent: 'inbox',
            action: 'create_task',
            payload: {
              source_agent: 'configuration',
              title: alert.title,
              summary_html: `
                <p>${alert.description}</p>
                <div class="mt-4 space-y-2">
                  <div><strong>Partner:</strong> ${alert.partner_name || alert.partner_id}</div>
                  <div><strong>Key Prefix:</strong> ${alert.key_prefix}...</div>
                  <div><strong>Days Remaining:</strong> <span class="font-bold ${alert.days_remaining <= 7 ? 'text-destructive' : 'text-warning'}">${alert.days_remaining}</span></div>
                  <div><strong>Action Required:</strong> Generate new key before expiration to maintain service continuity</div>
                </div>
              `,
              task_type: 'key_expiration',
              action_type: 'RENEW_KEY',
              action_payload: {
                key_id: alert.key_id,
                partner_id: alert.partner_id,
                validity_days: 365,
                name: `Renewed: ${alert.key_prefix}...`
              },
              severity: alert.type === 'critical' ? 'critical' : 'high',
              source_url: alert.action_url,
              source_entity_id: alert.key_id,
              context_data: {
                days_remaining: alert.days_remaining,
                key_prefix: alert.key_prefix,
                partner_name: alert.partner_name,
                expires_at: expiringKeys?.find(k => k.id === alert.key_id)?.expires_at
              },
              enterprise_id: expiringKeys?.find(k => k.id === alert.key_id)?.enterprise_id
            }
          }
        });
        console.log(`[ConfigurationAgent] Created inbox task for expiring key: ${alert.key_id}`);
      } catch (error) {
        console.error(`[ConfigurationAgent] Failed to create inbox task for key ${alert.key_id}:`, error);
        // Continue with other alerts even if one fails
      }
    }
    
    return alerts;
  }
}
