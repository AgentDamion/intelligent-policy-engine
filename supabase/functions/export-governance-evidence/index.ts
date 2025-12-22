import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { enterprise_id, start_date, end_date, policy_version_ids } = await req.json();

    console.log(`Exporting governance evidence for enterprise ${enterprise_id}`);

    // Fetch RFP distribution events
    const { data: distributionEvents } = await supabase
      .from('audit_events')
      .select('*')
      .eq('event_type', 'RFP_DISTRIBUTED')
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .in('entity_id', policy_version_ids || []);

    // Fetch RFP response events
    const { data: responseEvents } = await supabase
      .from('audit_events')
      .select('*')
      .eq('event_type', 'RFP_RESPONSE_SUBMITTED')
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    // Fetch compliance scoring events
    const { data: scoringEvents } = await supabase
      .from('audit_events')
      .select('*')
      .eq('event_type', 'RFP_COMPLIANCE_SCORED')
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    // Fetch submissions data
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        id,
        policy_version_id,
        workspace_id,
        compliance_score,
        compliance_breakdown,
        submitted_at,
        workspaces:workspace_id (name)
      `)
      .eq('submission_type', 'rfp_response')
      .eq('status', 'submitted')
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    // Build evidence package
    const evidencePackage = {
      export_metadata: {
        enterprise_id,
        generated_at: new Date().toISOString(),
        date_range: { start_date, end_date },
        report_type: 'RFP Governance Evidence'
      },
      distribution_summary: {
        total_distributions: distributionEvents?.length || 0,
        distributions: distributionEvents?.map(e => ({
          policy_version_id: e.entity_id,
          distributed_at: e.created_at,
          target_count: e.metadata?.workspace_count || 0,
          note: e.metadata?.note
        })) || []
      },
      response_summary: {
        total_responses: submissions?.length || 0,
        average_score: submissions?.reduce((sum, s) => sum + (s.compliance_score || 0), 0) / (submissions?.length || 1),
        responses: submissions?.map(s => ({
          workspace: s.workspaces?.name,
          compliance_score: s.compliance_score,
          submitted_at: s.submitted_at,
          key_gaps: s.compliance_breakdown?.gaps?.slice(0, 3) || []
        })) || []
      },
      audit_trail: {
        distribution_events: distributionEvents?.length || 0,
        response_events: responseEvents?.length || 0,
        scoring_events: scoringEvents?.length || 0,
        complete_trail: [
          ...(distributionEvents || []),
          ...(responseEvents || []),
          ...(scoringEvents || [])
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
    };

    // Generate export filename
    const filename = `governance-evidence-${enterprise_id}-${Date.now()}.json`;

    // Store in Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filename, JSON.stringify(evidencePackage, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to store evidence package');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('exports')
      .getPublicUrl(filename);

    return new Response(
      JSON.stringify({
        success: true,
        export_url: urlData.publicUrl,
        filename,
        summary: {
          distributions: evidencePackage.distribution_summary.total_distributions,
          responses: evidencePackage.response_summary.total_responses,
          average_score: evidencePackage.response_summary.average_score.toFixed(1)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in export-governance-evidence:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
