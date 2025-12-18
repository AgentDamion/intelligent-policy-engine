import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const DistributePolicySchema = z.object({
  policy_version_id: z.string().uuid(),
  workspace_ids: z.array(z.string().uuid()).optional(),
  partner_ids: z.array(z.string().uuid()).optional(),
  note: z.string().optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body = await req.json();
    const { policy_version_id, workspace_ids, partner_ids, note } = DistributePolicySchema.parse(body);

    console.log(`Distributing policy version ${policy_version_id}`);

    let distributions_created = 0;

    // Distribute to workspaces - using actual schema
    if (workspace_ids && workspace_ids.length > 0) {
      const workspaceDistributions = workspace_ids.map(workspace_id => ({
        policy_version_id,
        target_workspace_id: workspace_id, // Use correct column name
        note: note || null
      }));

      const { error: workspaceError, count } = await supabase
        .from('policy_distributions') // Use correct table name
        .insert(workspaceDistributions)
        .select();

      if (workspaceError) {
        console.error('Error distributing to workspaces:', workspaceError);
        throw new Error('Failed to distribute to workspaces');
      }

      distributions_created += count || 0;
    }

    // Check if this is an RFP distribution
    const { data: policyVersion } = await supabase
      .from('policy_versions')
      .select('rfp_metadata, policy_id')
      .eq('id', policy_version_id)
      .single();

    const isRFPDistribution = policyVersion?.rfp_metadata != null;

    // Log audit event with RFP distinction
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: isRFPDistribution ? 'RFP_DISTRIBUTED' : 'policy_distributed',
        entity_type: 'policy_version',
        entity_id: policy_version_id,
        metadata: {
          workspace_count: workspace_ids?.length || 0,
          partner_count: partner_ids?.length || 0,
          distributions_created,
          note,
          is_rfp: isRFPDistribution,
          rfp_metadata: policyVersion?.rfp_metadata || null
        }
      });

    if (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    // Update policy version status
    const { error: updateError } = await supabase
      .from('policy_versions')
      .update({ 
        status: 'published', // Use valid enum value
        distributed_at: new Date().toISOString()
      })
      .eq('id', policy_version_id);

    if (updateError) {
      console.error('Error updating policy version:', updateError);
    }

    const response = {
      policy_version_id,
      distributions_created
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in distribute_policy function:', error);
    
    const errorResponse = {
      error: (error as Error).message || 'Internal server error',
      details: error instanceof z.ZodError ? error.errors : undefined
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});