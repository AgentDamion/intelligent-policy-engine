import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { policy_id, workspace_id, count = 5 } = await req.json();

    if (!policy_id) {
      throw new Error('policy_id is required');
    }

    // Fetch policy details
    const { data: policy, error: policyError } = await supabase
      .from('policy_versions')
      .select('*')
      .eq('id', policy_id)
      .single();

    if (policyError || !policy) {
      throw new Error('Policy not found');
    }

    // Call cursor-agent-adapter to generate scenarios
    const adapterResponse = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentName: 'sandbox',
        action: 'generate_test_scenarios',
        input: {
          policy: policy,
          count: count
        },
        context: {
          workspaceId: workspace_id,
          userId: user.id
        }
      })
    });

    if (!adapterResponse.ok) {
      const errorText = await adapterResponse.text();
      throw new Error(`Agent adapter failed: ${errorText}`);
    }

    const adapterData = await adapterResponse.json();

    if (!adapterData.success) {
      throw new Error(adapterData.error || 'Failed to generate scenarios');
    }

    return new Response(
      JSON.stringify({
        success: true,
        scenarios: adapterData.result.scenarios || [],
        confidence: adapterData.result.confidence || 0.85,
        duration_ms: Date.now() - performance.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate test scenarios error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
