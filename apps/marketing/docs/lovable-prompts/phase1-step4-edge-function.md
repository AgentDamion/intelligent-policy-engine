# Phase 1, Step 4: Validation Edge Function

## Prompt to paste into Lovable:

```
Create a new Supabase edge function: validate-rfp-disclosures

This function validates disclosed AI tools against a client's policy pack.

IMPORTANT: Follow the same patterns as the existing generate-rfp-clauses function:
- CORS headers for web app access
- Proper error handling and logging
- Supabase client usage (not direct HTTP calls)
- Return structured JSON responses

Input (POST body):
{
  "distribution_id": "uuid",
  "disclosures": [{ tool_name, version, provider, data_scope, ... }],
  "policy_pack_id": "uuid" (optional - will fetch from policy_version if not provided)
}

Validation Logic:
1. Fetch the policy pack (from policy_versions.tool_whitelist)
2. For each disclosed tool:
   - Check if tool name matches whitelist (case-insensitive)
   - Verify version is in approved versions list
   - Compare data_scope against allowed scope
   - Mark as COMPLIANT, PENDING, or RESTRICTED
   - Track failed control IDs
3. Calculate overall_score (percentage of compliant tools)
4. Save to policy_resolutions table
5. Return the resolution result

Response:
{
  "success": true,
  "resolution": { id, distribution_id, overall_score, items, created_at }
}

Use deterministic validation - same inputs must produce same results.
```

## Expected Code Structure:

```typescript
// supabase/functions/validate-rfp-disclosures/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToolDisclosure {
  tool_name: string;
  version?: string;
  provider?: string;
  data_scope?: {
    pii?: boolean;
    hipaa?: boolean;
    regions?: string[];
  };
}

interface ValidationInput {
  distribution_id: string;
  disclosures: ToolDisclosure[];
  policy_pack_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: ValidationInput = await req.json();
    const { distribution_id, disclosures, policy_pack_id } = input;

    console.log('Validating disclosures for distribution:', distribution_id);

    // Fetch policy pack
    let policyPack;
    if (policy_pack_id) {
      const { data } = await supabase
        .from('policy_versions')
        .select('tool_whitelist, control_mappings, jurisdictions')
        .eq('id', policy_pack_id)
        .single();
      policyPack = data;
    } else {
      // Fetch from distribution's policy_version
      const { data: dist } = await supabase
        .from('policy_distributions')
        .select('policy_version_id')
        .eq('id', distribution_id)
        .single();
      
      if (dist) {
        const { data } = await supabase
          .from('policy_versions')
          .select('tool_whitelist, control_mappings, jurisdictions')
          .eq('id', dist.policy_version_id)
          .single();
        policyPack = data;
      }
    }

    if (!policyPack || !policyPack.tool_whitelist) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Policy pack not found or no whitelist configured'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each disclosure
    const items = disclosures.map((disclosure) => {
      const whitelist = policyPack.tool_whitelist || [];
      const match = whitelist.find((w: any) =>
        w.name.toLowerCase() === disclosure.tool_name.toLowerCase() &&
        (!w.provider || w.provider === disclosure.provider)
      );

      if (!match) {
        return {
          tool_name: disclosure.tool_name,
          version: disclosure.version,
          provider: disclosure.provider,
          status: 'PENDING' as const,
          reasons: ['Tool not in approved whitelist'],
          failed_controls: []
        };
      }

      // Check version
      const versionOk = !match.versions || !disclosure.version || 
        match.versions.includes(disclosure.version);
      
      if (!versionOk) {
        return {
          tool_name: disclosure.tool_name,
          version: disclosure.version,
          provider: disclosure.provider,
          status: 'PENDING' as const,
          reasons: ['Version not approved'],
          failed_controls: ['CTRL-VERS-001']
        };
      }

      // Check data scope (simplified)
      const scopeOk = !match.data_scope || !disclosure.data_scope ||
        JSON.stringify(match.data_scope) === JSON.stringify(disclosure.data_scope);

      if (!scopeOk) {
        return {
          tool_name: disclosure.tool_name,
          version: disclosure.version,
          provider: disclosure.provider,
          status: 'PENDING' as const,
          reasons: ['Data scope does not match approved configuration'],
          failed_controls: ['CTRL-DATA-002']
        };
      }

      return {
        tool_name: disclosure.tool_name,
        version: disclosure.version,
        provider: disclosure.provider,
        status: 'COMPLIANT' as const,
        reasons: [],
        failed_controls: []
      };
    });

    // Calculate score
    const compliantCount = items.filter(i => i.status === 'COMPLIANT').length;
    const overall_score = Math.round((compliantCount / items.length) * 100);

    // Save resolution
    const { data: resolution, error: saveError } = await supabase
      .from('policy_resolutions')
      .insert({
        distribution_id,
        resolution_data: { items },
        overall_score
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving resolution:', saveError);
      throw saveError;
    }

    console.log('Validation complete. Score:', overall_score);

    return new Response(
      JSON.stringify({
        success: true,
        resolution: {
          id: resolution.id,
          distribution_id: resolution.distribution_id,
          overall_score: resolution.overall_score,
          items,
          created_at: resolution.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Validation failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```
