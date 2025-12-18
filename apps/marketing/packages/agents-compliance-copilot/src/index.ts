import semver from "semver";
import { ToolUsageEvent, Verdict, Suggestion, PolicyRule } from "@aicomplyr/shared";

// Configuration type, usually loaded from a tenant's database or config service
type CopilotConfig = {
  allowedTools?: { id: string; name: string; versionRange?: string }[]; // from tenant's registry for this context
  remediationPlaybooks?: Record<string, { message: string }>;           // clause_id -> remediation
};

export function suggestFixes(
  event: ToolUsageEvent,
  verdict: Verdict,
  rules: PolicyRule[],
  cfg: CopilotConfig = {}
): Suggestion[] {
  // If the verdict is Approved, no suggestions are needed.
  if (verdict.status === "Approved") return [];
  
  const out: Suggestion[] = [];

  // 1) Version bump if semver violation is likely
  const toolRules = rules.filter(r => JSON.stringify(r.conditions).includes("tool.version"));
  
  for (const r of toolRules) {
    const ruleString = JSON.stringify(r.conditions);

    // Naive check for 'semver_less_than' violation
    if (ruleString.includes("semver_less_than")) {
      // Use regex to extract the value associated with the operator
      const m = ruleString.match(/"semver_less_than","value":"([^"]+)"/);
      const requiredVersion = m ? m[1] : null;

      if (requiredVersion && semver.valid(requiredVersion) && semver.valid(event.tool.version)) {
        // If the current version is less than the required version (i.e., it violates the rule)
        if (semver.lt(event.tool.version, requiredVersion)) {
          out.push({
            type: "VersionBump",
            message: `Use ${event.tool.name} v${requiredVersion} or higher to avoid policy violation.`,
            confidence: 0.8,
          });
        }
      }
    }
    
    // Naive check for 'semver_satisfies' violation
    if (ruleString.includes("semver_satisfies")) {
      const m = ruleString.match(/"semver_satisfies","value":"([^"]+)"/);
      const requiredRange = m ? m[1] : null;

      if (requiredRange && semver.valid(event.tool.version) && !semver.satisfies(event.tool.version, requiredRange)) {
        out.push({
          type: "VersionBump",
          message: `Use ${event.tool.name} version satisfying "${requiredRange}". Your current version (${event.tool.version}) is outside this range.`,
          confidence: 0.7,
        });
      }
    }
  }

  // 2) Suggest approved alternatives
  if (cfg.allowedTools?.length) {
    // Filter out the currently used tool
    const alts = cfg.allowedTools.filter(t => 
      t.id !== event.tool.id && 
      (!t.versionRange || semver.valid(event.tool.version) || !semver.validRange(t.versionRange))
    );
    
    if (alts.length) {
      out.push({
        type: "AlternativeTool",
        message: `Try an approved alternative: ${alts.map(a => `${a.name}${a.versionRange ? ` (${a.versionRange})` : ""}`).join(", ")}.`,
        confidence: 0.6,
      });
    }
  }

  // 3) Add evidence hints (from remediation playbooks)
  // This assumes the remediation Playbook key (clause_id) is always relevant on Prohibited/RequiresReview
  const rem = cfg.remediationPlaybooks || {};
  Object.values(rem).forEach(r => out.push({ type: "AddEvidence", message: r.message, confidence: 0.6 }));

  // 4) Fallback to route to review
  if (!out.length) {
    out.push({ 
      type: "RouteToReview", 
      message: "No specific remediation found. Route to reviewer with context + rationale for manual approval.", 
      confidence: 0.9 
    });
  }
  return out;
}
