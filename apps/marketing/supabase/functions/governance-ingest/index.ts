import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const eventSchema = z.object({
  event_type: z.string().min(1),
  entity_type: z.enum(['sandbox_run', 'sandbox_approval', 'export', 'policy', 'other']),
  entity_id: z.string().uuid().optional(),
  action: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  workspace_id: z.string().uuid().optional(),
  enterprise_id: z.string().uuid().optional(),
});

type GovernanceEvent = z.infer<typeof eventSchema>;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate input
    const body = await req.json();
    const validationResult = eventSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: validationResult.error.issues,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: GovernanceEvent = validationResult.data;

    // Enrich event data
    const enrichedEvent = {
      ...event,
      metadata: {
        ...(event.metadata || {}),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    // Get user context (optional for internal calls)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Insert governance event
    const { data: insertedEvent, error: insertError } = await supabase
      .from('governance_events')
      .insert({
        event_type: enrichedEvent.event_type,
        entity_type: enrichedEvent.entity_type,
        entity_id: enrichedEvent.entity_id,
        action: enrichedEvent.action,
        metadata: enrichedEvent.metadata,
        workspace_id: enrichedEvent.workspace_id,
        enterprise_id: enrichedEvent.enterprise_id,
        actor_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    const duration = Date.now() - startTime;

    console.log(`Governance event recorded: ${event.event_type} (${duration}ms)`, {
      event_id: insertedEvent.id,
      entity_type: event.entity_type,
      action: event.action,
    });

    return new Response(
      JSON.stringify({
        success: true,
        event_id: insertedEvent.id,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Governance ingest error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to record governance event',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
