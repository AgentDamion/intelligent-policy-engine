// =============================================================================
// SHARED UTILITY: Evidence Collector
// PURPOSE: Query vera.events, governance_actions, and policies for compliance evidence
// =============================================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface EvidenceItem {
  type: 'audit_trail' | 'policy_config' | 'attestation' | 'document' | 'metadata' | 'workflow';
  source: string;
  count: number;
  sample_refs: string[];
  meets_requirement: boolean;
  details?: any;
}

export interface EvidenceMap {
  evidence_type: string;
  evidence_source: string;
  evidence_field?: string;
  evidence_filter?: any;
  validation_rule?: string;
  validation_params?: any;
  coverage_contribution: number;
  is_required: boolean;
}

export interface RequirementEvidence {
  requirement_id: string;
  evidence_items: EvidenceItem[];
  meets_requirement: boolean;
  coverage_percentage: number;
}

/**
 * Collect evidence from vera.events (audit trail)
 */
export async function collectAuditTrailEvidence(
  supabase: SupabaseClient,
  workspaceId: string,
  evidenceMap: EvidenceMap,
  bundleId?: string
): Promise<EvidenceItem> {
  let query = supabase
    .from('vera.events')
    .select('id, event_type, timestamp, actor_id, details', { count: 'exact' });

  // Apply filters
  if (bundleId) {
    query = query.eq('bundle_id', bundleId);
  }

  if (evidenceMap.evidence_filter) {
    Object.entries(evidenceMap.evidence_filter).forEach(([key, value]) => {
      if (evidenceMap.evidence_field && key === evidenceMap.evidence_field) {
        query = query.eq(key, value);
      } else {
        query = query.eq(key, value);
      }
    });
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error collecting audit trail evidence:', error);
    return {
      type: 'audit_trail',
      source: 'vera.events',
      count: 0,
      sample_refs: [],
      meets_requirement: false
    };
  }

  const sampleRefs = (data || []).slice(0, 5).map(e => e.id);
  const meetsRequirement = validateEvidence(count || 0, evidenceMap);

  return {
    type: 'audit_trail',
    source: 'vera.events',
    count: count || 0,
    sample_refs: sampleRefs,
    meets_requirement: meetsRequirement,
    details: {
      filter_applied: evidenceMap.evidence_filter,
      validation_rule: evidenceMap.validation_rule
    }
  };
}

/**
 * Collect evidence from governance_actions (workflow)
 */
export async function collectGovernanceEvidence(
  supabase: SupabaseClient,
  workspaceId: string,
  evidenceMap: EvidenceMap,
  bundleId?: string
): Promise<EvidenceItem> {
  let query = supabase
    .from('governance_actions')
    .select('id, action_type, action_category, created_at, actor_id', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  if (bundleId) {
    query = query.eq('bundle_id', bundleId);
  }

  if (evidenceMap.evidence_filter) {
    Object.entries(evidenceMap.evidence_filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error collecting governance evidence:', error);
    return {
      type: 'workflow',
      source: 'governance_actions',
      count: 0,
      sample_refs: [],
      meets_requirement: false
    };
  }

  const sampleRefs = (data || []).slice(0, 5).map(a => a.id);
  const meetsRequirement = validateEvidence(count || 0, evidenceMap);

  return {
    type: 'workflow',
    source: 'governance_actions',
    count: count || 0,
    sample_refs: sampleRefs,
    meets_requirement: meetsRequirement
  };
}

/**
 * Collect evidence from policies (policy configuration)
 */
export async function collectPolicyEvidence(
  supabase: SupabaseClient,
  workspaceId: string,
  evidenceMap: EvidenceMap
): Promise<EvidenceItem> {
  // Get workspace's enterprise_id
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('enterprise_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace) {
    return {
      type: 'policy_config',
      source: 'policies',
      count: 0,
      sample_refs: [],
      meets_requirement: false
    };
  }

  let query = supabase
    .from('policies')
    .select('id, name, rules, pom', { count: 'exact' })
    .eq('enterprise_id', workspace.enterprise_id);

  if (evidenceMap.evidence_field) {
    // Check if policy has the required field/rule
    // This is simplified - in production, would need to parse JSONB
    query = query.not(evidenceMap.evidence_field, 'is', null);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error collecting policy evidence:', error);
    return {
      type: 'policy_config',
      source: 'policies',
      count: 0,
      sample_refs: [],
      meets_requirement: false
    };
  }

  const sampleRefs = (data || []).slice(0, 5).map(p => p.id);
  const meetsRequirement = validateEvidence(count || 0, evidenceMap);

  return {
    type: 'policy_config',
    source: 'policies',
    count: count || 0,
    sample_refs: sampleRefs,
    meets_requirement: meetsRequirement
  };
}

/**
 * Collect evidence from proof_bundle_attestations
 */
export async function collectAttestationEvidence(
  supabase: SupabaseClient,
  bundleId: string,
  evidenceMap: EvidenceMap
): Promise<EvidenceItem> {
  let query = supabase
    .from('proof_bundle_attestations')
    .select('id, attestation_type, attested_at, attested_by', { count: 'exact' })
    .eq('bundle_id', bundleId);

  if (evidenceMap.evidence_filter) {
    Object.entries(evidenceMap.evidence_filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (evidenceMap.evidence_field) {
    query = query.eq(evidenceMap.evidence_field, true);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error collecting attestation evidence:', error);
    return {
      type: 'attestation',
      source: 'proof_bundle_attestations',
      count: 0,
      sample_refs: [],
      meets_requirement: false
    };
  }

  const sampleRefs = (data || []).slice(0, 5).map(a => a.id);
  const meetsRequirement = validateEvidence(count || 0, evidenceMap);

  return {
    type: 'attestation',
    source: 'proof_bundle_attestations',
    count: count || 0,
    sample_refs: sampleRefs,
    meets_requirement: meetsRequirement
  };
}

/**
 * Validate evidence against requirement criteria
 */
function validateEvidence(count: number, evidenceMap: EvidenceMap): boolean {
  if (!evidenceMap.validation_rule) {
    return count > 0;
  }

  switch (evidenceMap.validation_rule) {
    case 'exists':
      return count > 0;
    
    case 'count_gte':
      const minCount = evidenceMap.validation_params?.min_count || 1;
      return count >= minCount;
    
    case 'value_matches':
      // Would need to check actual values, not just count
      return count > 0;
    
    case 'date_within':
      // Would need to check date ranges
      return count > 0;
    
    default:
      return count > 0;
  }
}

/**
 * Collect all evidence for a requirement
 */
export async function collectRequirementEvidence(
  supabase: SupabaseClient,
  workspaceId: string,
  requirementId: string,
  bundleId?: string
): Promise<RequirementEvidence> {
  // Get evidence maps for this requirement
  const { data: evidenceMaps, error } = await supabase
    .from('requirement_evidence_map')
    .select('*')
    .eq('requirement_id', requirementId);

  if (error || !evidenceMaps || evidenceMaps.length === 0) {
    return {
      requirement_id: requirementId,
      evidence_items: [],
      meets_requirement: false,
      coverage_percentage: 0
    };
  }

  const evidenceItems: EvidenceItem[] = [];

  for (const evidenceMap of evidenceMaps) {
    let item: EvidenceItem;

    switch (evidenceMap.evidence_source) {
      case 'vera.events':
        item = await collectAuditTrailEvidence(supabase, workspaceId, evidenceMap, bundleId);
        break;
      
      case 'governance_actions':
        item = await collectGovernanceEvidence(supabase, workspaceId, evidenceMap, bundleId);
        break;
      
      case 'policies':
        item = await collectPolicyEvidence(supabase, workspaceId, evidenceMap);
        break;
      
      case 'proof_bundle_attestations':
        if (bundleId) {
          item = await collectAttestationEvidence(supabase, bundleId, evidenceMap);
        } else {
          item = {
            type: 'attestation',
            source: 'proof_bundle_attestations',
            count: 0,
            sample_refs: [],
            meets_requirement: false
          };
        }
        break;
      
      default:
        item = {
          type: 'metadata',
          source: evidenceMap.evidence_source,
          count: 0,
          sample_refs: [],
          meets_requirement: false
        };
    }

    evidenceItems.push(item);
  }

  // Calculate coverage percentage
  const requiredItems = evidenceItems.filter(item => {
    const map = evidenceMaps.find(m => m.evidence_source === item.source);
    return map?.is_required;
  });

  const metRequired = requiredItems.filter(item => item.meets_requirement).length;
  const coveragePercentage = requiredItems.length > 0
    ? (metRequired / requiredItems.length) * 100
    : 0;

  const meetsRequirement = requiredItems.every(item => item.meets_requirement);

  return {
    requirement_id: requirementId,
    evidence_items: evidenceItems,
    meets_requirement: meetsRequirement,
    coverage_percentage: coveragePercentage
  };
}

