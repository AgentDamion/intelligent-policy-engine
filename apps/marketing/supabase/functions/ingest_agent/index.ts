import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-signature',
};

// HMAC signature verification
async function verifySignature(body: string, signature: string): Promise<boolean> {
  const key = Deno.env.get('AGENT_INGEST_KEY');
  if (!key || !signature) return false;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const bodyData = encoder.encode(body);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === `sha256=${expectedHex}`;
}

// Input validation schemas
const AgentActivitySchema = z.object({
  agent: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  status: z.enum(['success', 'warning', 'error', 'running']),
  workspace_id: z.string().uuid().optional(),
  enterprise_id: z.string().uuid().optional(),
  details: z.record(z.any()).optional()
});

const AgentDecisionSchema = z.object({
  agent: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  agency: z.string().min(1).max(100).optional(),
  outcome: z.enum(['approved', 'rejected', 'flagged']),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  enterprise_id: z.string().uuid().optional(),
  details: z.record(z.any()).optional()
});

const BatchIngestSchema = z.object({
  activities: z.array(AgentActivitySchema).optional(),
  decisions: z.array(AgentDecisionSchema).optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify HMAC signature for security
    const signature = req.headers.get('X-Agent-Signature');
    const bodyText = await req.text();
    
    if (!await verifySignature(bodyText, signature || '')) {
      console.error('Invalid or missing signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body = JSON.parse(bodyText);
    const { activities = [], decisions = [] } = BatchIngestSchema.parse(body);

    console.log(`Ingesting ${activities.length} activities and ${decisions.length} decisions`);

    let activitiesInserted = 0;
    let decisionsInserted = 0;

    // Insert agent activities
    if (activities.length > 0) {
      const { error: activitiesError, count } = await supabase
        .from('agent_activities')
        .insert(activities)
        .select();

      if (activitiesError) {
        console.error('Error inserting activities:', activitiesError);
        throw new Error(`Failed to insert activities: ${activitiesError.message}`);
      }

      activitiesInserted = count || 0;
    }

    // Insert AI agent decisions
    if (decisions.length > 0) {
      const { error: decisionsError, count } = await supabase
        .from('ai_agent_decisions')
        .insert(decisions)
        .select();

      if (decisionsError) {
        console.error('Error inserting decisions:', decisionsError);
        throw new Error(`Failed to insert decisions: ${decisionsError.message}`);
      }

      decisionsInserted = count || 0;
    }

    const response = {
      success: true,
      ingested: {
        activities: activitiesInserted,
        decisions: decisionsInserted
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest_agent function:', error);
    
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