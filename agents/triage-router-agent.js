class TriageRouterAgent {
  constructor() {
    this.name = 'triage-router';
  }

  /**
   * Analyze the incoming request and decide the best workflow and agent set.
   * Returns: { workflowType, agents, confidence, reasons[] }
   */
  async process(input, context = {}) {
    const reasons = [];
    let workflowType = input?.type || 'enterprise-policy-creation';

    // Heuristic routing based on input type/content and user role
    const message = (typeof input?.content === 'string' ? input.content : '')
      .toLowerCase();

    if (input?.type === 'agency-tool-submission' || message.includes('submit tool')) {
      workflowType = 'agency-tool-submission';
      reasons.push('Detected agency tool submission');
    } else if (input?.type === 'multi-client-conflict' || message.includes('conflict')) {
      workflowType = 'multi-client-conflict-resolution';
      reasons.push('Detected multi-client conflict');
    } else if (input?.type === 'compliance-audit' || message.includes('audit')) {
      workflowType = 'compliance-audit-workflow';
      reasons.push('Detected compliance audit');
    } else if (input?.type === 'policy-distribution' || message.includes('distribute policy')) {
      workflowType = 'policy-distribution-sync';
      reasons.push('Detected policy distribution');
    } else if (input?.type === 'human-override') {
      workflowType = 'human-override-review';
      reasons.push('Detected human override');
    } else if (context?.userRole === 'agency_admin') {
      workflowType = 'agency-tool-submission';
      reasons.push('Defaulted to agency workflow for agency_admin');
    } else {
      workflowType = 'enterprise-policy-creation';
      reasons.push('Defaulted to enterprise policy creation');
    }

    // Recommended agent sequence per workflow
    const workflowToAgents = {
      'agency-tool-submission': ['pre-flight', 'context', 'policy', 'conflict-detection', 'negotiation', 'audit'],
      'enterprise-policy-creation': ['context', 'policy', 'conflict-detection', 'audit'],
      'multi-client-conflict-resolution': ['context', 'conflict-detection', 'negotiation', 'audit'],
      'compliance-audit-workflow': ['audit', 'pattern-recognition', 'policy'],
      'human-override-review': ['context', 'audit'],
      'policy-distribution-sync': ['policy', 'conflict-detection', 'audit']
    };

    const agents = workflowToAgents[workflowType] || ['context'];

    return {
      workflowType,
      agents,
      confidence: 0.8,
      reasons
    };
  }
}

module.exports = TriageRouterAgent;
