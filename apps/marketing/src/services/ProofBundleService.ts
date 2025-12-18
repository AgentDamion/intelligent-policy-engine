import { supabase } from "@/integrations/supabase/client";

export interface ProofBundle {
  id: string;
  policy_instance_id: string;
  proof_hash: string;
  proof_signature: string;
  bundle_data: {
    policy_snapshot: any;
    approval_chain: any[];
    timestamp: string;
    cryptographic_seal: {
      algorithm: string;
      hash_method: string;
      signature_method: string;
    };
    metadata: {
      generated_by: string;
      generated_at: string;
      version: string;
    };
  };
  created_at: string;
  created_by: string | null;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  workspace_id: string | null;
  enterprise_id: string | null;
  details: any;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export class ProofBundleService {
  /**
   * Phase 3.B: Generate proof bound to EPS (not raw POM)
   */
  static async generateProof(policyInstanceId: string) {
    try {
      // Fetch policy instance with current EPS pointer
      const { data: instance, error: instErr } = await supabase
        .from('policy_instances')
        .select('current_eps_id, enterprise_id')
        .eq('id', policyInstanceId)
        .single();

      if (instErr || !instance?.current_eps_id) {
        throw new Error('Policy instance must have an active EPS to generate proof. Activate the policy first.');
      }

      // Load full EPS
      const { data: eps, error: epsErr } = await supabase
        .from('effective_policy_snapshots')
        .select('id, version, content_hash, activated_at, field_provenance')
        .eq('id', instance.current_eps_id)
        .single();

      if (epsErr) throw epsErr;

      // Use EPS hash as policy basis (already deterministic)
      const policyBasisHash = eps.content_hash;

      // Generate proof signature (simplified - use real crypto in production)
      const timestamp = new Date().toISOString();
      const signaturePayload = `${eps.id}:${eps.content_hash}:${timestamp}`;
      const encoder = new TextEncoder();
      const signatureBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(signaturePayload));
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return {
        proof_hash: policyBasisHash,
        proof_signature: signature,
        eps_id: eps.id,
        eps_hash: eps.content_hash,
        eps_version: eps.version,
        eps_activated_at: eps.activated_at,
        field_provenance_sample: Object.entries(eps.field_provenance || {}).slice(0, 10),
        generated_at: timestamp
      };
    } catch (error) {
      console.error('Error generating proof:', error);
      throw error;
    }
  }

  
  static async verifyProof(proofHash: string, bundleData: any): Promise<boolean> {
    try {
      // Client-side verification (simplified)
      const canonicalJson = JSON.stringify(bundleData, Object.keys(bundleData).sort());
      const encoder = new TextEncoder();
      const data = encoder.encode(canonicalJson);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return computedHash === proofHash;
    } catch (error) {
      console.error('Error verifying proof:', error);
      return false;
    }
  }
}

export class AuditService {
  static async logPolicyEvent(
    eventType: string,
    entityId: string,
    details: any,
    enterpriseId?: string,
    workspaceId?: string
  ) {
    try {
      const { error } = await supabase
        .from('audit_events')
        .insert({
          event_type: eventType,
          entity_type: 'policy_instance',
          entity_id: entityId,
          enterprise_id: enterpriseId,
          workspace_id: workspaceId,
          details
        });

      if (error) {
        console.error('Error logging audit event:', error);
      }
    } catch (error) {
      console.error('Error in logPolicyEvent:', error);
    }
  }

  static async getPolicyAuditTrail(policyInstanceId: string): Promise<AuditEvent[]> {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('entity_id', policyInstanceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }

    return data as AuditEvent[];
  }

  static async getEnterpriseAuditTrail(
    enterpriseId: string,
    filters?: {
      event_type?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<AuditEvent[]> {
    let query = supabase
      .from('audit_events')
      .select('*')
      .eq('enterprise_id', enterpriseId);

    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching enterprise audit trail:', error);
      throw error;
    }

    return data as AuditEvent[];
  }

  static async exportAuditTrail(
    enterpriseId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const events = await this.getEnterpriseAuditTrail(enterpriseId);

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      // CSV export
      const headers = ['Timestamp', 'Event Type', 'Entity Type', 'Entity ID', 'User ID', 'Details'];
      const rows = events.map(event => [
        event.created_at,
        event.event_type,
        event.entity_type,
        event.entity_id,
        event.user_id || 'System',
        JSON.stringify(event.details)
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
    }
  }
}
