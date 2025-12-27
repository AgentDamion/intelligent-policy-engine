// =============================================================================
// EDGE FUNCTION: Verify Proof Bundle
// PURPOSE: Re-hash canonical_json, compare with bundle_hash, and verify signature
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

interface VerifyRequest {
  proof_bundle_id: string;
  verify_signature?: boolean;
}

interface VerificationResult {
  verified: boolean;
  status: 'verified' | 'tampered' | 'invalid' | 'missing_artifacts';
  bundle_hash_match: boolean;
  signature_valid?: boolean;
  errors: string[];
  details: {
    provided_hash?: string;
    calculated_hash?: string;
    trace_id_present: boolean;
    policy_digest_present: boolean;
  };
}

async function calculateSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(
  hash: string,
  signature: string,
  algorithm: string
): Promise<boolean> {
  // TODO: Implement actual signature verification based on algorithm
  // For now, return true if signature exists (placeholder)
  // In production, this would:
  // 1. Fetch public key based on signature_key_id
  // 2. Verify signature using appropriate algorithm (RSA, ECDSA, EdDSA)
  // 3. Return verification result
  
  if (!signature) {
    return false;
  }
  
  // Placeholder: In production, implement actual cryptographic verification
  return true;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type',
        },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { proof_bundle_id, verify_signature = false }: VerifyRequest = await req.json();

    if (!proof_bundle_id) {
      return new Response(
        JSON.stringify({ error: 'proof_bundle_id is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const errors: string[] = [];
    const result: VerificationResult = {
      verified: false,
      status: 'invalid',
      bundle_hash_match: false,
      errors,
      details: {
        trace_id_present: false,
        policy_digest_present: false,
      },
    };

    // Fetch proof bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('proof_bundles')
      .select('id, trace_id, policy_digest, bundle_hash')
      .eq('id', proof_bundle_id)
      .single();

    if (bundleError || !bundle) {
      result.status = 'invalid';
      result.errors.push('Proof bundle not found');
      return new Response(JSON.stringify(result), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check required fields
    result.details.trace_id_present = !!bundle.trace_id;
    result.details.policy_digest_present = !!bundle.policy_digest;

    if (!bundle.trace_id) {
      errors.push('trace_id is missing');
    }
    if (!bundle.policy_digest) {
      errors.push('policy_digest is missing');
    }

    // Fetch artifacts
    const { data: artifact, error: artifactError } = await supabase
      .from('proof_bundle_artifacts')
      .select('*')
      .eq('proof_bundle_id', proof_bundle_id)
      .single();

    if (artifactError || !artifact) {
      result.status = 'missing_artifacts';
      result.errors.push('Proof bundle artifacts not found');
      return new Response(JSON.stringify(result), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate hash from canonical_json
    const canonicalJsonString = JSON.stringify(artifact.canonical_json);
    const calculatedHash = await calculateSHA256Hash(canonicalJsonString);
    result.details.calculated_hash = calculatedHash;
    result.details.provided_hash = artifact.bundle_hash;

    // Compare hashes
    result.bundle_hash_match = calculatedHash === artifact.bundle_hash;

    if (!result.bundle_hash_match) {
      result.status = 'tampered';
      result.errors.push('Bundle hash mismatch - bundle may have been tampered with');
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify signature if requested
    if (verify_signature && artifact.signature) {
      result.signature_valid = await verifySignature(
        artifact.bundle_hash,
        artifact.signature,
        artifact.signature_algorithm || 'RSA'
      );

      if (!result.signature_valid) {
        result.status = 'tampered';
        result.errors.push('Signature verification failed');
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // All checks passed
    result.verified = true;
    result.status = 'verified';

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

