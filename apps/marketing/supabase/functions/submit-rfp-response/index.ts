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

    const { submission_id, rfp_response_data, compliance_score, compliance_breakdown } = await req.json();

    console.log(`Submitting RFP response for submission ${submission_id}`);

    // Update submission with response data
    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({
        rfp_response_data,
        compliance_score,
        compliance_breakdown,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', submission_id)
      .select('workspace_id, policy_version_id')
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      throw new Error('Failed to submit RFP response');
    }

    // Log RFP response submission audit event
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: 'RFP_RESPONSE_SUBMITTED',
        entity_type: 'submission',
        entity_id: submission_id,
        workspace_id: submission.workspace_id,
        metadata: {
          policy_version_id: submission.policy_version_id,
          compliance_score,
          response_summary: {
            total_questions: rfp_response_data?.answers?.length || 0,
            answered_questions: rfp_response_data?.answers?.filter((a: any) => a.answer).length || 0,
            evidence_provided: rfp_response_data?.answers?.filter((a: any) => a.evidence?.length > 0).length || 0
          }
        }
      });

    if (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    // Log compliance scoring event if score exists
    if (compliance_score != null) {
      await supabase
        .from('audit_events')
        .insert({
          event_type: 'RFP_COMPLIANCE_SCORED',
          entity_type: 'submission',
          entity_id: submission_id,
          workspace_id: submission.workspace_id,
          metadata: {
            compliance_score,
            compliance_breakdown,
            scoring_timestamp: new Date().toISOString()
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        submission_id,
        compliance_score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-rfp-response:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
