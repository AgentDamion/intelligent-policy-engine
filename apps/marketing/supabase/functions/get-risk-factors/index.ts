import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const url = new URL(req.url);
    const workflowId = url.searchParams.get('workflowId');

    if (!workflowId) {
      return new Response(JSON.stringify({ error: 'workflowId required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Fetching risk factors for workflow:', workflowId);

    // Fetch all three stages in parallel
    const [preRunResult, inRunResult, postRunResult] = await Promise.all([
      supabase
        .from('policy_controls')
        .select('control_key, points, weight, metadata, evidence_url, created_at')
        .eq('workflow_id', workflowId)
        .eq('stage', 'pre_run')
        .order('points', { ascending: false }),
      
      supabase
        .from('evidence_events')
        .select('event_type, delta_points, payload, triggered_by, occurred_at')
        .eq('workflow_id', workflowId)
        .eq('stage', 'in_run')
        .order('occurred_at', { ascending: false }),
      
      supabase
        .from('postrun_outcomes')
        .select('outcome_key, points, details, recorded_by, recorded_at')
        .eq('workflow_id', workflowId)
        .order('recorded_at', { ascending: false })
    ]);

    if (preRunResult.error || inRunResult.error || postRunResult.error) {
      const error = preRunResult.error || inRunResult.error || postRunResult.error;
      console.error('Error fetching factors:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const response = {
      pre: preRunResult.data || [],
      in: inRunResult.data || [],
      post: postRunResult.data || []
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
