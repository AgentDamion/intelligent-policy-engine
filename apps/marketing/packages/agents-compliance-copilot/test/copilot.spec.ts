import { describe, it, expect } from 'vitest';
import { suggestFixes } from '../src/index.js';
import { ToolUsageEvent, Verdict, DecisionStatus, PolicyRule } from '@aicomplyr/shared';

// --- Test Mocks ---
const mockEvent: ToolUsageEvent = {
  id: "evt-456",
  tool: { id: "T-MJ", name: "Midjourney", version: "5.2.0" },
  actor: { role: "Designer" },
  action: { type: "FinalAssetGeneration" as any },
  context: {
    tenantId: "t-abc",
    enterpriseId: "e-xyz",
    partnerId: "p-1",
    brand: "BrandX",
    region: "EU",
    channel: "DTC",
    policySnapshotId: "ps-002",
  },
  ts: new Date().toISOString(),
};

const prohibitedVerdict: Verdict = {
  status: DecisionStatus.enum.Prohibited,
  reason: "Version violation.",
  rule_id: "R-VERSION-01",
  policySnapshotId: mockEvent.context.policySnapshotId,
};

const requiresReviewVerdict: Verdict = {
  status: DecisionStatus.enum.RequiresReview,
  reason: "Generic review required.",
  rule_id: "R-REVIEW-01",
  policySnapshotId: mockEvent.context.policySnapshotId,
};

const mockRules: PolicyRule[] = [
  // Rule that causes the prohibited verdict (semver_less_than)
  {
    rule_id: "R-VERSION-01",
    name: "Prohibit Midjourney < 6.0.0",
    priority: 10, 
    is_active: true,
    context_id: "All",
    conditions: {
      operator: "AND",
      clauses: [
        { field: "tool.name", operator: "equals", value: "Midjourney" },
        { field: "tool.version", operator: "semver_less_than", value: "6.0.0" }
      ],
    },
    decision: { status: DecisionStatus.enum.Prohibited, reason: "Too old." },
  },
  // Rule for an alternative tool (not semver related)
  {
    rule_id: "R-ALT-02",
    name: "Prohibit all non-Adobe tools",
    priority: 20, 
    is_active: true,
    context_id: "All",
    conditions: {
      operator: "AND",
      clauses: [
        { field: "tool.category", operator: "not_in", value: ["Adobe"] }
      ],
    },
    decision: { status: DecisionStatus.enum.Prohibited, reason: "Vendor restriction." },
  },
];

const mockConfig = {
  allowedTools: [
    { id: "T-PS", name: "Photoshop", versionRange: ">=2024.0.0" },
    { id: "T-F", name: "Firefly" },
  ],
  remediationPlaybooks: {
    "clause-123": { message: "Attach the approved legal disclaimer." },
  },
};

// --- Tests ---
describe('Compliance Copilot Agent: suggestFixes', () => {
  it('should return empty suggestions for an Approved verdict', () => {
    const approvedVerdict: Verdict = { ...prohibitedVerdict, status: DecisionStatus.enum.Approved };
    const suggestions = suggestFixes(mockEvent, approvedVerdict, mockRules, mockConfig);
    expect(suggestions).toEqual([]);
  });

  it('should suggest a VersionBump when a semver_less_than rule is violated', () => {
    // Current tool version is 5.2.0, Rule R-VERSION-01 prohibits < 6.0.0
    const suggestions = suggestFixes(mockEvent, prohibitedVerdict, mockRules, mockConfig);
    
    const versionBump = suggestions.find(s => s.type === 'VersionBump');
    expect(versionBump).toBeDefined();
    expect(versionBump?.message).toContain('Use Midjourney v6.0.0 or higher');
    expect(versionBump?.confidence).toBe(0.8);
  });

  it('should suggest an AlternativeTool when allowed alternatives are configured', () => {
    const suggestions = suggestFixes(mockEvent, prohibitedVerdict, mockRules, mockConfig);
    
    const altTool = suggestions.find(s => s.type === 'AlternativeTool');
    expect(altTool).toBeDefined();
    expect(altTool?.message).toContain('Try an approved alternative: Photoshop (>=2024.0.0), Firefly');
    expect(altTool?.confidence).toBe(0.6);
  });

  it('should suggest AddEvidence from remediation playbooks', () => {
    const suggestions = suggestFixes(mockEvent, prohibitedVerdict, mockRules, mockConfig);
    
    const addEvidence = suggestions.find(s => s.type === 'AddEvidence');
    expect(addEvidence).toBeDefined();
    expect(addEvidence?.message).toBe('Attach the approved legal disclaimer.');
  });
  
  it('should fallback to RouteToReview if no specific suggestions are generated', () => {
    const minimalConfig = { allowedTools: [] };
    const suggestions = suggestFixes(mockEvent, requiresReviewVerdict, [], minimalConfig);
    
    // We pass an empty rule set, so no VersionBump or Evidence is generated.
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].type).toBe('RouteToReview');
    expect(suggestions[0].confidence).toBe(0.9);
  });
});

