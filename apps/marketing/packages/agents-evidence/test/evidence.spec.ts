import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { compileProofBundle } from '../src/index.js';

import { ToolUsageEvent, Verdict, DecisionStatus, ActionType } from '@aicomplyr/shared';

// --- Test Mocks ---
const mockEvent: ToolUsageEvent = {
  id: "evt-789",
  tool: { id: "T-ML", name: "Claude", version: "3.0.0" },
  actor: { role: "Product Manager" },
  action: { type: ActionType.enum.Research, note: "Q3 planning" }, // Use ActionType enum
  context: {
    tenantId: "t-abc",
    enterpriseId: "e-xyz",
    partnerId: "p-1",
    brand: "BrandY",
    region: "APAC",
    channel: "InternalConcept",
    policySnapshotId: "ps-003",
  },
  ts: "2025-11-06T10:00:00.000Z",
};

const mockVerdict: Verdict = {
  status: DecisionStatus.enum.Approved,
  reason: "No policy violation detected.",
  rule_id: "R-PASS-01",
  policySnapshotId: mockEvent.context.policySnapshotId,
};

// --- Tests ---
describe('Evidence Agent: compileProofBundle', () => {
  // Mock Date/Time and Randomness to ensure stable output for hash testing
  const MOCK_DATE = new Date('2025-01-01T10:00:00.000Z');
  const MOCK_ISO_STRING = MOCK_DATE.toISOString();
  const ORIGINAL_DATE_NOW = Date.now;
  const ORIGINAL_TO_ISO_STRING = Date.prototype.toISOString;
  const ORIGINAL_MATH_RANDOM = Math.random;


  beforeAll(() => {
    // @ts-ignore
    global.Date.now = () => MOCK_DATE.getTime();
    // @ts-ignore
    Date.prototype.toISOString = function() { return MOCK_ISO_STRING; };
    // @ts-ignore
    global.Math.random = () => 0.123456789; 
  });

  afterAll(() => {
    // Restore original functions
    global.Date.now = ORIGINAL_DATE_NOW;
    // @ts-ignore
    Date.prototype.toISOString = ORIGINAL_TO_ISO_STRING;
    global.Math.random = ORIGINAL_MATH_RANDOM;
  });
  
  it('should compile a bundle containing only verifiable metadata keys (no content)', () => {
    const bundle = compileProofBundle(mockEvent, mockVerdict, { custom_field: "value_xyz" });
    
    // Check for presence of core metadata keys
    const keys = bundle.items.map(i => i.key);
    expect(keys).toContain('tool_id');
    expect(keys).toContain('actor_role');
    expect(keys).toContain('action_type');
    expect(keys).toContain('verdict_status');
    expect(keys).toContain('rule_id');
    expect(keys).toContain('custom_field');

    // Ensure action type is correctly recorded from the enum
    const actionType = bundle.items.find(i => i.key === 'action_type');
    expect(actionType?.value).toBe(mockEvent.action.type);
    
    // Check that sensitive content fields are explicitly excluded (e.g., action.note)
    expect(keys).not.toContain('note'); 
  });

  it('should produce a stable SHA-256 hash for identical inputs', () => {
    const bundle1 = compileProofBundle(mockEvent, mockVerdict);
    const bundle2 = compileProofBundle(mockEvent, mockVerdict);
    
    expect(bundle1.integrity.sha256).toBe(bundle2.integrity.sha256);
    
    // Verify the hash is stable and deterministic
    // The hash is calculated from the items array, which should be consistent
    expect(bundle1.integrity.sha256).toBeTruthy();
    expect(bundle1.integrity.sha256.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should produce a different hash if even a minor input changes (e.g., extra metadata)', () => {
    const bundleA = compileProofBundle(mockEvent, mockVerdict, { extra_data: "value_one" });
    const bundleB = compileProofBundle(mockEvent, mockVerdict, { extra_data: "value_two" });

    expect(bundleA.integrity.sha256).not.toBe(bundleB.integrity.sha256);
  });
});

