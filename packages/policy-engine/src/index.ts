import semver from "semver";
// Note: Imports from the shared package must be absolute workspace paths
import { PolicyRule, ToolUsageEvent, Verdict, get, DecisionStatus } from "@aicomplyr/shared";

function evalClause(event: ToolUsageEvent, clause: any): boolean {
  // Clause can be a leaf or a nested tree (ConditionTree)
  if ("operator" in clause && "clauses" in clause && Array.isArray(clause.clauses)) {
    // This is a ConditionTree (AND/OR logic)
    const op = clause.operator;
    const results = clause.clauses.map((c: any) => evalClause(event, c));
    return op === "AND" ? results.every(Boolean) : results.some(Boolean);
  }
  
  // This is a ConditionClause (Leaf comparison)
  const fieldVal = get(event, clause.field);
  const { operator, value } = clause;
  
  switch (operator) {
    case "equals": return fieldVal === value;
    case "not_equals": return fieldVal !== value;
    case "in": return Array.isArray(value) && value.includes(fieldVal);
    case "not_in": return Array.isArray(value) && !value.includes(fieldVal);
    
    // Semver comparison operators
    case "semver_less_than": 
      return semver.valid(fieldVal) && semver.valid(value) ? semver.lt(fieldVal, value) : false;
    case "semver_greater_than": 
      return semver.valid(fieldVal) && semver.valid(value) ? semver.gt(fieldVal, value) : false;
    case "semver_satisfies": 
      return semver.valid(fieldVal) && typeof value === "string" ? semver.satisfies(fieldVal, value) : false;
      
    default: return false;
  }
}

export function evaluate(event: ToolUsageEvent, rules: PolicyRule[]): Verdict {
  // 1. Filter out inactive rules
  // 2. Sort by priority (lower number = higher priority)
  const active = rules.filter(r => r.is_active).sort((a,b) => a.priority - b.priority);
  
  for (const rule of active) {
    if (evalClause(event, rule.conditions)) {
      // The first matching rule by priority determines the Verdict
      return {
        status: rule.decision.status,
        reason: rule.decision.reason,
        rule_id: rule.rule_id,
        policySnapshotId: event.context.policySnapshotId,
      };
    }
  }
  
  // Default verdict if no rule matches
  return {
    status: DecisionStatus.enum.RequiresReview,
    reason: "No matching rule; defaulting to human review",
    policySnapshotId: event.context.policySnapshotId,
  };
}
