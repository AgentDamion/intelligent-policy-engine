import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const IssueDecisionSchema = z.object({
  submission_id: z.string().uuid(),
  outcome: z.enum(['approved', 'restricted', 'rejected']),
  conditions: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  notify: z.boolean().optional().default(true)
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
    const { submission_id, outcome, conditions, expires_at, notify } = IssueDecisionSchema.parse(body);

    console.log(`Issuing ${outcome} decision for submission ${submission_id}`);

    // Generate decision ID
    const decision_id = crypto.randomUUID();

    // Create the decision record
    const { error: decisionError } = await supabase
      .from('decisions')
      .insert({
        id: decision_id,
        submission_id,
        outcome,
        conditions: conditions || null,
        expires_at: expires_at || null,
        // Remove invalid columns - use only schema columns
      });

    if (decisionError) {
      console.error('Error creating decision:', decisionError);
      throw new Error('Failed to create decision');
    }

    // Update submission status to reflect decision - use valid enum values
    const submissionStatus = outcome === 'approved' ? 'approved' : 'rejected';

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: submissionStatus,
        decision_id,
        decided_at: new Date().toISOString()
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: 'decision_issued',
        entity_type: 'submission',
        entity_id: submission_id,
        metadata: {
          decision_id,
          outcome,
          conditions: conditions || null,
          expires_at: expires_at || null
        }
      });

    if (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    // Log decision issued (notifications table doesn't exist yet)
    console.log(`Decision ${outcome} issued for submission ${submission_id}`);

    const response = {
      decision_id,
      submission_id,
      outcome
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in issue_decision function:', error);
    
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