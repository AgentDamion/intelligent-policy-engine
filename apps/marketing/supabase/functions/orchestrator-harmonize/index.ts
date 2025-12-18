import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
const PolicyRuleSchema = z.object({
  id: z.string(),
  type: z.string(),
  condition: z.any(),
  action: z.string(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
  message: z.string().optional(),
  priority: z.number().optional(),
  source: z.string().optional(), // Which policy set this rule came from
});

const HarmonizeRequestSchema = z.object({
  rulesA: z.array(PolicyRuleSchema),
  rulesB: z.array(PolicyRuleSchema),
  strategy: z.enum(['merge', 'strict', 'permissive']).optional(),
});

type PolicyRule = z.infer<typeof PolicyRuleSchema>;

interface Conflict {
  type: 'contradiction' | 'overlap' | 'priority_mismatch';
  severity: 'high' | 'medium' | 'low';
  ruleA: PolicyRule;
  ruleB: PolicyRule;
  description: string;
  resolution_suggestion: string;
}

interface HarmonizedResult {
  combined: PolicyRule[];
  conflicts: Conflict[];
  metadata: {
    total_rules_a: number;
    total_rules_b: number;
    combined_count: number;
    conflict_count: number;
    strategy: string;
    harmonized_at: string;
  };
}

// Harmonize two sets of policy rules
function harmonizePolicies(
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive' = 'merge'
): HarmonizedResult {
  console.log(`Harmonizing ${rulesA.length} rules (A) with ${rulesB.length} rules (B) using strategy: ${strategy}`);
  
  const combined: PolicyRule[] = [];
  const conflicts: Conflict[] = [];
  const processedRules = new Set<string>();
  
  // Tag source for tracking
  const taggedRulesA = rulesA.map(r => ({ ...r, source: r.source || 'policy_a' }));
  const taggedRulesB = rulesB.map(r => ({ ...r, source: r.source || 'policy_b' }));
  
  // Group rules by type for comparison
  const rulesByType = new Map<string, { a: PolicyRule[], b: PolicyRule[] }>();
  
  for (const rule of taggedRulesA) {
    if (!rulesByType.has(rule.type)) {
      rulesByType.set(rule.type, { a: [], b: [] });
    }
    rulesByType.get(rule.type)!.a.push(rule);
  }
  
  for (const rule of taggedRulesB) {
    if (!rulesByType.has(rule.type)) {
      rulesByType.set(rule.type, { a: [], b: [] });
    }
    rulesByType.get(rule.type)!.b.push(rule);
  }
  
  // Process each rule type
  for (const [type, { a, b }] of rulesByType) {
    if (a.length === 0 && b.length === 0) continue;
    
    if (a.length === 0) {
      // Only B has rules for this type
      combined.push(...b);
      processedRules.add(type);
      continue;
    }
    
    if (b.length === 0) {
      // Only A has rules for this type
      combined.push(...a);
      processedRules.add(type);
      continue;
    }
    
    // Both A and B have rules of this type - need to harmonize
    const { harmonized, typeConflicts } = harmonizeRuleType(type, a, b, strategy);
    combined.push(...harmonized);
    conflicts.push(...typeConflicts);
    processedRules.add(type);
  }
  
  // Sort combined rules by priority (if available) and type
  combined.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.type.localeCompare(b.type);
  });
  
  return {
    combined,
    conflicts,
    metadata: {
      total_rules_a: rulesA.length,
      total_rules_b: rulesB.length,
      combined_count: combined.length,
      conflict_count: conflicts.length,
      strategy,
      harmonized_at: new Date().toISOString(),
    },
  };
}

function harmonizeRuleType(
  type: string,
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive'
): { harmonized: PolicyRule[], typeConflicts: Conflict[] } {
  const harmonized: PolicyRule[] = [];
  const typeConflicts: Conflict[] = [];
  
  console.log(`Harmonizing ${rulesA.length} + ${rulesB.length} rules of type: ${type}`);
  
  switch (type) {
    case 'jurisdiction':
      return harmonizeJurisdictionRules(rulesA, rulesB, strategy);
    case 'data_classification':
      return harmonizeDataClassificationRules(rulesA, rulesB, strategy);
    case 'use_case':
      return harmonizeUseCaseRules(rulesA, rulesB, strategy);
    case 'version_constraint':
      return harmonizeVersionConstraintRules(rulesA, rulesB, strategy);
    default:
      return harmonizeGenericRules(rulesA, rulesB, strategy);
  }
}

function harmonizeJurisdictionRules(
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive'
): { harmonized: PolicyRule[], typeConflicts: Conflict[] } {
  const harmonized: PolicyRule[] = [];
  const conflicts: Conflict[] = [];
  
  // Collect all allowed and denied jurisdictions
  const allowedA = new Set<string>();
  const deniedA = new Set<string>();
  const allowedB = new Set<string>();
  const deniedB = new Set<string>();
  
  rulesA.forEach(r => {
    r.condition?.allowed?.forEach((j: string) => allowedA.add(j));
    r.condition?.denied?.forEach((j: string) => deniedA.add(j));
  });
  
  rulesB.forEach(r => {
    r.condition?.allowed?.forEach((j: string) => allowedB.add(j));
    r.condition?.denied?.forEach((j: string) => deniedB.add(j));
  });
  
  // Check for conflicts (jurisdiction in both allowed and denied)
  const conflictingJurisdictions = new Set<string>();
  
  for (const j of allowedA) {
    if (deniedB.has(j)) {
      conflictingJurisdictions.add(j);
      conflicts.push({
        type: 'contradiction',
        severity: 'high',
        ruleA: rulesA[0],
        ruleB: rulesB[0],
        description: `Jurisdiction "${j}" is allowed in Policy A but denied in Policy B`,
        resolution_suggestion: strategy === 'strict' 
          ? 'Apply most restrictive rule (deny)'
          : strategy === 'permissive'
            ? 'Apply least restrictive rule (allow)'
            : 'Manual review required',
      });
    }
  }
  
  for (const j of allowedB) {
    if (deniedA.has(j)) {
      conflictingJurisdictions.add(j);
      conflicts.push({
        type: 'contradiction',
        severity: 'high',
        ruleA: rulesA[0],
        ruleB: rulesB[0],
        description: `Jurisdiction "${j}" is denied in Policy A but allowed in Policy B`,
        resolution_suggestion: strategy === 'strict' 
          ? 'Apply most restrictive rule (deny)'
          : strategy === 'permissive'
            ? 'Apply least restrictive rule (allow)'
            : 'Manual review required',
      });
    }
  }
  
  // Build harmonized rule based on strategy
  let finalAllowed: string[];
  let finalDenied: string[];
  
  switch (strategy) {
    case 'strict':
      // Intersection of allowed, union of denied
      finalAllowed = Array.from(allowedA).filter(j => allowedB.has(j) && !conflictingJurisdictions.has(j));
      finalDenied = Array.from(new Set([...deniedA, ...deniedB]));
      break;
    case 'permissive':
      // Union of allowed, intersection of denied
      finalAllowed = Array.from(new Set([...allowedA, ...allowedB]));
      finalDenied = Array.from(deniedA).filter(j => deniedB.has(j) && !conflictingJurisdictions.has(j));
      break;
    case 'merge':
    default:
      // Union of both, but prioritize denied for conflicts
      finalAllowed = Array.from(new Set([...allowedA, ...allowedB])).filter(j => !conflictingJurisdictions.has(j));
      finalDenied = Array.from(new Set([...deniedA, ...deniedB, ...conflictingJurisdictions]));
  }
  
  harmonized.push({
    id: `harmonized_jurisdiction_${Date.now()}`,
    type: 'jurisdiction',
    condition: {
      allowed: finalAllowed,
      denied: finalDenied,
    },
    action: 'enforce',
    severity: 'error',
    message: 'Harmonized jurisdiction policy',
    source: 'harmonized',
  });
  
  return { harmonized, typeConflicts: conflicts };
}

function harmonizeDataClassificationRules(
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive'
): { harmonized: PolicyRule[], typeConflicts: Conflict[] } {
  // Similar logic to jurisdiction harmonization
  const harmonized: PolicyRule[] = [];
  const conflicts: Conflict[] = [];
  
  const allowedA = new Set<string>();
  const allowedB = new Set<string>();
  
  rulesA.forEach(r => r.condition?.allowed?.forEach((dc: string) => allowedA.add(dc)));
  rulesB.forEach(r => r.condition?.allowed?.forEach((dc: string) => allowedB.add(dc)));
  
  let finalAllowed: string[];
  
  switch (strategy) {
    case 'strict':
      finalAllowed = Array.from(allowedA).filter(dc => allowedB.has(dc));
      break;
    case 'permissive':
      finalAllowed = Array.from(new Set([...allowedA, ...allowedB]));
      break;
    case 'merge':
    default:
      finalAllowed = Array.from(new Set([...allowedA, ...allowedB]));
  }
  
  harmonized.push({
    id: `harmonized_data_classification_${Date.now()}`,
    type: 'data_classification',
    condition: { allowed: finalAllowed },
    action: 'enforce',
    severity: 'warning',
    message: 'Harmonized data classification policy',
    source: 'harmonized',
  });
  
  return { harmonized, typeConflicts: conflicts };
}

function harmonizeUseCaseRules(
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive'
): { harmonized: PolicyRule[], typeConflicts: Conflict[] } {
  // Similar to other harmonization functions
  const harmonized: PolicyRule[] = [...rulesA, ...rulesB];
  return { harmonized, typeConflicts: [] };
}

function harmonizeVersionConstraintRules(
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive'
): { harmonized: PolicyRule[], typeConflicts: Conflict[] } {
  const harmonized: PolicyRule[] = [...rulesA, ...rulesB];
  return { harmonized, typeConflicts: [] };
}

function harmonizeGenericRules(
  rulesA: PolicyRule[],
  rulesB: PolicyRule[],
  strategy: 'merge' | 'strict' | 'permissive'
): { harmonized: PolicyRule[], typeConflicts: Conflict[] } {
  // Generic fallback: just combine all rules
  const harmonized: PolicyRule[] = [...rulesA, ...rulesB];
  return { harmonized, typeConflicts: [] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    console.log('Harmonization request:', {
      rules_a_count: body.rulesA?.length,
      rules_b_count: body.rulesB?.length,
      strategy: body.strategy,
    });

    const validated = HarmonizeRequestSchema.parse(body);
    const result = harmonizePolicies(
      validated.rulesA,
      validated.rulesB,
      validated.strategy || 'merge'
    );

    console.log('Harmonization complete:', {
      combined_count: result.combined.length,
      conflict_count: result.conflicts.length,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Harmonization error:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: error.issues,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
