// import semver from "semver"; // Reserved for future use

import { z } from "zod";
import { PolicyRule, DecisionStatus, TelemetryAtom } from "@aicomplyr/shared";

export type HarmonizeResult = {
  combined: PolicyRule[];   // synthesized, stricter composite
  conflicts: { ruleA: string; ruleB: string; field: string; detail: string }[];
};

// Function to rank decisions: Prohibited (3) > RequiresReview (2) > Approved (1)
function decisionRank(s: z.infer<typeof DecisionStatus>): number { 
    return s === "Prohibited" ? 3 : s === "RequiresReview" ? 2 : 1; 
}

/**
 * Policy Harmonization Agent: Given two rule sets (A, B), produces a stricter-wins intersection.
 * MVP approach: prioritize the strictest decision for rules covering the same key.
 */
export function harmonizePolicies(a: PolicyRule[], b: PolicyRule[]): HarmonizeResult {
  const conflicts: HarmonizeResult["conflicts"] = [];
  const combined: PolicyRule[] = [];
  const all = [...a, ...b];
  
  // Group rules by a normalized key (context_id + rule name, for simplicity)
  const byKey = new Map<string, PolicyRule[]>();
  for (const r of all) {
    const key = `${r.context_id}::${r.name}`;
    byKey.set(key, [...(byKey.get(key) || []), r]);
  }
  
  for (const [_key, rules] of byKey.entries()) {
    if (rules.length === 1) { combined.push(rules[0]); continue; }
    
    // Choose the highest-priority rule based on decision ranking, then numerical priority
    const strictest = rules.sort((r1, r2) => {
      const d = decisionRank(r2.decision.status) - decisionRank(r1.decision.status);
      return d !== 0 ? d : r1.priority - r2.priority;
    })[0];
    
    combined.push(strictest);
    
    // Record conflicts where a less-strict decision was overridden
    for (const r of rules) {
      if (r !== strictest && decisionRank(r.decision.status) < decisionRank(strictest.decision.status)) {
        conflicts.push({ 
          ruleA: strictest.rule_id, 
          ruleB: r.rule_id, 
          field: "decision", 
          detail: `${r.decision.status} overridden by ${strictest.decision.status}` 
        });
      }
    }
  }
  
  return { combined, conflicts };
}

// ---------- Risk Prediction ----------

/**
 * Risk Prediction Agent: Scores risk based on historical telemetry atoms.
 * (Placeholder for future ML Learning Plane integration).
 */
export function scoreRisk(atoms: TelemetryAtom[], opts: { region?: string, toolId?: string } = {}): number {
  const filtered = atoms.filter(a =>
    (!opts.region || a.region_id === opts.region) &&
    (!opts.toolId || a.tool_id === opts.toolId)
  );
  if (!filtered.length) return 0.2; // Neutral, low risk default
  
  const failRate = filtered.filter(a => a.outcome === "fail").length / filtered.length;
  const remediatedRate = filtered.filter(a => a.outcome === "remediated").length / filtered.length;
  
  // Heuristic: Base risk is fails, reduced by remediation success.
  // We use (1 - remediatedRate) to increase risk if remediation often fails (low success rate).
  const risk = failRate * 0.7 + (1 - remediatedRate) * 0.3;
  
  return Math.min(0.95, Math.max(0.05, risk)); // Clamp risk between 0.05 and 0.95
}

// ---------- Escalation ----------

export type Escalation = {
  level: "Reviewer" | "ComplianceLead" | "Legal";
  reason: string;
  metadata?: Record<string,string>;
};

/**
 * Escalation Agent: Routes edge cases (conflicts or high risk) to human reviewers.
 */
export function escalateIfNeeded(conflicts: HarmonizeResult["conflicts"], riskScore: number): Escalation | null {
  if (conflicts.length > 0) {
    return { 
      level: "ComplianceLead", 
      reason: "Policy conflict detected during harmonization", 
      metadata: { conflicts: String(conflicts.length), example_rule: conflicts[0].ruleA } 
    };
  }
  if (riskScore >= 0.7) {
    return { 
      level: "ComplianceLead", 
      reason: "High predicted failure risk (Risk Score >= 0.7)", 
      metadata: { risk: riskScore.toFixed(2) } 
    };
  }
  if (riskScore >= 0.5) {
     return { 
      level: "Reviewer", 
      reason: "Medium predicted failure risk (Risk Score >= 0.5)", 
      metadata: { risk: riskScore.toFixed(2) } 
    };
  }
  return null;
}
