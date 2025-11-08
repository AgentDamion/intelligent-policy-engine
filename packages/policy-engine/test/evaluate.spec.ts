import { describe, it, expect } from 'vitest';
import { evaluate } from '../src/index.js';
import { ToolUsageEvent, PolicyRule, DecisionStatus } from '../src/types.js';

// --- Test Mocks ---
const mockEvent: ToolUsageEvent = {
  id: "evt-123",
  tool: { id: "T1", name: "Midjourney", version: "5.2.0" },
  actor: { role: "Junior Copywriter" },
  action: { type: "FinalAssetGeneration" as any },
  context: {
    tenantId: "t-abc",
    enterpriseId: "e-xyz",
    partnerId: "p-1",
    brand: "BrandX",
    region: "EU",
    channel: "DTC",
    policySnapshotId: "ps-001",
  },
  ts: new Date().toISOString(),
};

const policyRules: PolicyRule[] = [
  // Rule 1 (High Priority): Prohibit old versions of Midjourney
  {
    rule_id: "R1-PROHIBIT-OLD",
    name: "Prohibit Midjourney < 6.0.0 in EU",
    priority: 10, 
    is_active: true,
    context_id: "DTC-EU",
    conditions: {
      operator: "AND",
      clauses: [
        { field: "tool.name", operator: "equals", value: "Midjourney" },
        { field: "tool.version", operator: "semver_less_than", value: "6.0.0" },
        { field: "context.region", operator: "equals", value: "EU" }
      ],
    },
    decision: {
      status: DecisionStatus.enum.Prohibited,
      reason: "Asset generation with old versions is prohibited due to compliance risks.",
      audit_trigger: true,
    },
  },
  // Rule 2 (Lower Priority): Review for all final asset generation
  {
    rule_id: "R2-REVIEW-ALL",
    name: "Review all Final Asset Generation",
    priority: 50, 
    is_active: true,
    context_id: "All",
    conditions: {
      operator: "AND",
      clauses: [
        { field: "action.type", operator: "equals", value: "FinalAssetGeneration" }
      ],
    },
    decision: {
      status: DecisionStatus.enum.RequiresReview,
      reason: "All final assets require human review.",
    },
  },
  // Rule 3 (Low Priority): Approve certain roles
  {
    rule_id: "R3-APPROVE-SENIOR",
    name: "Approve Senior Copywriters",
    priority: 100, 
    is_active: true,
    context_id: "All",
    conditions: {
      operator: "AND",
      clauses: [
        { field: "actor.role", operator: "equals", value: "Senior Copywriter" }
      ],
    },
    decision: {
      status: DecisionStatus.enum.Approved,
      reason: "Senior staff are trusted for direct publication.",
    },
  },
];

// --- Tests ---
describe('Policy Engine: evaluate', () => {
  it('should return a default Verdict if no rule matches', () => {
    const event = { ...mockEvent, tool: { id: "T2", name: "DALL-E", version: "3.0.0" } };
    const verdict = evaluate(event, policyRules.filter(r => r.rule_id !== "R2-REVIEW-ALL"));
    expect(verdict.status).toBe(DecisionStatus.enum.RequiresReview);
    expect(verdict.rule_id).toBeUndefined();
    expect(verdict.reason).toContain('No matching rule');
  });

  it('should return the Verdict from the highest priority matching rule (R1)', () => {
    // Event matches R1 (Prohibited, Priority 10) AND R2 (RequiresReview, Priority 50)
    const verdict = evaluate(mockEvent, policyRules);
    expect(verdict.status).toBe(DecisionStatus.enum.Prohibited);
    expect(verdict.rule_id).toBe('R1-PROHIBIT-OLD');
  });

  it('should correctly evaluate semver_greater_than (R1: 6.0.0 > 5.2.0 is FALSE)', () => {
    // Simulate event with version 7.0.0. Should not match R1, and fall to R2.
    const event = { ...mockEvent, tool: { id: "T1", name: "Midjourney", version: "7.0.0" } };
    
    // R1: semver_less_than "6.0.0" -> FALSE
    // R2: matches action -> Verdict: RequiresReview
    const verdict = evaluate(event, policyRules);
    expect(verdict.status).toBe(DecisionStatus.enum.RequiresReview);
    expect(verdict.rule_id).toBe('R2-REVIEW-ALL');
  });

  it('should correctly evaluate semver_satisfies (new rule)', () => {
    const rule: PolicyRule = {
      rule_id: "R4-SATISFY",
      name: "Require version range",
      priority: 5,
      is_active: true,
      context_id: "All",
      conditions: {
        operator: "AND",
        clauses: [
          { field: "tool.version", operator: "semver_satisfies", value: ">=5.0.0 <6.0.0" }
        ],
      },
      decision: { status: DecisionStatus.enum.Approved, reason: "In safe range." },
    };
    
    // Version 5.2.0 satisfies the range
    const verdictSatisfied = evaluate(mockEvent, [rule]);
    expect(verdictSatisfied.status).toBe(DecisionStatus.enum.Approved);

    // Version 7.0.0 does NOT satisfy the range (falls through to default)
    const eventUnsatisfied = { ...mockEvent, tool: { id: "T1", name: "Midjourney", version: "7.0.0" } };
    const verdictUnsatisfied = evaluate(eventUnsatisfied, [rule]);
    expect(verdictUnsatisfied.status).toBe(DecisionStatus.enum.RequiresReview);
  });
  
  it('should correctly evaluate the IN operator', () => {
    const rule: PolicyRule = {
      rule_id: "R5-IN",
      name: "Allow only US/CA regions",
      priority: 5,
      is_active: true,
      context_id: "All",
      conditions: {
        operator: "AND",
        clauses: [
          { field: "context.region", operator: "in", value: ["US", "CA"] }
        ],
      },
      decision: { status: DecisionStatus.enum.Approved, reason: "US/CA allowed." },
    };
    
    // Event region is EU (does not match)
    const verdictEU = evaluate(mockEvent, [rule]);
    expect(verdictEU.status).toBe(DecisionStatus.enum.RequiresReview);
    
    // Event region is US (matches)
    const eventUS = { ...mockEvent, context: { ...mockEvent.context, region: "US" } };
    const verdictUS = evaluate(eventUS, [rule]);
    expect(verdictUS.status).toBe(DecisionStatus.enum.Approved);
  });
});

