/**
 * apps/platform/src/surfaces/registry.ts
 * 
 * Formal registry of the 6 core governance surfaces.
 * Defines the "Surface Contract" for VERA handoffs and UI guardrails.
 */

export type SurfaceNoun = 'mission' | 'inbox' | 'decisions' | 'forge' | 'proof' | 'lab' | 'compliance';

export type GuardrailTone = 'info' | 'warning' | 'success' | 'neutral'

export interface SurfaceGuardrail {
  label: string
  tone: GuardrailTone
}

export interface SurfaceDefinition {
  id: SurfaceNoun;
  label: string;
  subtitle?: string;
  guardrail: SurfaceGuardrail;
  basePath: string;
  allowedActions: string[]; // Actions this surface can INITIATE
  ownedActions: string[];   // Regulated actions this surface is the ONLY ONE allowed to COMPLETE
  forbiddenActions: string[];
  stepUpAuthActions: string[]; // Specific actions requiring re-auth
}

export const SURFACE_REGISTRY: Record<SurfaceNoun, SurfaceDefinition> = {
  mission: {
    id: 'mission',
    label: 'Mission Control',
    subtitle: 'Portfolio-level governance intelligence and live monitoring',
    guardrail: { label: 'Guardrails: view only', tone: 'neutral' },
    basePath: '/mission',
    allowedActions: ['view_metrics', 'view_activity'],
    ownedActions: [],
    forbiddenActions: ['finalize_decision', 'publish_policy'],
    stepUpAuthActions: []
  },
  inbox: {
    id: 'inbox',
    label: 'Triage',
    subtitle: 'Work intake and prioritization cockpit',
    guardrail: { label: 'Guardrails: triage only', tone: 'info' },
    basePath: '/inbox',
    allowedActions: ['assign_owner', 'request_info', 'provide_info', 'triage_thread'],
    ownedActions: [],
    forbiddenActions: ['finalize_decision', 'sign_signature'],
    stepUpAuthActions: []
  },
  decisions: {
    id: 'decisions',
    label: 'Decisions',
    subtitle: 'High-fidelity review and human sign-off',
    guardrail: { label: 'Guardrails: signatures required', tone: 'warning' },
    basePath: '/decisions',
    allowedActions: ['HumanApproveDecision', 'HumanBlockDecision', 'HumanApproveWithConditions'],
    ownedActions: ['sign_signature'],
    forbiddenActions: ['edit_archived_policy'],
    stepUpAuthActions: ['sign_signature']
  },
  forge: {
    id: 'forge',
    label: 'The Forge',
    subtitle: 'Define the rules of governance: policies and registries',
    guardrail: { label: 'Guardrails: config only', tone: 'neutral' },
    basePath: '/forge',
    allowedActions: ['create_policy_draft', 'update_registry'],
    ownedActions: ['publish_policy'],
    forbiddenActions: ['sign_audit_bundle'],
    stepUpAuthActions: ['publish_policy']
  },
  proof: {
    id: 'proof',
    label: 'Evidence Vault',
    subtitle: 'Immutable audit trails and cryptographic proof bundles',
    guardrail: { label: 'Guardrails: exports logged', tone: 'info' },
    basePath: '/proof',
    allowedActions: ['verify_hash', 'share_trust_center'],
    ownedActions: ['export_regulator_package'],
    forbiddenActions: ['edit_audit_history'],
    stepUpAuthActions: ['export_regulator_package']
  },
  lab: {
    id: 'lab',
    label: 'Simulation Lab',
    subtitle: 'Run replays and what-if scenarios against policy drafts',
    guardrail: { label: 'Guardrails: no production writes', tone: 'neutral' },
    basePath: '/lab',
    allowedActions: ['run_replay', 'run_simulation', 'compare_impact'],
    ownedActions: [],
    forbiddenActions: ['change_production_state'],
    stepUpAuthActions: []
  },
  compliance: {
    id: 'compliance',
    label: 'Compliance Center',
    subtitle: 'Regulatory compliance tracking and reporting',
    guardrail: { label: 'Guardrails: view only', tone: 'neutral' },
    basePath: '/compliance',
    allowedActions: ['view_compliance', 'generate_reports'],
    ownedActions: [],
    forbiddenActions: ['modify_compliance_data'],
    stepUpAuthActions: []
  }
};

/**
 * Utility to build deep links for VERA jumps
 */
export const buildSurfaceLink = (
  surface: SurfaceNoun, 
  id?: string, 
  queryParams: Record<string, string> = {}
) => {
  const base = SURFACE_REGISTRY[surface].basePath;
  const path = id ? `${base}/${id}` : base;
  
  const searchParams = new URLSearchParams(queryParams);
  const queryString = searchParams.toString();
  
  return queryString ? `${path}?${queryString}` : path;
};

