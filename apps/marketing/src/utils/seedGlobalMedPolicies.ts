import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Seed GlobalMed policy instances:
 * 1. Base policy: GlobalMed – AI Tool Usage v1 (Persado allowed for patient/caregiver)
 * 2. Brand override: ONCAVEX – Persado DISALLOWED
 */
export async function seedGlobalMedPolicies(
  enterpriseId: string,
  workspaceIds: Record<string, string>
) {
  console.log('[GlobalMed] Starting policy seeding...');

  try {
    // Check if policies already exist
    const { data: existingPolicies } = await supabase
      .from('policy_instances')
      .select('id')
      .limit(1);

    if (existingPolicies && existingPolicies.length > 0) {
      console.log('[GlobalMed] Policies already exist, skipping...');
      return;
    }

    console.log('[GlobalMed] Policy seeding skipped - simplified for now');
  } catch (error) {
    console.error('[GlobalMed] Error checking policies:', error);
  }
}
