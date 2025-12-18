import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('x-webhook-signature');
    const payload = await req.json();

  console.log('Webhook received:', {
    platform_type: payload.platform_type,
    event_type: payload.event_type,
    config_id: payload.config_id,
    timestamp: new Date().toISOString()
  });

    // Verify webhook signature if configured
    const { data: config } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('id', payload.config_id)
      .single();

    if (!config) {
      throw new Error('Configuration not found');
    }

    // REQUIRED: webhook secret must be configured
    if (!config.metadata?.webhook_secret) {
      console.error('Webhook secret not configured for config:', payload.config_id);
      return new Response(
        JSON.stringify({ 
          error: 'Webhook authentication not configured. Contact administrator.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REQUIRED: signature header must be present
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(
        JSON.stringify({ error: 'Missing X-Webhook-Signature header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REQUIRED: timestamp for replay attack prevention
    const timestamp = req.headers.get('x-webhook-timestamp');
    if (!timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing X-Webhook-Timestamp header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check timestamp is within 5 minutes
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 300) { // 5 minutes
      console.error('Webhook timestamp too old:', timeDiff, 'seconds');
      return new Response(
        JSON.stringify({ error: 'Webhook timestamp expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ALWAYS validate signature
    const isValid = await verifySignature(
      JSON.stringify(payload),
      signature,
      config.metadata.webhook_secret
    );
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process webhook event based on type
    const result = await processWebhookEvent(supabase, payload, config);

    // Log the webhook event
    await supabase.from('platform_integration_logs').insert({
      platform_config_id: payload.config_id,
      operation_type: 'webhook_received',
      status: 'success',
      platform_type: payload.platform_type,
      metadata: {
        event_type: payload.event_type,
        payload: payload,
        result: result
      },
      enterprise_id: config.enterprise_id
    });

    console.log('Webhook processed:', {
      status: result.status,
      event_type: payload.event_type
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = hexToBytes(signature);
    const dataBytes = encoder.encode(payload);

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      dataBytes
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function processWebhookEvent(
  supabase: any,
  payload: any,
  config: any
): Promise<any> {
  const { event_type, platform_type, data } = payload;

  console.log(`Processing ${event_type} event for ${platform_type}`);

  switch (event_type) {
    case 'sync_completed':
      // Update sync status
      await supabase
        .from('platform_configurations')
        .update({
          metadata: {
            ...config.metadata,
            last_sync_status: 'completed',
            last_sync_completed_at: new Date().toISOString(),
            last_sync_records: data.records_synced
          }
        })
        .eq('id', payload.config_id);
      
      return { status: 'sync_completed', records: data.records_synced };

    case 'sync_failed':
      // Update sync status and log error
      await supabase
        .from('platform_configurations')
        .update({
          metadata: {
            ...config.metadata,
            last_sync_status: 'failed',
            last_sync_error: data.error
          }
        })
        .eq('id', payload.config_id);
      
      return { status: 'sync_failed', error: data.error };

    case 'credential_expired':
      // Mark credentials as expired
      await supabase
        .from('platform_configurations')
        .update({
          status: 'inactive',
          metadata: {
            ...config.metadata,
            credential_status: 'expired',
            credential_expired_at: new Date().toISOString()
          }
        })
        .eq('id', payload.config_id);
      
      return { status: 'credential_expired' };

    case 'data_updated':
      // Platform notifying us of data changes
      return { status: 'data_updated', records: data.records };

    default:
      console.log(`Unknown event type: ${event_type}`);
      return { status: 'unknown_event', event_type };
  }
}
