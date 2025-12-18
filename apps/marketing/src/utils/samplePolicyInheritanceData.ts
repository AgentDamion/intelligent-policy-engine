import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sample Policy Inheritance Data Generator
 * Creates hierarchical scopes, policies with inheritance modes, and intentional conflicts
 */
export async function insertSamplePolicyInheritanceData(): Promise<boolean> {
  try {
    // Get current user's enterprise
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to load sample data");
      return false;
    }

    // Get user's enterprise
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('enterprise_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!userRoles?.enterprise_id) {
      toast.error("No enterprise found for user");
      return false;
    }

    const enterpriseId = userRoles.enterprise_id;

    // Check if sample data already exists
    const { data: existingScopes } = await supabase
      .from('scopes')
      .select('id')
      .eq('enterprise_id', enterpriseId)
      .eq('scope_name', 'Acme Pharmaceuticals')
      .limit(1);

    if (existingScopes && existingScopes.length > 0) {
      toast.info("Sample data already exists");
      return true;
    }

    // Create hierarchical scopes
    const scopes = {
      enterprise: null as any,
      naRegion: null as any,
      euRegion: null as any,
      usCountry: null as any,
      caCountry: null as any,
      deCountry: null as any,
      usBrand: null as any,
      caBrand: null as any,
    };

    // 1. Enterprise scope (root)
    const { data: enterpriseScope, error: e1 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'Acme Pharmaceuticals',
        scope_type: 'enterprise',
        scope_path: 'acme',
        enterprise_id: enterpriseId,
        parent_id: null,
        metadata: { description: 'Global enterprise scope' }
      })
      .select()
      .single();

    if (e1 || !enterpriseScope) throw new Error('Failed to create enterprise scope');
    scopes.enterprise = enterpriseScope;

    // 2. North America Region
    const { data: naRegion, error: e2 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'North America',
        scope_type: 'region',
        scope_path: 'acme.na',
        enterprise_id: enterpriseId,
        parent_id: enterpriseScope.id,
        region: 'North America',
        metadata: { description: 'North American regional scope' }
      })
      .select()
      .single();

    if (e2 || !naRegion) throw new Error('Failed to create NA region');
    scopes.naRegion = naRegion;

    // 3. Europe Region
    const { data: euRegion, error: e3 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'Europe',
        scope_type: 'region',
        scope_path: 'acme.eu',
        enterprise_id: enterpriseId,
        parent_id: enterpriseScope.id,
        region: 'Europe',
        metadata: { description: 'European regional scope' }
      })
      .select()
      .single();

    if (e3 || !euRegion) throw new Error('Failed to create EU region');
    scopes.euRegion = euRegion;

    // 4. United States
    const { data: usCountry, error: e4 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'United States',
        scope_type: 'country',
        scope_path: 'acme.na.us',
        enterprise_id: enterpriseId,
        parent_id: naRegion.id,
        country_code: 'US',
        compliance_frameworks: ['HIPAA', 'FDA 21 CFR Part 11'],
        metadata: { description: 'United States country scope' }
      })
      .select()
      .single();

    if (e4 || !usCountry) throw new Error('Failed to create US country');
    scopes.usCountry = usCountry;

    // 5. Canada
    const { data: caCountry, error: e5 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'Canada',
        scope_type: 'country',
        scope_path: 'acme.na.ca',
        enterprise_id: enterpriseId,
        parent_id: naRegion.id,
        country_code: 'CA',
        compliance_frameworks: ['PIPEDA'],
        metadata: { description: 'Canada country scope' }
      })
      .select()
      .single();

    if (e5 || !caCountry) throw new Error('Failed to create CA country');
    scopes.caCountry = caCountry;

    // 6. Germany
    const { data: deCountry, error: e6 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'Germany',
        scope_type: 'country',
        scope_path: 'acme.eu.de',
        enterprise_id: enterpriseId,
        parent_id: euRegion.id,
        country_code: 'DE',
        compliance_frameworks: ['GDPR'],
        metadata: { description: 'Germany country scope' }
      })
      .select()
      .single();

    if (e6 || !deCountry) throw new Error('Failed to create DE country');
    scopes.deCountry = deCountry;

    // 7. AcmeCare US Brand
    const { data: usBrand, error: e7 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'AcmeCare US',
        scope_type: 'brand',
        scope_path: 'acme.na.us.acmecare',
        enterprise_id: enterpriseId,
        parent_id: usCountry.id,
        metadata: { description: 'AcmeCare US brand scope', brand_category: 'Healthcare' }
      })
      .select()
      .single();

    if (e7 || !usBrand) throw new Error('Failed to create US brand');
    scopes.usBrand = usBrand;

    // 8. AcmeCare CA Brand
    const { data: caBrand, error: e8 } = await (supabase
      .from('scopes') as any)
      .insert({
        scope_name: 'AcmeCare CA',
        scope_type: 'brand',
        scope_path: 'acme.na.ca.acmecare',
        enterprise_id: enterpriseId,
        parent_id: caCountry.id,
        metadata: { description: 'AcmeCare CA brand scope', brand_category: 'Healthcare' }
      })
      .select()
      .single();

    if (e8 || !caBrand) throw new Error('Failed to create CA brand');
    scopes.caBrand = caBrand;

    // Create policies with inheritance
    const policies = {
      enterprisePolicy: null as any,
      naPolicy: null as any,
      usPolicy: null as any,
      caPolicy: null as any,
      usBrandPolicy: null as any,
    };

    // 1. Enterprise Policy (root - no parent)
    const { data: enterprisePolicy, error: p1 } = await (supabase as any)
      .from('scoped_policies')
      .insert({
        scope_id: enterpriseScope.id,
        policy_name: 'Global AI Governance Policy',
        inheritance_mode: 'replace', // Root policy
        rules: {
          min_approvals: 3,
          data_retention_days: 365,
          allowed_ai_vendors: ['OpenAI', 'Anthropic', 'Google'],
          require_impact_assessment: true
        },
        enterprise_id: enterpriseId,
        created_by: user.id
      })
      .select()
      .single();

    if (p1 || !enterprisePolicy) throw new Error('Failed to create enterprise policy');
    policies.enterprisePolicy = enterprisePolicy;

    // 2. North America Regional Policy (MERGE mode)
    const { data: naPolicy, error: p2 } = await (supabase as any)
      .from('scoped_policies')
      .insert({
        scope_id: naRegion.id,
        policy_name: 'NA Privacy & Compliance Policy',
        inheritance_mode: 'merge',
        parent_policy_id: enterprisePolicy.id,
        rules: {
          pii_handling: 'strict',
          cross_border_transfer: false,
          data_residency_required: true
        },
        enterprise_id: enterpriseId,
        created_by: user.id
      })
      .select()
      .single();

    if (p2 || !naPolicy) throw new Error('Failed to create NA policy');
    policies.naPolicy = naPolicy;

    // 3. US Country Policy (MERGE mode - creates CONFLICT)
    const { data: usPolicy, error: p3 } = await (supabase as any)
      .from('scoped_policies')
      .insert({
        scope_id: usCountry.id,
        policy_name: 'US HIPAA Compliance Policy',
        inheritance_mode: 'merge',
        parent_policy_id: naPolicy.id,
        rules: {
          min_approvals: 4, // CONFLICT: Stricter than enterprise (3)
          hipaa_required: true,
          phi_encryption: 'AES-256',
          audit_trail_required: true
        },
        enterprise_id: enterpriseId,
        created_by: user.id
      })
      .select()
      .single();

    if (p3 || !usPolicy) throw new Error('Failed to create US policy');
    policies.usPolicy = usPolicy;

    // 4. Canada Country Policy (MERGE mode - creates CONFLICT)
    const { data: caPolicy, error: p4 } = await (supabase as any)
      .from('scoped_policies')
      .insert({
        scope_id: caCountry.id,
        policy_name: 'Canada PIPEDA Policy',
        inheritance_mode: 'merge',
        parent_policy_id: naPolicy.id,
        rules: {
          data_retention_days: 180, // CONFLICT: Looser than enterprise (365)
          pipeda_compliance: true,
          consent_required: true
        },
        enterprise_id: enterpriseId,
        created_by: user.id
      })
      .select()
      .single();

    if (p4 || !caPolicy) throw new Error('Failed to create CA policy');
    policies.caPolicy = caPolicy;

    // 5. US Brand Policy (APPEND mode)
    const { data: usBrandPolicy, error: p5 } = await (supabase as any)
      .from('scoped_policies')
      .insert({
        scope_id: usBrand.id,
        policy_name: 'AcmeCare US Brand Policy',
        inheritance_mode: 'append',
        parent_policy_id: usPolicy.id,
        override_rules: {
          allowed_tools: ['ChatGPT', 'Claude', 'Gemini'],
          brand_specific_controls: true
        },
        enterprise_id: enterpriseId,
        created_by: user.id
      })
      .select()
      .single();

    if (p5 || !usBrandPolicy) throw new Error('Failed to create US brand policy');
    policies.usBrandPolicy = usBrandPolicy;

    // Create intentional conflicts
    // Conflict 1: US min_approvals vs Enterprise
    await (supabase
      .from('policy_conflicts') as any)
      .insert({
        child_policy_id: usPolicy.id,
        parent_policy_id: enterprisePolicy.id,
        conflict_type: 'stricter',
        severity: 'warning',
        conflicting_rule: 'min_approvals',
        field_path: 'min_approvals',
        parent_value: 3,
        child_value: 4,
        description: 'US policy requires more approvals (4) than global policy (3). This is stricter but may slow down operations.',
        resolution_status: 'unresolved'
      });

    // Conflict 2: Canada data_retention vs Enterprise
    await (supabase
      .from('policy_conflicts') as any)
      .insert({
        child_policy_id: caPolicy.id,
        parent_policy_id: enterprisePolicy.id,
        conflict_type: 'looser',
        severity: 'error',
        conflicting_rule: 'data_retention_days',
        field_path: 'data_retention_days',
        parent_value: 365,
        child_value: 180,
        description: 'Canada policy retains data for fewer days (180) than required by global policy (365). This may violate compliance requirements.',
        resolution_status: 'unresolved'
      });

    toast.success("Sample policy hierarchy created successfully!");
    return true;
  } catch (error) {
    console.error("Error in sample data generation:", error);
    toast.error(`Failed to generate sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
