import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  tool_version_id: string;
  workspace_id: string;
  usage_context: {
    use_case?: string;
    data_classification?: string[];
    jurisdiction?: string[];
    user_role?: string;
  };
}

interface PolicyViolation {
  rule_id: string;
  severity: 'error' | 'warning';
  message: string;
  policy_instance_id: string;
  binding_id: string;
}

interface ValidationResponse {
  allowed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
  binding_ids_checked: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    // Use SERVICE_ROLE_KEY for cross-tenant validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { tool_version_id, workspace_id, usage_context }: ValidationRequest = await req.json();

    console.log('Validating AI usage:', { tool_version_id, workspace_id, usage_context });

    const EPS_FALLBACK = (Deno.env.get('EPS_FALLBACK_ENABLED') ?? 'true').toLowerCase() === 'true';

    // Get active runtime bindings with policy instance and EPS data
    const { data: bindings, error: bindingsError } = await supabaseClient
      .from('runtime_bindings')
      .select(`
        id,
        policy_instance_id,
        scope_path,
        status,
        policy_instances (
          id,
          use_case,
          jurisdiction,
          audience,
          pom,
          status,
          current_eps_id,
          enterprise_id,
          workspace_id
        )
      `)
      .eq('tool_version_id', tool_version_id)
      .eq('workspace_id', workspace_id)
      .eq('status', 'active');

    if (bindingsError) {
      console.error('Error fetching runtime bindings:', bindingsError);
      throw new Error('Failed to fetch policy bindings');
    }

    console.log(`Found ${bindings?.length || 0} active bindings`);

    const violations: PolicyViolation[] = [];
    const warnings: PolicyViolation[] = [];
    const binding_ids_checked: string[] = [];

    // If no bindings exist, allow by default (no policies applied)
    if (!bindings || bindings.length === 0) {
      console.log('No active policy bindings found, allowing usage');
      return new Response(
        JSON.stringify({
          allowed: true,
          violations: [],
          warnings: [{
            rule_id: 'no-policy',
            severity: 'warning',
            message: 'No policy bindings active for this tool. Consider creating a policy instance.',
            policy_instance_id: '',
            binding_id: ''
          }],
          binding_ids_checked: []
        } as ValidationResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate against each binding's policy (EPS-first)
    for (const binding of bindings) {
      binding_ids_checked.push(binding.id);
      const policyInstance = binding.policy_instances;

      if (!policyInstance || policyInstance.status !== 'approved') {
        warnings.push({
          rule_id: 'policy-not-approved',
          severity: 'warning',
          message: `Policy instance ${binding.policy_instance_id} is not approved`,
          policy_instance_id: binding.policy_instance_id,
          binding_id: binding.id
        });
        continue;
      }

      let pom: any | null = null;
      let epsId: string | null = null;
      let epsHash: string | null = null;

      // ✅ Phase 3.B: Prefer EPS
      if (policyInstance.current_eps_id) {
        const { data: epsData } = await supabaseClient
          .from('effective_policy_snapshots')
          .select('id, effective_pom, content_hash')
          .eq('id', policyInstance.current_eps_id)
          .single();

        if (epsData) {
          pom = epsData.effective_pom;
          epsId = epsData.id;
          epsHash = epsData.content_hash;
          console.log(`Using EPS ${epsId} (hash: ${epsHash.substring(0, 8)}...) for policy ${binding.policy_instance_id}`);
        }
      }

      // ✅ Fallback to raw POM if EPS missing (dual-read safety net)
      if (!pom && EPS_FALLBACK) {
        console.warn(`[VALIDATION] EPS missing for policy_instance=${binding.policy_instance_id}; using raw POM fallback`);
        pom = policyInstance.pom;
        epsHash = 'FALLBACK';

        // Log fallback event for monitoring
        await supabaseClient.from('audit_events').insert({
          event_type: 'EPS_MISSING_FALLBACK',
          entity_type: 'policy_instance',
          entity_id: binding.policy_instance_id,
          enterprise_id: policyInstance.enterprise_id,
          workspace_id: policyInstance.workspace_id,
          details: {
            workspace_id: policyInstance.workspace_id,
            tool_version_id,
            binding_id: binding.id
          }
        });
      }

      // ✅ Hard block if no enforceable policy
      if (!pom) {
        const violation: PolicyViolation = {
          rule_id: 'eps-missing',
          severity: 'error',
          message: `No Effective Policy Snapshot found for policy instance ${binding.policy_instance_id}. Policy must be activated to generate EPS.`,
          policy_instance_id: binding.policy_instance_id,
          binding_id: binding.id
        };
        violations.push(violation);

        // Log blocked validation event
        await supabaseClient.from('policy_validation_events').insert({
          enterprise_id: policyInstance.enterprise_id,
          tool_version_id,
          workspace_id,
          policy_instance_id: binding.policy_instance_id,
          eps_id: null,
          eps_hash: null,
          scope_path: binding.scope_path,
          decision: 'blocked',
          violations: [violation],
          warnings: [],
          usage_context,
          response_time_ms: Date.now() - startedAt
        });

        continue;
      }

      // === Policy Evaluation Logic (against POM) ===
      
      // Check jurisdiction compliance
      if (usage_context.jurisdiction && policyInstance.jurisdiction) {
        const hasValidJurisdiction = usage_context.jurisdiction.some(j => 
          policyInstance.jurisdiction.includes(j)
        );
        
        if (!hasValidJurisdiction) {
          const violation: PolicyViolation = {
            rule_id: 'jurisdiction-mismatch',
            severity: 'error',
            message: `Tool usage jurisdiction [${usage_context.jurisdiction.join(', ')}] not allowed by policy. Allowed: [${policyInstance.jurisdiction.join(', ')}]`,
            policy_instance_id: binding.policy_instance_id,
            binding_id: binding.id
          };
          violations.push(violation);
        }
      }

      // Check data classification controls
      if (pom?.data_controls?.data_classes && usage_context.data_classification) {
        const allowedClasses = pom.data_controls.data_classes;
        const unauthorizedData = usage_context.data_classification.filter(
          dc => !allowedClasses.includes(dc)
        );

        if (unauthorizedData.length > 0) {
          const violation: PolicyViolation = {
            rule_id: 'data-classification-violation',
            severity: 'error',
            message: `Unauthorized data classifications detected: ${unauthorizedData.join(', ')}. Policy allows: ${allowedClasses.join(', ')}`,
            policy_instance_id: binding.policy_instance_id,
            binding_id: binding.id
          };
          violations.push(violation);
        }
      }

      // Check HITL requirements
      if (pom?.controls?.hitl?.required && usage_context.user_role) {
        const allowedReviewers = pom.controls.hitl.reviewers || [];
        
        if (allowedReviewers.length > 0 && !allowedReviewers.includes(usage_context.user_role)) {
          const violation: PolicyViolation = {
            rule_id: 'hitl-reviewer-required',
            severity: 'error',
            message: `Human-in-the-loop review required. Your role [${usage_context.user_role}] is not authorized. Allowed reviewers: ${allowedReviewers.join(', ')}`,
            policy_instance_id: binding.policy_instance_id,
            binding_id: binding.id
          };
          violations.push(violation);
        }
      }

      // Check mandatory rules
      if (pom?.rules && Array.isArray(pom.rules)) {
        for (const rule of pom.rules) {
          if (rule.enforcement === 'mandatory') {
            console.log(`Checking mandatory rule: ${rule.id} - ${rule.description}`);
            
            if (rule.category === 'data-protection' && usage_context.data_classification) {
              const ruleWarning: PolicyViolation = {
                rule_id: rule.id,
                severity: 'warning',
                message: `Data protection rule active: ${rule.description}`,
                policy_instance_id: binding.policy_instance_id,
                binding_id: binding.id
              };
              warnings.push(ruleWarning);
            }
          }
        }
      }

      // ✅ Log validation event with EPS metadata
      const bindingViolations = violations.filter(v => v.binding_id === binding.id);
      const bindingWarnings = warnings.filter(w => w.binding_id === binding.id);
      const decision = bindingViolations.length === 0 ? 'allowed' : 'blocked';

      await supabaseClient.from('policy_validation_events').insert({
        enterprise_id: policyInstance.enterprise_id,
        tool_version_id,
        workspace_id,
        policy_instance_id: binding.policy_instance_id,
        eps_id: epsId,
        eps_hash: epsHash,
        scope_path: binding.scope_path,
        decision,
        violations: bindingViolations,
        warnings: bindingWarnings,
        usage_context,
        response_time_ms: Date.now() - startedAt
      });
    }

    // Update violation counts for bindings
    for (const bindingId of binding_ids_checked) {
      const bindingViolations = violations.filter(v => v.binding_id === bindingId);
      
      if (bindingViolations.length > 0) {
        const { error: updateError } = await supabaseClient
          .from('runtime_bindings')
          .update({
            last_violation_at: new Date().toISOString(),
          })
          .eq('id', bindingId);

        if (updateError) {
          console.error('Error updating violation timestamp:', updateError);
        }
      }
    }

    const allowed = violations.length === 0;

    console.log(`Validation result: ${allowed ? 'ALLOWED' : 'BLOCKED'}, ${violations.length} violations, ${warnings.length} warnings (${Date.now() - startedAt}ms)`);

    const response: ValidationResponse = {
      allowed,
      violations,
      warnings,
      binding_ids_checked
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in validate-ai-usage:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        allowed: false,
        violations: [{
          rule_id: 'system-error',
          severity: 'error',
          message: `System error during validation: ${error.message}`,
          policy_instance_id: '',
          binding_id: ''
        }],
        warnings: [],
        binding_ids_checked: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
