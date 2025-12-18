import { serve } from 'https://deno.land/std@0.210.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('publish-outbox: missing Supabase configuration')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
})

const BATCH_SIZE = 50
const RETRY_DELAY_SECONDS = 45

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const dequeue = await supabase.rpc('dequeue_outbox_batch', { p_limit: BATCH_SIZE })
    if (dequeue.error) {
      console.error('[publish-outbox] dequeue failed', dequeue.error)
      return new Response(JSON.stringify({ error: 'dequeue_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const events = dequeue.data ?? []
    if (events.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let published = 0
    for (const event of events) {
      const channel = buildChannel(event.event_type, event.enterprise_id)
      const payload = {
        id: event.id,
        enterprise_id: event.enterprise_id,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        event_type: event.event_type,
        attempts: event.attempts,
        payload: event.payload,
        published_at: new Date().toISOString(),
      }

      try {
        const publishResult = await supabase.rpc('publish_realtime_event', {
          p_channel: channel,
          p_event: event.event_type,
          p_payload: payload,
        })

        if (publishResult.error) {
          throw publishResult.error
        }

        const finishResult = await supabase.rpc('finish_outbox_event', {
          p_id: event.id,
          p_success: true,
        })
        if (finishResult.error) {
          throw finishResult.error
        }

        published += 1
      } catch (err) {
        console.error('[publish-outbox] publish failure', { id: event.id, err })
        await supabase.rpc('finish_outbox_event', {
          p_id: event.id,
          p_success: false,
          p_error: `${err?.message ?? err}`,
          p_retry_seconds: RETRY_DELAY_SECONDS,
        })
      }
    }

    return new Response(JSON.stringify({ published }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[publish-outbox] unexpected error', error)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildChannel(eventType: string, enterpriseId: string | null): string {
  const namespace = enterpriseId ? `enterprise:${enterpriseId}` : 'global'
  return `mesh:${namespace}:${eventType}`
}

