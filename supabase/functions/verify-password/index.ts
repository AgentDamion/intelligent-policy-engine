/**
 * Verify Password Edge Function
 * 
 * FDA 21 CFR Part 11 Compliant Password Verification
 * 
 * This function verifies a user's password without creating a new session,
 * which is critical for electronic signature re-authentication flows.
 * 
 * Using signInWithPassword() from the frontend would:
 * - Create a new session
 * - Potentially invalidate the existing session
 * - Cause session conflicts
 * 
 * This Edge Function verifies credentials server-side without side effects.
 */

import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);

    // Verify the current session token to get the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body to get password
    const { password } = await req.json();
    
    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password using admin API
    // We use signInWithPassword with a fresh client that doesn't persist sessions
    // This validates credentials without affecting the user's existing session
    const verificationClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });

    const { error: signInError } = await verificationClient.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      // Log failed verification attempt for security audit
      await supabaseAdmin.from('governance_audit_events').insert({
        event_type: 'password_verification_failed',
        enterprise_id: null, // Will be set by trigger if available
        actor_type: 'human',
        actor_id: user.id,
        event_payload: {
          reason: 'Invalid password',
          timestamp: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        },
      }).catch(() => {}); // Don't fail if audit logging fails

      return new Response(
        JSON.stringify({ success: false, error: 'Password verification failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful verification for audit trail
    await supabaseAdmin.from('governance_audit_events').insert({
      event_type: 'password_verification_success',
      enterprise_id: null,
      actor_type: 'human',
      actor_id: user.id,
      event_payload: {
        reason: 'Re-authentication for electronic signature',
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: user.id,
        verifiedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-password] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

