import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { hashJson } from "../_shared/hash.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEPSRequest {
  policy_instance_id: string;
  scope_id?: string;
  trigger_source: 'approval' | 'activation' | 'scoped_policy_change' | 'clause_mapping';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { policy_instance_id, scope_id, trigger_source }: GenerateEPSRequest = await req.json();

    console.log(`[EPS] Starting generation for ${policy_instance_id}, trigger: ${trigger_source}`);

    // 1. Fetch policy instance
    const { data: instance, error: instanceError } = await supabaseClient
      .from('policy_instances')
      .select('*')
      .eq('id', policy_instance_id)
      .single();

    if (instanceError || !instance) {
      throw new Error(`Policy instance not found: ${policy_instance_id}`);
    }

    // 2. Compute idempotency key
    const { data: scopeVersion } = scope_id 
      ? await supabaseClient.from('scopes').select('updated_at').eq('id', scope_id).single()
      : { data: null };

    const { data: clauseRevisions } = await supabaseClient
      .from('policy_clauses')
      .select('id, confidence, updated_at')
      .contains('applied_to_instances', [policy_instance_id]);

    const idempotencyKey = await hashJson({
      instance_updated: instance.updated_at,
      scope_version: scopeVersion?.updated_at,
      clause_revisions: (clauseRevisions || []).map(c => ({ id: c.id, updated: c.updated_at }))
    });

    // Check for existing EPS with same idempotency key
    const { data: existingEPS } = await supabaseClient
      .from('effective_policy_snapshots')
      .select('*')
      .eq('policy_instance_id', policy_instance_id)
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingEPS) {
      console.log(`[EPS] Idempotent: returning existing EPS v${existingEPS.version}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          eps: existingEPS, 
          version: existingEPS.version,
          idempotent: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get next version
    const { data: nextVersionData } = await supabaseClient.rpc('eps_next_version', {
      p_policy_instance_id: policy_instance_id
    });
    const nextVersion = nextVersionData || 1;

    // 4. Build effective POM
    let mergedPom = JSON.parse(JSON.stringify(instance.pom));
    const provenance: Record<string, any> = {};
    const hashInputs: any = {
      base_instance: { id: policy_instance_id, updated_at: instance.updated_at },
      scoped_policies: [],
      clause_mappings: []
    };

    // 5. Apply approved clause mappings
    const { data: clauses } = await supabaseClient
      .from('policy_clauses')
      .select('id, pom_field_mappings, confidence, mapping_status')
      .contains('applied_to_instances', [policy_instance_id])
      .or('mapping_status.eq.approved,mapping_status.eq.auto_applied')
      .gte('confidence', 0.92);

    if (clauses && clauses.length > 0) {
      for (const clause of clauses) {
        const mappings = clause.pom_field_mappings as any[];
        if (!mappings) continue;

        hashInputs.clause_mappings.push({
          clause_id: clause.id,
          confidence: clause.confidence,
          status: clause.mapping_status
        });

        for (const mapping of mappings) {
          const fieldPath = mapping.field_path;
          const value = mapping.suggested_value;

          const pathParts = fieldPath.split('.');
          let target = mergedPom;
          for (let i = 0; i < pathParts.length - 1; i++) {
            target[pathParts[i]] = target[pathParts[i]] || {};
            target = target[pathParts[i]];
          }
          target[pathParts[pathParts.length - 1]] = value;

          provenance[fieldPath] = {
            source_type: 'client_clause',
            source_id: clause.id,
            clause_id: clause.id,
            confidence: clause.confidence,
            applied_at: new Date().toISOString()
          };
        }
      }
    }

    // 6. Generate content hash
    const contentHash = await hashJson(mergedPom);

    // 7. Create EPS record
    const { data: eps, error: epsError } = await supabaseClient
      .from('effective_policy_snapshots')
      .insert({
        policy_instance_id,
        enterprise_id: instance.enterprise_id,
        workspace_id: instance.workspace_id,
        scope_id,
        effective_pom: mergedPom,
        content_hash: contentHash,
        idempotency_key: idempotencyKey,
        hash_inputs: hashInputs,
        field_provenance: provenance,
        version: nextVersion,
        ...(trigger_source === 'activation' && { activated_at: new Date().toISOString() })
      })
      .select()
      .single();

    if (epsError) throw epsError;

    // 8. Update policy_instances pointer
    const { error: updateError } = await supabaseClient
      .from('policy_instances')
      .update({ current_eps_id: eps.id, eps_version: nextVersion })
      .eq('id', policy_instance_id);

    if (updateError) throw updateError;

    console.log(`[EPS] Generated v${nextVersion} for ${policy_instance_id} in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({ success: true, eps, version: nextVersion, idempotent: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EPS] Generation error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
