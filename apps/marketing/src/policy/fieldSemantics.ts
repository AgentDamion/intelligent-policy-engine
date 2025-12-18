/**
 * Field Semantics Registry
 * Defines how to merge and canonicalize each POM field
 */

export const FieldSemantics = {
  // Boolean fields (stricter = true for 'required' semantics)
  'controls.hitl.required': { type: 'boolean' as const, stricter: (a: boolean, b: boolean) => a || b, orderless: true },
  'controls.data_residency.required': { type: 'boolean' as const, stricter: (a: boolean, b: boolean) => a || b, orderless: true },
  
  // Union arrays (unordered)
  'controls.hitl.reviewers': { type: 'string[]' as const, merge: 'union' as const, orderless: true },
  'guardrails.blocked_actions': { type: 'string[]' as const, merge: 'union' as const, orderless: true },
  'data_profile.classifications': { type: 'string[]' as const, merge: 'union' as const, orderless: true },
  
  // Numeric thresholds (stricter = lower/min)
  'thresholds.export_sensitivity': { type: 'number' as const, stricter: Math.min, orderless: false },
  'thresholds.max_data_age_days': { type: 'number' as const, stricter: Math.min, orderless: false },
  
  // Ordered arrays (DO NOT sort)
  'workflows.escalation_steps': { type: 'object[]' as const, merge: 'append' as const, orderless: false },
  'approval_chain': { type: 'object[]' as const, merge: 'append' as const, orderless: false },
} as const;

export type FieldPath = keyof typeof FieldSemantics;
