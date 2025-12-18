import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Seed foundation data for GlobalMed Therapeutics
 * - Enterprise
 * - 3 Workspaces (ONCAVEX, HEARTGUARD, GLUCOSTABLE)
 * - 2 Partners (IPG Health, Omnicom Health)
 * - Partner API keys
 */
export async function seedGlobalMedFoundation() {
  console.log('[GlobalMed] Starting foundation seeding...');

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Check if GlobalMed already exists
    const { data: existingEnterprise, error: checkError } = await supabase
      .from('enterprises')
      .select('id')
      .eq('name', 'GlobalMed Therapeutics')
      .maybeSingle();
    
    if (checkError) throw checkError;

    if (existingEnterprise) {
      console.log('[GlobalMed] Foundation already exists, skipping...');
      const workspaces = await getGlobalMedWorkspaces(existingEnterprise.id);
      return {
        enterpriseId: existingEnterprise.id,
        workspaceIds: workspaces,
        partnerIds: await getGlobalMedPartners(existingEnterprise.id)
      };
    }

    // 1. Create Enterprise
    const { data: enterprise, error: enterpriseError } = await supabase
      .from('enterprises')
      .insert({
        name: 'GlobalMed Therapeutics',
        subscription_tier: 'enterprise',
        enterprise_type: 'pharmaceutical',
        domain: 'globalmed.com'
      })
      .select()
      .single();

    if (enterpriseError) throw enterpriseError;
    console.log('[GlobalMed] Enterprise created:', enterprise.id);

    // 2. Link current user as owner
    const { error: memberError } = await supabase
      .from('enterprise_members')
      .insert({
        enterprise_id: enterprise.id,
        user_id: user.id,
        role: 'owner'
      });

    if (memberError) throw memberError;

    // 3. Create Workspaces
    const workspaces = [
      {
        enterprise_name: 'GlobalMed Therapeutics',
        enterprise_id: enterprise.id,
        name: 'ONCAVEX™',
        policy_scope: 'brand',
        workspace_type: 'oncology'
      },
      {
        enterprise_name: 'GlobalMed Therapeutics',
        enterprise_id: enterprise.id,
        name: 'HEARTGUARD®',
        policy_scope: 'brand',
        workspace_type: 'cardiology'
      },
      {
        enterprise_name: 'GlobalMed Therapeutics',
        enterprise_id: enterprise.id,
        name: 'GLUCOSTABLE®',
        policy_scope: 'brand',
        workspace_type: 'diabetes'
      }
    ];

    const workspaceIds: Record<string, string> = {};
    
    for (const ws of workspaces) {
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert(ws)
        .select()
        .single();

      if (wsError) throw wsError;

      const brandKey = ws.name.toLowerCase().replace(/[^a-z]/g, '');
      workspaceIds[brandKey] = workspace.id;

      // Add user as workspace member
      await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'admin'
        });
    }

    console.log('[GlobalMed] Workspaces created:', workspaceIds);

    // 4. Create Partners (simulated - no actual partner_api_keys without partners table)
    // Note: We'll simulate partner data in middleware_requests metadata
    const partnerIds = {
      ipg_health: 'ipg-health-partner-001',
      omnicom_health: 'omnicom-health-partner-001'
    };

    console.log('[GlobalMed] Foundation seeding complete');
    
    return {
      enterpriseId: enterprise.id,
      workspaceIds,
      partnerIds
    };
  } catch (error) {
    console.error('[GlobalMed] Error seeding foundation:', error);
    toast.error('Failed to seed GlobalMed foundation data');
    throw error;
  }
}

async function getGlobalMedWorkspaces(enterpriseId: string) {
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('enterprise_id', enterpriseId);

  const workspaceIds: Record<string, string> = {};
  workspaces?.forEach(ws => {
    const brandKey = ws.name.toLowerCase().replace(/[^a-z]/g, '');
    workspaceIds[brandKey] = ws.id;
  });

  return workspaceIds;
}

async function getGlobalMedPartners(enterpriseId: string) {
  // Simulated partner IDs
  return {
    ipg_health: 'ipg-health-partner-001',
    omnicom_health: 'omnicom-health-partner-001'
  };
}
