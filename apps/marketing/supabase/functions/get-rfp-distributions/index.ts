import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body and resolve workspace identifier
    let requestBody: any = null;
    try {
      requestBody = await req.json();
    } catch (_e) {
      // no body
    }

    // Accept either workspace_id (UUID) or workspace (slug/name/uuid)
    let workspace_id = requestBody?.workspace_id as string | undefined;
    const workspace = requestBody?.workspace as string | undefined;

    // Resolve non-UUID workspace identifiers
    const isUuid = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

    if (!workspace_id && workspace) {
      if (isUuid(workspace)) {
        workspace_id = workspace;
      } else {
        const { data: wsByName } = await supabase
          .from('workspaces')
          .select('id')
          .eq('name', workspace)
          .maybeSingle();

        if (wsByName?.id) {
          workspace_id = wsByName.id;
        } else {
          const { data: wsByScope } = await supabase
            .from('workspaces')
            .select('id')
            .eq('policy_scope', workspace)
            .maybeSingle();
          if (wsByScope?.id) {
            workspace_id = wsByScope.id;
          }
        }
      }
    }

    if (!workspace_id) {
      throw new Error('workspace or workspace_id is required');
    }

    // Optional authentication - allow both authenticated and demo access
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      try {
        const { data: authData } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        user = authData?.user;
      } catch (e) {
        console.log('Auth check failed, proceeding without user:', e);
      }
    }

    // For demo/development: allow access if workspace exists
    // In production, you'd want to verify user has access to this workspace
    if (user) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        console.log('User not a member of workspace, allowing demo access');
      }
    }

    // Get RFP distributions for this workspace
    const { data: distributions, error: distributionsError } = await supabase
      .from('policy_distributions')
      .select(`
        id,
        policy_version_id,
        target_workspace_id,
        status,
        created_at,
        response_deadline,
        metadata,
        policy_versions!inner (
          id,
          version_number,
          rfp_template_data,
          policies!inner (
            id,
            title,
            description,
            enterprises (
              id,
              name
            )
          )
        )
      `)
      .eq('target_workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (distributionsError) {
      console.error('Error fetching distributions:', distributionsError);
      throw distributionsError;
    }

    // Get lane statistics for each distribution
    const distributionIds = distributions.map(d => d.id);
    let laneStats: any[] = [];
    let laneStatsError: any = null;
    if (distributionIds.length > 0) {
      const { data, error } = await supabase
        .from('rfp_question_library')
        .select('distribution_id, question_lane')
        .in('distribution_id', distributionIds);
      laneStats = data || [];
      laneStatsError = error;
    }
    if (laneStatsError) {
      console.error('Error fetching lane statistics:', laneStatsError);
    }

    // Aggregate lane statistics by distribution
    const laneStatsByDistribution = (laneStats || []).reduce((acc, row) => {
      if (!acc[row.distribution_id]) {
        acc[row.distribution_id] = {
          governance_compliance: 0,
          security_access: 0,
          integration_scalability: 0,
          business_ops: 0
        };
      }
      if (row.question_lane) {
        acc[row.distribution_id][row.question_lane] = (acc[row.distribution_id][row.question_lane] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Check for existing submissions
    let submissions: any[] = [];
    let submissionsError: any = null;
    if (distributions.length > 0) {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, policy_version_id, status, compliance_score, submitted_at')
        .eq('workspace_id', workspace_id)
        .eq('submission_type', 'rfp_response')
        .in('policy_version_id', distributions.map(d => d.policy_version_id));
      submissions = data || [];
      submissionsError = error;
    }
    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    // Enrich distributions with submission status and lane statistics
    const enrichedDistributions = distributions.map(dist => {
      const submission = submissions?.find(s => s.policy_version_id === dist.policy_version_id);
      const laneStatistics = laneStatsByDistribution[dist.id] || {
        governance_compliance: 0,
        security_access: 0,
        integration_scalability: 0,
        business_ops: 0
      };
      return {
        ...dist,
        distributed_at: dist.created_at,
        submission_status: submission?.status || 'not_started',
        submission_id: submission?.id,
        compliance_score: submission?.compliance_score,
        submitted_at: submission?.submitted_at,
        lane_statistics: laneStatistics
      };
    });

    return new Response(
      JSON.stringify({ distributions: enrichedDistributions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-rfp-distributions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});