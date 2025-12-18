/**
 * Audit Trail Service (Updated for existing audit_events table)
 * Handles comprehensive audit logging for compliance and traceability
 */
import { AuditTrail, AuditTrailSchema } from '@/contracts';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export class AuditService {
  
  /**
   * Logs RFP-specific audit events
   */
  static async logRFPEvent(
    eventType: 'RFP_DISTRIBUTED' | 'RFP_RESPONSE_SUBMITTED' | 'RFP_COMPLIANCE_SCORED',
    entityId: string,
    metadata: Record<string, any>,
    workspaceId?: string,
    enterpriseId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_events')
        .insert({
          event_type: eventType,
          entity_type: eventType.includes('RESPONSE') ? 'submission' : 'policy_version',
          entity_id: entityId,
          workspace_id: workspaceId,
          enterprise_id: enterpriseId,
          details: metadata,
        });

      if (error) {
        console.error('Failed to log RFP event:', error);
        throw new Error(`RFP event logging failed: ${error.message}`);
      }
    } catch (error) {
      console.error('RFP audit logging error:', error);
      throw error;
    }
  }

  /**
   * Retrieves RFP audit events for governance evidence
   */
  static async getRFPAuditTrail(
    enterpriseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .in('event_type', ['RFP_DISTRIBUTED', 'RFP_RESPONSE_SUBMITTED', 'RFP_COMPLIANCE_SCORED'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch RFP audit trail: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to retrieve RFP audit trail:', error);
      return [];
    }
  }

  /**
   * Writes a complete audit trail for a processing session
   */
  static async writeAuditTrail(auditData: Omit<AuditTrail, 'traceId' | 'createdAt'>): Promise<string> {
    const traceId = uuidv4();
    
    const auditTrail: AuditTrail = {
      ...auditData,
      traceId,
      createdAt: new Date().toISOString(),
    };

    // Validate against schema
    const validatedAudit = AuditTrailSchema.parse(auditTrail);

    try {
      // Store in existing audit_events table with new fields
      const { error } = await supabase
        .from('audit_events')
        .insert({
          event_type: 'POLICY_PROCESSING',
          user_id: null,
          enterprise_id: validatedAudit.enterpriseId,
          details: validatedAudit as any,
        });

      if (error) {
        console.error('Failed to write audit trail:', error);
        throw new Error(`Audit trail write failed: ${error.message}`);
      }

      console.log(`✅ Audit trail written with trace ID: ${traceId}`);
      return traceId;
      
    } catch (error) {
      console.error('Audit service error:', error);
      throw error;
    }
  }

  /**
   * Retrieves audit trail by trace ID
   */
  static async getAuditTrail(traceId: string): Promise<AuditTrail | null> {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('details')
        .eq('event_type', 'POLICY_PROCESSING')
        .eq('details->>traceId', traceId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.details as AuditTrail;
      
    } catch (error) {
      console.error('Failed to retrieve audit trail:', error);
      return null;
    }
  }

  /**
   * Gets audit trails for an enterprise within a date range
   */
  static async getEnterpriseAuditTrails(
    enterpriseId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<AuditTrail[]> {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('details')
        .eq('enterprise_id', enterpriseId)
        .eq('event_type', 'POLICY_PROCESSING')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch audit trails: ${error.message}`);
      }

      return (data || []).map(row => row.details as AuditTrail);
      
    } catch (error) {
      console.error('Failed to retrieve enterprise audit trails:', error);
      return [];
    }
  }

  /**
   * Exports audit trails for compliance reporting
   */
  static async exportAuditTrails(
    enterpriseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ trails: AuditTrail[]; summary: any }> {
    const trails = await this.getEnterpriseAuditTrails(enterpriseId, startDate, endDate, 1000);
    
    const summary = {
      totalTrails: trails.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      outcomes: trails.reduce((acc, trail) => {
        const outcome = trail.validationResult.finalOutcome;
        acc[outcome] = (acc[outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageConfidence: trails.reduce((sum, trail) => 
        sum + trail.validationResult.finalConfidence, 0) / trails.length || 0,
      parsingMethods: trails.reduce((acc, trail) => {
        const method = trail.parsedDoc.parsingMethod;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return { trails, summary };
  }
}