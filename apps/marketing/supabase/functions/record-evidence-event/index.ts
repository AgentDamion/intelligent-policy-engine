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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { workflow_id, event_type, delta_points, payload, triggered_by } = await req.json();

    if (!workflow_id || !event_type || delta_points === undefined) {
      return new Response(JSON.stringify({ 
        error: 'workflow_id, event_type, and delta_points required' 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Recording evidence event:', { workflow_id, event_type, delta_points });

    const { data, error } = await supabase
      .from('evidence_events')
      .insert({
        workflow_id,
        stage: 'in_run',
        event_type,
        delta_points,
        payload: payload || {},
        triggered_by,
        occurred_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording event:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch updated risk score
    const { data: updatedScore } = await supabase
      .from('risk_scores')
      .select('*')
      .eq('workflow_id', workflow_id)
      .single();

    return new Response(JSON.stringify({ 
      event: data,
      updatedScore 
    }), {
      status: 201,
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
