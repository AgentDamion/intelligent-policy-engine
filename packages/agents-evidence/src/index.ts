import { createHash } from "crypto";

import { ToolUsageEvent, Verdict } from "@aicomplyr/shared";

export type EvidenceItem = {
  key: string;
  value: string;      // metadata value (non-sensitive)
};

export type ProofBundle = {
  bundleId: string;
  tenantId: string;
  policySnapshotId: string;
  eventId?: string;
  ruleId?: string;
  createdAt: string;
  items: EvidenceItem[];
  integrity: { sha256: string };
};

/**
 * Compiles a metadata-only Proof Bundle for audit and integrity checks.
 * No content, prompts, or assets are included—just verifiable metadata.
 */
export function compileProofBundle(
  event: ToolUsageEvent, 
  verdict: Verdict, 
  extra: Record<string,string> = {}
): ProofBundle {
  const items: EvidenceItem[] = [
    // Data from the ToolUsageEvent
    { key: "tool_id", value: event.tool.id },
    { key: "tool_name", value: event.tool.name },
    { key: "tool_version", value: event.tool.version },
    { key: "actor_role", value: event.actor.role },
    { key: "action_type", value: event.action.type.toString() }, // Ensure enum is stringified
    // Data from the Context
    { key: "enterprise_id", value: event.context.enterpriseId },
    { key: "brand", value: event.context.brand },
    { key: "region", value: event.context.region },
    { key: "channel", value: event.context.channel },
    // Data from the Verdict
    { key: "verdict_status", value: verdict.status.toString() }, // Ensure enum is stringified
    { key: "verdict_reason", value: verdict.reason },
    // Rule ID is optional on the Verdict
    ...(verdict.rule_id ? [{ key: "rule_id", value: verdict.rule_id }] : []),
    // Extra, user-provided metadata
    ...Object.entries(extra).map(([k,v]) => ({ key: k, value: v })),
  ];
  
  // Hash calculation: Items must be stringified predictably for a stable hash.
  const payloadForHash = JSON.stringify(items);
  const sha256 = createHash("sha256").update(payloadForHash).digest("hex");
  
  return {
    bundleId: `bundle_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, // MVP ID generation
    tenantId: event.context.tenantId,
    policySnapshotId: event.context.policySnapshotId,
    eventId: event.id,
    ruleId: verdict.rule_id,
    createdAt: new Date().toISOString(),
    items,
    integrity: { sha256 },
  };
}
