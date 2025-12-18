import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

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
    data_types?: string[];
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
    const { distribution_id, disclosures, policy_pack_id }: ValidationInput = await req.json();

    if (!distribution_id || !disclosures || !Array.isArray(disclosures)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: distribution_id, disclosures' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the policy pack to validate against
    let policyPack;
    
    if (policy_pack_id) {
      // Use explicit policy pack ID if provided
      const { data, error } = await supabase
        .from('policy_versions')
        .select('tool_whitelist, control_mappings, jurisdictions')
        .eq('id', policy_pack_id)
        .single();
      
      if (error) {
        console.error('Error fetching policy pack:', error);
        throw new Error('Policy pack not found');
      }
      policyPack = data;
    } else {
      // Fetch policy pack from distribution
      const { data, error } = await supabase
        .from('policy_distributions')
        .select(`
          policy_version_id,
          policy_versions (
            tool_whitelist,
            control_mappings,
            jurisdictions
          )
        `)
        .eq('id', distribution_id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching distribution:', error);
        throw new Error('Distribution not found');
      }
      
      policyPack = data.policy_versions;
    }

    // Validate each tool disclosure
    const validationResults = disclosures.map(disclosure => {
      const { tool_name, version, provider, data_scope } = disclosure;
      
      // Find matching whitelist entry
      const whitelistEntry = policyPack.tool_whitelist?.find((entry: any) => 
        entry.name.toLowerCase() === tool_name.toLowerCase() &&
        entry.provider.toLowerCase() === (provider || '').toLowerCase()
      );

      if (!whitelistEntry) {
        return {
          tool_name,
          version,
          provider,
          status: 'RESTRICTED' as const,
          reasons: ['Tool not in approved whitelist'],
          failed_controls: ['TOOL_WHITELIST']
        };
      }

      const reasons: string[] = [];
      const failed_controls: string[] = [];

      // Check version compliance
      if (version && whitelistEntry.versions?.length > 0) {
        if (!whitelistEntry.versions.includes(version)) {
          reasons.push(`Version ${version} not approved. Approved versions: ${whitelistEntry.versions.join(', ')}`);
          failed_controls.push('VERSION_CONTROL');
        }
      }

      // Check data scope compliance
      if (data_scope) {
        if (data_scope.pii && !whitelistEntry.data_scope?.pii) {
          reasons.push('PII processing not permitted for this tool');
          failed_controls.push('PII_RESTRICTION');
        }
        
        if (data_scope.hipaa && !whitelistEntry.data_scope?.hipaa) {
          reasons.push('HIPAA data processing not permitted for this tool');
          failed_controls.push('HIPAA_RESTRICTION');
        }

        // Check regional restrictions
        if (data_scope.regions && whitelistEntry.data_scope?.regions) {
          const unauthorizedRegions = data_scope.regions.filter(
            region => !whitelistEntry.data_scope.regions.includes(region)
          );
          if (unauthorizedRegions.length > 0) {
            reasons.push(`Data processing not permitted in regions: ${unauthorizedRegions.join(', ')}`);
            failed_controls.push('REGIONAL_RESTRICTION');
          }
        }
      }

      // Determine status
      let status: 'COMPLIANT' | 'PENDING' | 'RESTRICTED';
      if (failed_controls.length > 0) {
        status = 'RESTRICTED';
      } else if (reasons.length > 0) {
        status = 'PENDING';
      } else {
        status = 'COMPLIANT';
      }

      return {
        tool_name,
        version,
        provider,
        status,
        reasons,
        failed_controls
      };
    });

    // Calculate overall score (percentage of compliant tools)
    const compliantCount = validationResults.filter(r => r.status === 'COMPLIANT').length;
    const overall_score = disclosures.length > 0 
      ? Math.round((compliantCount / disclosures.length) * 100)
      : 0;

    // Save resolution to database
    const { data: resolutionData, error: resolutionError } = await supabase
      .from('policy_resolutions')
      .insert({
        distribution_id,
        resolution_data: { items: validationResults },
        overall_score
      })
      .select()
      .single();

    if (resolutionError) {
      console.error('Error saving resolution:', resolutionError);
      throw new Error('Failed to save validation results');
    }

    console.log(`Validated ${disclosures.length} tools for distribution ${distribution_id}. Score: ${overall_score}%`);

    return new Response(
      JSON.stringify({
        success: true,
        resolution: {
          id: resolutionData.id,
          distribution_id,
          overall_score,
          items: validationResults,
          created_at: resolutionData.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-rfp-disclosures:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
