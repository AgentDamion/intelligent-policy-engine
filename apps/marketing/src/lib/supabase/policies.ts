import { supabase } from '@/integrations/supabase/client';
import type { AppPolicyListRow, AppToolPolicyClausesRow } from './rpc-types';

/**
 * Fetch all policies for an enterprise (tenant-isolated)
 * NOTE: Requires migration 20251003_app_policies_rpc.sql to be deployed
 */
export async function fetchPolicyListByEnterprise(enterpriseId: string): Promise<AppPolicyListRow[]> {
  const { data, error } = await supabase.rpc('app_policy_list' as any, {
    _enterprise_id: enterpriseId
  });
  
  if (error) throw error;
  return (data ?? []) as AppPolicyListRow[];
}

/**
 * Fetch tool → policy → clause relationships for an enterprise + specific tool
 * NOTE: Requires migration 20251003_app_policies_rpc.sql to be deployed
 */
export async function fetchToolPolicyClauses(enterpriseId: string, toolId: number): Promise<AppToolPolicyClausesRow[]> {
  const { data, error } = await supabase.rpc('app_tool_policy_clauses' as any, {
    _enterprise_id: enterpriseId,
    _tool_id: toolId
  });
  
  if (error) throw error;
  return (data ?? []) as AppToolPolicyClausesRow[];
}
