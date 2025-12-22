import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ComputeScoreSchema = z.object({
  submission_id: z.string().uuid(),
  run_mode: z.enum(['fast', 'full']).optional().default('fast')
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
    const { submission_id, run_mode } = ComputeScoreSchema.parse(body);

    console.log(`Computing score for submission ${submission_id} in ${run_mode} mode`);

    // Mock scoring logic - replace with actual AI scoring
    const mockScore = {
      overall: Math.floor(Math.random() * 100),
      categories: {
        'data_privacy': Math.floor(Math.random() * 100),
        'security': Math.floor(Math.random() * 100),
        'compliance': Math.floor(Math.random() * 100),
        'risk_assessment': Math.floor(Math.random() * 100)
      }
    };

    // Generate a run ID for tracking
    const run_id = crypto.randomUUID();

    // Save score to database (mock table structure)
    const { error: insertError } = await supabase
      .from('scores')
      .insert({
        submission_id,
        overall_score: mockScore.overall,
        category_scores: mockScore.categories,
        run_id,
        run_mode,
        computed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error saving score:', insertError);
      // Continue anyway - score computed successfully
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'scored',
        last_scored_at: new Date().toISOString()
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: 'score_computed',
        entity_type: 'submission',
        entity_id: submission_id,
        metadata: {
          run_id,
          run_mode,
          overall_score: mockScore.overall
        }
      });

    if (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    const response = {
      submission_id,
      overall: mockScore.overall,
      categories: mockScore.categories,
      run_id
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in compute_score function:', error);
    
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