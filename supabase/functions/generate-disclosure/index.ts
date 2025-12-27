// =============================================================================
// EDGE FUNCTION: Generate Disclosure
// PURPOSE: Generate AI origin labels, C2PA manifests, and attestations
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DisclosureRequest {
  proof_bundle_id: string;
  framework_id?: string;
  disclosure_formats?: string[]; // 'ai_origin_label', 'c2pa_manifest', 'attestation'
}

interface Disclosure {
  type: string;
  format: string;
  content: any;
  generated_at: string;
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

    const { proof_bundle_id, framework_id, disclosure_formats = ['ai_origin_label', 'c2pa_manifest'] }: DisclosureRequest = await req.json();

    if (!proof_bundle_id) {
      return new Response(
        JSON.stringify({ error: 'proof_bundle_id is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get proof bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('proof_bundles')
      .select('*')
      .eq('id', proof_bundle_id)
      .single();

    if (bundleError || !bundle) {
      return new Response(
        JSON.stringify({ error: 'Proof bundle not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const disclosures: Disclosure[] = [];

    // Generate AI Origin Label (for NY S.8420-A, EU AI Act, etc.)
    if (disclosure_formats.includes('ai_origin_label')) {
      const aiOriginLabel = {
        type: 'ai_origin_label',
        format: 'json',
        content: {
          ai_generated: true,
          ai_tools_used: bundle.tool_usage || [],
          generated_at: bundle.created_at,
          disclosure_text: 'This content was generated using artificial intelligence.',
          framework_compliance: framework_id ? [framework_id] : []
        },
        generated_at: new Date().toISOString()
      };
      disclosures.push(aiOriginLabel);
    }

    // Generate C2PA Manifest (for content authenticity)
    if (disclosure_formats.includes('c2pa_manifest')) {
      // TODO: Integrate with actual C2PA Manifest Tool
      // For now, generate a placeholder structure
      const c2paManifest = {
        type: 'c2pa_manifest',
        format: 'json',
        content: {
          '@context': 'https://c2pa.org/specifications/schema/1.0/',
          claim_generator: 'AICOMPLYR.IO',
          assertions: [
            {
              label: 'stds.schema-org.CreativeWork',
              data: {
                '@type': 'CreativeWork',
                creator: {
                  '@type': 'SoftwareApplication',
                  name: 'AICOMPLYR.IO',
                  applicationCategory: 'Governance Platform'
                },
                dateCreated: bundle.created_at,
                aiGenerated: true
              }
            }
          ],
          signature: {
            // Would contain actual C2PA signature
            algorithm: 'ES256',
            value: 'placeholder_signature'
          }
        },
        generated_at: new Date().toISOString()
      };
      disclosures.push(c2paManifest);
    }

    // Generate Attestation (for regulatory compliance)
    if (disclosure_formats.includes('attestation')) {
      const attestation = {
        type: 'attestation',
        format: 'json',
        content: {
          proof_bundle_id: bundle.id,
          attested_at: new Date().toISOString(),
          frameworks: framework_id ? [framework_id] : [],
          attestation_text: 'This proof bundle contains evidence of compliance with applicable regulatory frameworks.',
          metadata: {
            bundle_hash: bundle.bundle_hash,
            policy_digest: bundle.policy_digest,
            trace_id: bundle.trace_id
          }
        },
        generated_at: new Date().toISOString()
      };
      disclosures.push(attestation);
    }

    // Store disclosures in proof_bundle_artifacts or metadata
    // This would be stored as part of the bundle's disclosure metadata

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          proof_bundle_id,
          disclosures,
          generated_at: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Disclosure generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

