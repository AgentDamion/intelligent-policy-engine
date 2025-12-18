import { describe, it, expect } from 'vitest';

import { 
    harmonizePolicies, 
    scoreRisk, 
    escalateIfNeeded, 
    HarmonizeResult,
    Escalation
} from '../src/index.js';

import { PolicyRule, DecisionStatus, TelemetryAtom, z } from '@aicomplyr/shared';

// --- Test Mocks ---
const ruleTemplate = (id: string, status: z.infer<typeof DecisionStatus>, priority: number): PolicyRule => ({
    rule_id: id,
    name: "Tool Access Control",
    description: "",
    priority: priority,
    is_active: true,
    context_id: "global-tool",
    conditions: {
        operator: "AND",
        clauses: [{ field: "tool.name", operator: "equals", value: "DALL-E" }],
    },
    decision: { status, reason: `Decision ${id}`, audit_trigger: false },
});

const telemetryAtoms: TelemetryAtom[] = [
    // 10 atoms total
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'pass', region_id: 'US' }, // 1
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'fail', remediation_id: 'R1', region_id: 'US' }, // 2 (Fail)
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'remediated', remediation_id: 'R1', region_id: 'US' }, // 3 (Success)
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'fail', remediation_id: 'R1', region_id: 'US' }, // 4 (Fail)
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'pass', region_id: 'US' }, // 5
    { ts: '', tool_id: 'T2', tool_version: '1.0', use_case_id: 'C1', outcome: 'fail', region_id: 'EU' }, // 6 (Fail, EU)
    { ts: '', tool_id: 'T2', tool_version: '1.0', use_case_id: 'C1', outcome: 'fail', region_id: 'EU' }, // 7 (Fail, EU)
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'pass', region_id: 'US' }, // 8
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'pass', region_id: 'US' }, // 9
    { ts: '', tool_id: 'T1', tool_version: '1.0', use_case_id: 'C1', outcome: 'fail', remediation_id: 'R1', region_id: 'US' }, // 10 (Fail)
];

// --- Tests ---
describe('Orchestrator: harmonizePolicies', () => {
    it('should prefer Prohibited over Approved when contexts overlap', () => {
        const rulesA = [ruleTemplate("A-PROHIBIT", DecisionStatus.enum.Prohibited, 10)];
        const rulesB = [ruleTemplate("B-APPROVE", DecisionStatus.enum.Approved, 20)];
        
        const { combined, conflicts } = harmonizePolicies(rulesA, rulesB);
        
        // Strictest decision is Prohibited (A-PROHIBIT)
        expect(combined.length).toBe(1);
        expect(combined[0].rule_id).toBe("A-PROHIBIT");
        expect(combined[0].decision.status).toBe(DecisionStatus.enum.Prohibited);
        // A conflict should be recorded where Approved was overridden
        expect(conflicts.length).toBe(1);
        expect(conflicts[0].ruleA).toBe("A-PROHIBIT");
        expect(conflicts[0].ruleB).toBe("B-APPROVE");
        expect(conflicts[0].detail).toContain('Approved overridden by Prohibited');
    });

    it('should prefer the lower numerical priority if decision statuses are equal', () => {
        const rulesA = [ruleTemplate("A-REVIEW-PRIO10", DecisionStatus.enum.RequiresReview, 10)];
        const rulesB = [ruleTemplate("B-REVIEW-PRIO5", DecisionStatus.enum.RequiresReview, 5)];
        
        const { combined, conflicts } = harmonizePolicies(rulesA, rulesB);
        
        // Lower priority number (5) wins
        expect(combined.length).toBe(1);
        expect(combined[0].rule_id).toBe("B-REVIEW-PRIO5");
        expect(combined[0].decision.status).toBe(DecisionStatus.enum.RequiresReview);
        expect(conflicts.length).toBe(0); // No conflict if decision status is the same
    });

    it('should handle non-conflicting rules gracefully', () => {
        const rule1 = ruleTemplate("R1", DecisionStatus.enum.Approved, 10);
        const rule2 = { ...rule1, rule_id: "R2", name: "Another Tool", conditions: { operator: "AND", clauses: [{ field: "tool.name", operator: "equals", value: "Claude" }] } };
        
        const { combined, conflicts } = harmonizePolicies([rule1], [rule2]);
        
        // Both rules should be present
        expect(combined.length).toBe(2);
        expect(conflicts.length).toBe(0);
    });
});

describe('Orchestrator: scoreRisk', () => {
    it('should return low risk default if no atoms are provided', () => {
        expect(scoreRisk([])).toBe(0.2);
    });

    it('should return higher risk with more fail atoms and low remediation', () => {
        // Total T1 atoms: 8. Fails: 3. Remediated: 1.
        // Fail Rate = 3/8 = 0.375
        // Remediated Rate = 1/8 = 0.125
        // Risk = (0.375 * 0.7) + (1 - 0.125) * 0.3 = 0.2625 + 0.2625 = 0.525
        
        const risk = scoreRisk(telemetryAtoms, { toolId: 'T1', region: 'US' });
        expect(risk).toBeCloseTo(0.525);
    });
    
    it('should return a higher score for higher fail rate (T2, EU)', () => {
        // Total T2 atoms: 2. Fails: 2. Remediated: 0.
        // Fail Rate = 2/2 = 1.0
        // Remediated Rate = 0/2 = 0.0
        // Risk = (1.0 * 0.7) + (1 - 0.0) * 0.3 = 0.7 + 0.3 = 1.0 (clamped to 0.95)
        
        const risk = scoreRisk(telemetryAtoms, { toolId: 'T2', region: 'EU' });
        expect(risk).toBeCloseTo(0.95); // Clamped to max 0.95
    });
});

describe('Orchestrator: escalateIfNeeded', () => {
    it('should escalate to ComplianceLead if conflicts are present', () => {
        const mockConflicts: HarmonizeResult["conflicts"] = [
            { ruleA: "R-PRO", ruleB: "R-APP", field: "decision", detail: "Overridden" }
        ];
        const escalation = escalateIfNeeded(mockConflicts, 0.4); // Low risk, but conflicts exist
        
        expect(escalation?.level).toBe('ComplianceLead');
        expect(escalation?.reason).toContain('Policy conflict detected');
    });

    it('should escalate to ComplianceLead if risk score is high (>= 0.7)', () => {
        const escalation = escalateIfNeeded([], 0.75); // No conflicts, high risk
        
        expect(escalation?.level).toBe('ComplianceLead');
        expect(escalation?.reason).toContain('High predicted failure risk');
    });
    
    it('should escalate to Reviewer if risk score is medium (>= 0.5)', () => {
        const escalation = escalateIfNeeded([], 0.55); // No conflicts, medium risk
        
        expect(escalation?.level).toBe('Reviewer');
        expect(escalation?.reason).toContain('Medium predicted failure risk');
    });

    it('should return null if risk is low and no conflicts exist', () => {
        const escalation = escalateIfNeeded([], 0.3); // Low risk, no conflicts
        
        expect(escalation).toBeNull();
    });
});

