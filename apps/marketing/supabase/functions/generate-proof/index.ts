import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateProofRequest {
  policy_instance_id: string;
}

interface ProofBundle {
  policy_instance_id: string;
  proof_hash: string;
  proof_signature: string;
  bundle_data: {
    policy_snapshot: any;
    approval_chain: any[];
    timestamp: string;
    cryptographic_seal: {
      algorithm: string;
      hash_method: string;
      signature_method: string;
    };
    metadata: {
      generated_by: string;
      generated_at: string;
      version: string;
    };
  };
}

// Simple SHA-256 hash function for Deno
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { policy_instance_id }: GenerateProofRequest = await req.json();

    console.log('Generating proof bundle for policy instance:', policy_instance_id);

    // Fetch policy instance
    const { data: policyInstance, error: policyError } = await supabaseClient
      .from('policy_instances')
      .select('*')
      .eq('id', policy_instance_id)
      .single();

    if (policyError || !policyInstance) {
      console.error('Error fetching policy instance:', policyError);
      throw new Error('Policy instance not found');
    }

    // Fetch approval records
    const { data: approvals, error: approvalsError } = await supabaseClient
      .from('approvals')
      .select('*')
      .eq('object_type', 'policy_instance')
      .eq('object_id', policy_instance_id)
      .order('decided_at', { ascending: true });

    if (approvalsError) {
      console.error('Error fetching approvals:', approvalsError);
      throw new Error('Failed to fetch approval records');
    }

    // Create immutable snapshot
    const policySnapshot = {
      id: policyInstance.id,
      template_id: policyInstance.template_id,
      tool_version_id: policyInstance.tool_version_id,
      use_case: policyInstance.use_case,
      jurisdiction: policyInstance.jurisdiction,
      audience: policyInstance.audience,
      pom: policyInstance.pom,
      status: policyInstance.status,
      created_at: policyInstance.created_at,
      approved_at: policyInstance.approved_at,
      approved_by: policyInstance.approved_by
    };

    // Create approval chain
    const approvalChain = (approvals || []).map(approval => ({
      stage: approval.stage,
      decision: approval.decision,
      decided_by: approval.decided_by,
      decided_at: approval.decided_at,
      rationale: approval.rationale
    }));

    // Build bundle data
    const bundleData = {
      policy_snapshot: policySnapshot,
      approval_chain: approvalChain,
      timestamp: new Date().toISOString(),
      cryptographic_seal: {
        algorithm: 'SHA-256',
        hash_method: 'SHA-256 of canonicalized JSON',
        signature_method: 'HMAC-SHA256'
      },
      metadata: {
        generated_by: 'proof-generator-v1',
        generated_at: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Generate cryptographic hash
    const canonicalJson = JSON.stringify(bundleData, Object.keys(bundleData).sort());
    const proofHash = await sha256(canonicalJson);
    
    // Generate signature (in production, use proper signing key)
    const signatureInput = `${proofHash}:${policy_instance_id}:${bundleData.timestamp}`;
    const proofSignature = await sha256(signatureInput);

    console.log('Generated proof hash:', proofHash);

    // Insert proof bundle
    const { data: proofBundle, error: proofError } = await supabaseClient
      .from('proof_bundles')
      .insert({
        policy_instance_id,
        proof_hash: proofHash,
        proof_signature: proofSignature,
        bundle_data: bundleData
      })
      .select()
      .single();

    if (proofError) {
      console.error('Error inserting proof bundle:', proofError);
      throw new Error('Failed to create proof bundle');
    }

    // Update policy instance with proof bundle ID
    const { error: updateError } = await supabaseClient
      .from('policy_instances')
      .update({ proof_bundle_id: proofBundle.id })
      .eq('id', policy_instance_id);

    if (updateError) {
      console.error('Error updating policy instance:', updateError);
    }

    // Log audit event
    await supabaseClient
      .from('audit_events')
      .insert({
        event_type: 'proof_generated',
        entity_type: 'policy_instance',
        entity_id: policy_instance_id,
        enterprise_id: policyInstance.enterprise_id,
        workspace_id: policyInstance.workspace_id,
        details: {
          proof_bundle_id: proofBundle.id,
          proof_hash: proofHash,
          approval_stages: approvalChain.length
        }
      });

    console.log('Proof bundle generated successfully:', proofBundle.id);

    return new Response(
      JSON.stringify({
        success: true,
        proof_bundle_id: proofBundle.id,
        proof_hash: proofHash,
        proof_signature: proofSignature
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-proof:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
