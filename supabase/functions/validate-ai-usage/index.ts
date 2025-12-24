import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { withAuth } from "../shared/auth-context.ts";

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

  return await withAuth(
    req,
    async (authCtx) => {
      const startedAt = Date.now();

      // Use SERVICE_ROLE_KEY for reads/writes, but DO NOT trust request context.
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const serviceKey =
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY') ?? '';
      const supabaseAdmin = createClient(supabaseUrl, serviceKey);

      const { tool_version_id, workspace_id, usage_context }: ValidationRequest = await req.json();

      console.log('[validate-ai-usage] request:', {
        tool_version_id,
        workspace_id,
        enterprise_id: authCtx.enterpriseId,
        user_id: authCtx.userId,
        is_service_role: authCtx.isServiceRole,
      });

      // ---------------------------------------------------------------------
      // Tenant validation (P1 hardening)
      // ---------------------------------------------------------------------
      // If this is not a trusted service role invocation, enforce membership
      // and workspace-to-enterprise binding before any privileged access.
      if (!authCtx.isServiceRole) {
        // 1) Validate enterprise membership
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from('enterprise_members')
          .select('enterprise_id')
          .eq('user_id', authCtx.userId)
          .eq('enterprise_id', authCtx.enterpriseId)
          .maybeSingle();

        if (membershipError || !membership) {
          await supabaseAdmin.from('agent_activities').insert({
            agent: 'security-guard',
            action: 'validate_ai_usage.denied.no_membership',
            status: 'warning',
            enterprise_id: authCtx.enterpriseId,
            workspace_id,
            details: {
              reason: 'user_not_enterprise_member',
              user_id: authCtx.userId,
              enterprise_id: authCtx.enterpriseId,
              tool_version_id,
            },
          });

          return new Response(JSON.stringify({ error: 'forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // 2) Validate workspace belongs to the authenticated enterprise
        const { data: ws, error: wsError } = await supabaseAdmin
          .from('workspaces')
          .select('id, enterprise_id')
          .eq('id', workspace_id)
          .maybeSingle();

        if (wsError || !ws) {
          await supabaseAdmin.from('agent_activities').insert({
            agent: 'security-guard',
            action: 'validate_ai_usage.denied.workspace_not_found',
            status: 'warning',
            enterprise_id: authCtx.enterpriseId,
            workspace_id,
            details: {
              reason: 'workspace_not_found',
              user_id: authCtx.userId,
              enterprise_id: authCtx.enterpriseId,
              tool_version_id,
            },
          });

          return new Response(JSON.stringify({ error: 'forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (ws.enterprise_id !== authCtx.enterpriseId) {
          await supabaseAdmin.from('agent_activities').insert({
            agent: 'security-guard',
            action: 'validate_ai_usage.denied.workspace_enterprise_mismatch',
            status: 'warning',
            enterprise_id: authCtx.enterpriseId,
            workspace_id,
            details: {
              reason: 'workspace_enterprise_mismatch',
              user_id: authCtx.userId,
              enterprise_id_claimed: authCtx.enterpriseId,
              enterprise_id_workspace: ws.enterprise_id,
              tool_version_id,
            },
          });

          return new Response(JSON.stringify({ error: 'forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

    const EPS_FALLBACK = (Deno.env.get('EPS_FALLBACK_ENABLED') ?? 'true').toLowerCase() === 'true';

    // Get active runtime bindings with policy instance and EPS data
    const { data: bindings, error: bindingsError } = await supabaseAdmin
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
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch policy bindings',
          details: {
            message: bindingsError.message,
            code: (bindingsError as any).code ?? null,
          },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
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
        const { data: epsData } = await supabaseAdmin
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
        await supabaseAdmin.from('audit_events').insert({
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
        await supabaseAdmin.from('policy_validation_events').insert({
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

      await supabaseAdmin.from('policy_validation_events').insert({
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
        const { error: updateError } = await supabaseAdmin
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

    },
    {
      corsHeaders,
      // Allow internal automation to call this endpoint with service key.
      // Non-service callers must pass JWT and will be membership-validated.
      allowServiceRoleBypass: true,
    },
  );
});
