import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PromoteEvidenceSchema = z.object({
  evidence_id: z.string().uuid(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    const parseResult = PromoteEvidenceSchema.safeParse(requestBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { evidence_id } = parseResult.data;

    // Get evidence record
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', evidence_id)
      .single();

    if (evidenceError || !evidence) {
      return new Response(
        JSON.stringify({ error: 'Evidence not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if evidence is clean and ready for promotion
    if (evidence.scan_status !== 'clean') {
      return new Response(
        JSON.stringify({ error: 'Evidence must be clean before promotion', scan_status: evidence.scan_status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Copy file from quarantine to evidence bucket
    const quarantinePath = evidence.file_path;
    const evidencePath = `evidence/${evidence.submission_item_id}/${evidence.filename}`;

    // Copy the file (in a real implementation, you'd use Supabase Storage API)
    const { data: copyData, error: copyError } = await supabase.storage
      .from('evidence')
      .copy(quarantinePath.replace('quarantine/', ''), evidencePath);

    if (copyError) {
      console.error('Failed to copy file:', copyError);
      return new Response(
        JSON.stringify({ error: 'Failed to promote evidence file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update evidence record with new path and promoted status
    const { error: updateError } = await supabase
      .from('evidence')
      .update({
        file_path: evidencePath,
        scan_status: 'clean'
      })
      .eq('id', evidence_id);

    if (updateError) {
      console.error('Failed to update evidence record:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update evidence record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: 'evidence_promoted',
        entity_type: 'evidence',
        entity_id: evidence_id,
        details: {
          filename: evidence.filename,
          original_path: quarantinePath,
          promoted_path: evidencePath,
          scan_status: 'clean'
        }
      });

    if (auditError) {
      console.error('Failed to log audit event:', auditError);
      // Don't fail the request for audit logging issues
    }

    // Remove file from quarantine bucket
    const { error: deleteError } = await supabase.storage
      .from('quarantine')
      .remove([quarantinePath.replace('quarantine/', '')]);

    if (deleteError) {
      console.error('Failed to remove quarantine file:', deleteError);
      // Don't fail the request for cleanup issues
    }

    return new Response(
      JSON.stringify({
        evidence_id,
        status: 'promoted',
        file_path: evidencePath,
        message: 'Evidence successfully promoted to secure storage'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in promote_evidence:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});