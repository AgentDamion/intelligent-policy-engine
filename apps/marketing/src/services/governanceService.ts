import { supabase } from '@/integrations/supabase/client';
import { 
  GovernanceEntity, 
  GovernanceAlert,
  calculateGovernanceHealth 
} from '@/utils/governanceCalculations';

export interface SupabaseGovernanceEntity {
  id: string;
  name: string;
  type: 'client' | 'partner' | 'tool' | 'policy';
  enterprise_id: string;
  workspace_id: string | null;
  compliance_score: number;
  tool_approval_score: number;
  audit_completeness_score: number;
  open_risks: number;
  owner_name: string | null;
  region: string | null;
  last_update: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface SupabaseGovernanceAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string | null;
  entity_name: string | null;
  entity_type: 'client' | 'partner' | 'tool' | 'policy' | null;
  entity_id: string | null;
  enterprise_id: string;
  workspace_id: string | null;
  days_open: number;
  assignee_name: string | null;
  category: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export class GovernanceService {
  static async fetchGovernanceEntities(): Promise<GovernanceEntity[]> {
    const { data: entities, error } = await supabase
      .from('governance_entities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching governance entities:', error);
      throw error;
    }

    return entities?.map(this.mapSupabaseEntityToGovernanceEntity) || [];
  }

  static async fetchGovernanceAlerts(): Promise<GovernanceAlert[]> {
    const { data: alerts, error } = await supabase
      .from('governance_alerts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching governance alerts:', error);
      throw error;
    }

    return alerts?.map(this.mapSupabaseAlertToGovernanceAlert) || [];
  }

  static async createGovernanceEntity(
    entity: Omit<SupabaseGovernanceEntity, 'id' | 'created_at' | 'updated_at' | 'last_update'>
  ): Promise<GovernanceEntity> {
    const { data, error } = await supabase
      .from('governance_entities')
      .insert(entity)
      .select()
      .single();

    if (error) {
      console.error('Error creating governance entity:', error);
      throw error;
    }

    return this.mapSupabaseEntityToGovernanceEntity(data);
  }

  static async createGovernanceAlert(
    alert: Omit<SupabaseGovernanceAlert, 'id' | 'created_at' | 'updated_at'>
  ): Promise<GovernanceAlert> {
    const { data, error } = await supabase
      .from('governance_alerts')
      .insert(alert)
      .select()
      .single();

    if (error) {
      console.error('Error creating governance alert:', error);
      throw error;
    }

    return this.mapSupabaseAlertToGovernanceAlert(data);
  }

  static async updateGovernanceEntity(
    id: string,
    updates: Partial<SupabaseGovernanceEntity>
  ): Promise<GovernanceEntity> {
    const { data, error } = await supabase
      .from('governance_entities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating governance entity:', error);
      throw error;
    }

    return this.mapSupabaseEntityToGovernanceEntity(data);
  }

  static async resolveGovernanceAlert(id: string): Promise<GovernanceAlert> {
    const { data, error } = await supabase
      .from('governance_alerts')
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error resolving governance alert:', error);
      throw error;
    }

    return this.mapSupabaseAlertToGovernanceAlert(data);
  }

  private static mapSupabaseEntityToGovernanceEntity(entity: any): GovernanceEntity {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      compliance: entity.compliance_score,
      toolApproval: entity.tool_approval_score,
      auditCompleteness: entity.audit_completeness_score,
      ghi: calculateGovernanceHealth({
        compliance: entity.compliance_score,
        toolApproval: entity.tool_approval_score,
        auditCompleteness: entity.audit_completeness_score
      }),
      openRisks: entity.open_risks,
      lastUpdate: entity.last_update,
      owner: entity.owner_name || undefined,
      region: entity.region || undefined
    };
  }

  private static mapSupabaseAlertToGovernanceAlert(alert: any): GovernanceAlert {
    return {
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      description: alert.description || '',
      entity: alert.entity_name || '',
      entityType: alert.entity_type || 'client',
      daysOpen: alert.days_open,
      assignee: alert.assignee_name || undefined,
      category: alert.category || ''
    };
  }
}