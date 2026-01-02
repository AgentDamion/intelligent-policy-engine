/**
 * Rationale Generator for AI Governance Decisions
 * 
 * Generates human-readable (≤140 chars) and structured rationales
 * for policy decisions. Used by PolicyAgent and Edge Functions.
 * 
 * Pattern: [Decision Verb] [Policy-ID]: tool=[Name], data=[Class], [actor]=[Name]
 */

const MAX_RATIONALE_LENGTH = 140;

/**
 * Decision verb mappings
 */
const DECISION_VERBS = {
  allow: 'Allowed under',
  approved: 'Allowed under',
  deny: 'Denied per',
  rejected: 'Denied per',
  escalate: 'Escalate',
  conditional: 'Conditional',
  flagged: 'Flagged per'
};

/**
 * Data classification labels for human readability
 */
const DATA_CLASS_LABELS = {
  no_pii: 'No-PII',
  pseudonymous: 'Pseudonymous',
  pii: 'PII',
  phi: 'PHI',
  restricted: 'Restricted',
  internal_restricted: 'Internal-Restricted',
  public: 'Public',
  confidential: 'Confidential'
};

/**
 * Format data classification for display
 * @param {string} dataClass - Raw data classification
 * @returns {string} Formatted label
 */
function formatDataClass(dataClass) {
  if (!dataClass) return 'Unknown';
  const normalized = dataClass.toLowerCase().replace(/[- ]/g, '_');
  return DATA_CLASS_LABELS[normalized] || dataClass;
}

/**
 * Format actor for display
 * @param {Object} actor - Actor object
 * @returns {string} Formatted actor string
 */
function formatActor(actor) {
  if (!actor) return '';
  
  if (actor.type === 'human' && actor.name) {
    const roleLabel = actor.role || 'reviewer';
    return `${roleLabel}=${actor.name}`;
  }
  
  if (actor.type === 'automated') {
    return 'auto-check';
  }
  
  if (actor.type === 'hybrid') {
    return actor.name ? `hybrid=${actor.name}` : 'hybrid-review';
  }
  
  return '';
}

/**
 * Build human-readable rationale string
 * @param {string} decision - Decision type
 * @param {string} policyId - Policy identifier
 * @param {Object} tool - Tool info { name, version }
 * @param {string} dataClass - Data classification
 * @param {Object} actor - Actor info
 * @returns {string} Human-readable rationale (≤140 chars)
 */
function buildHumanRationale(decision, policyId, tool, dataClass, actor) {
  const decisionVerb = DECISION_VERBS[decision?.toLowerCase()] || 'Processed under';
  const dataLabel = formatDataClass(dataClass);
  const actorLabel = formatActor(actor);
  const toolLabel = tool?.version ? `${tool.name}-${tool.version}` : (tool?.name || 'Unknown');

  let rationale = `${decisionVerb} ${policyId}: tool=${toolLabel}, data=${dataLabel}`;
  
  if (actorLabel) {
    rationale += `, ${actorLabel}`;
  }

  // Enforce 140 char limit with truncation
  if (rationale.length > MAX_RATIONALE_LENGTH) {
    rationale = rationale.substring(0, MAX_RATIONALE_LENGTH - 3) + '...';
  }

  return rationale;
}

/**
 * Generate rationale for a policy decision
 * 
 * @param {Object} input - Rationale generation input
 * @param {string} input.decision - 'allow' | 'deny' | 'escalate' | 'conditional'
 * @param {string} input.policyId - Policy identifier (e.g., 'eps-1.3')
 * @param {string} input.policyVersion - Policy version (e.g., 'v2.1')
 * @param {string} input.ruleMatched - Rule that was matched
 * @param {Object} input.tool - Tool info { name, version }
 * @param {string} input.dataClass - Data classification
 * @param {Object} [input.actor] - Actor info { type, name, id, role }
 * @param {number} [input.confidenceScore] - Confidence score (0-1)
 * @param {string[]} [input.secondaryRules] - Additional rules that contributed
 * @param {string} [input.requestType] - Type of request (generation, analysis, etc.)
 * @returns {{ human: string, structured: Object }} Rationale pair
 */
function generateRationale(input) {
  const {
    decision,
    policyId,
    policyVersion,
    ruleMatched,
    tool,
    dataClass,
    actor,
    confidenceScore,
    secondaryRules,
    requestType = 'generation'
  } = input;

  // Build structured rationale
  const structured = {
    policy_id: policyId || 'unknown-policy',
    policy_version: policyVersion || 'v1.0',
    rule_matched: ruleMatched || 'default_evaluation',
    inputs: {
      tool: tool?.name || 'unknown',
      tool_version: tool?.version,
      dataset_class: dataClass || 'unclassified',
      request_type: requestType
    },
    actor: actor || { type: 'automated' },
    confidence_score: confidenceScore,
    secondary_rules: secondaryRules,
    timestamp: new Date().toISOString()
  };

  // Build human-readable rationale
  const human = buildHumanRationale(
    decision,
    policyId || 'policy',
    tool,
    dataClass,
    actor
  );

  return { human, structured };
}

/**
 * Generate rationale from a PolicyAgent decision result
 * Maps the PolicyAgent output format to rationale input
 * 
 * @param {Object} policyResult - Result from PolicyAgent.process() or evaluatePolicy()
 * @param {Object} context - Additional context
 * @returns {{ human: string, structured: Object }} Rationale pair
 */
function generateRationaleFromPolicyResult(policyResult, context = {}) {
  // Handle evaluatePolicy() result format
  if (policyResult.decision && typeof policyResult.decision === 'string') {
    return generateRationale({
      decision: policyResult.decision.toLowerCase(),
      policyId: policyResult.riskProfile?.tier ? 
        `tier-${policyResult.riskProfile.tier}` : 
        (context.policyId || 'policy-eval'),
      policyVersion: context.policyVersion || 'v1.0',
      ruleMatched: policyResult.requiredControls?.[0] || 'tier_evaluation',
      tool: context.tool || { name: 'unknown' },
      dataClass: context.dataClass,
      actor: context.actor,
      confidenceScore: policyResult.confidence,
      secondaryRules: policyResult.requiredControls
    });
  }

  // Handle process() result format
  const decision = policyResult.decision?.decision || 
                   policyResult.outcome || 
                   'processed';
  
  const riskProfile = policyResult.risk?.profile || 
                      policyResult.taxonomyAssessment?.riskProfile;

  return generateRationale({
    decision: decision.toLowerCase(),
    policyId: riskProfile ? `tier-${riskProfile}` : (context.policyId || 'policy-check'),
    policyVersion: context.policyVersion || 'v1.0',
    ruleMatched: policyResult.decision?.type || 'risk_assessment',
    tool: {
      name: policyResult.request?.request?.tool || context.tool?.name || 'unknown',
      version: context.tool?.version
    },
    dataClass: context.dataClass || policyResult.request?.context?.data_classification,
    actor: context.actor,
    confidenceScore: policyResult.risk?.score ? (1 - policyResult.risk.score) : undefined,
    secondaryRules: policyResult.conditions?.guardrails
  });
}

/**
 * Validate a rationale meets requirements
 * @param {Object} rationale - Rationale object { human, structured }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRationale(rationale) {
  const errors = [];

  if (!rationale.human) {
    errors.push('Missing human-readable rationale');
  } else if (rationale.human.length > MAX_RATIONALE_LENGTH) {
    errors.push(`Human rationale exceeds ${MAX_RATIONALE_LENGTH} characters`);
  }

  if (!rationale.structured) {
    errors.push('Missing structured rationale');
  } else {
    if (!rationale.structured.policy_id) {
      errors.push('Structured rationale missing policy_id');
    }
    if (!rationale.structured.rule_matched) {
      errors.push('Structured rationale missing rule_matched');
    }
    if (!rationale.structured.inputs) {
      errors.push('Structured rationale missing inputs');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  generateRationale,
  generateRationaleFromPolicyResult,
  validateRationale,
  MAX_RATIONALE_LENGTH,
  DECISION_VERBS,
  DATA_CLASS_LABELS
};
