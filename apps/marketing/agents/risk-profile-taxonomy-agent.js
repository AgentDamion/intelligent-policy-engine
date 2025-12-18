const { AgentBase } = require('./agent-base');

/**
 * Risk Profile Taxonomy Agent
 * 
 * Implements NIST AI Risk Management Framework-inspired risk profiling
 * across 6 key dimensions to classify AI tools into 5 risk tiers.
 * 
 * Dimensions:
 * 1. Data Sensitivity & Privacy
 * 2. External Exposure & Decision Impact
 * 3. Model Transparency / Interpretability
 * 4. Misuse / Adversarial Vectors
 * 5. Legal / IP Risk
 * 6. Operational Criticality
 * 
 * Risk Tiers: Minimal, Low, Medium, High, Critical
 */
class RiskProfileTaxonomyAgent extends AgentBase {
  constructor() {
    super('RiskProfileTaxonomyAgent', 'Assesses AI tools across 6 dimensions for risk-based governance');
    
    // Risk tier thresholds (aggregate score out of 100)
    this.riskTierThresholds = {
      minimal: { min: 0, max: 20 },
      low: { min: 21, max: 40 },
      medium: { min: 41, max: 60 },
      high: { min: 61, max: 80 },
      critical: { min: 81, max: 100 }
    };

    // Risk multipliers for PolicyAgent integration
    this.riskMultipliers = {
      minimal: 0.5,
      low: 0.75,
      medium: 1.0,
      high: 1.5,
      critical: 2.0
    };

    // Dimension weights (total = 100)
    this.dimensionWeights = {
      dataSensitivity: 25,
      externalExposure: 20,
      modelTransparency: 15,
      misuseVectors: 15,
      legalRisk: 15,
      operationalCriticality: 10
    };

    this.assessmentHistory = new Map();
  }

  /**
   * Main assessment method - evaluates a tool across all dimensions
   * @param {Object} toolMetadata - Tool information (name, vendor, capabilities)
   * @param {Object} vendorData - Vendor information (reputation, certifications)
   * @param {Object} usageContext - How the tool will be used (purpose, data types, audience)
   * @returns {Object} Complete risk profile assessment
   */
  async assessTool(toolMetadata, vendorData = {}, usageContext = {}) {
    try {
      this.log(`Starting risk profile assessment for: ${toolMetadata.name || 'Unknown Tool'}`);
      const startTime = Date.now();

      // Assess each dimension
      const dimensionScores = {
        dataSensitivity: this.assessDataSensitivity(toolMetadata, usageContext),
        externalExposure: this.assessExternalExposure(toolMetadata, usageContext),
        modelTransparency: this.assessModelTransparency(toolMetadata, vendorData),
        misuseVectors: this.assessMisuseVectors(toolMetadata, usageContext),
        legalRisk: this.assessLegalRisk(toolMetadata, usageContext),
        operationalCriticality: this.assessOperationalCriticality(toolMetadata, usageContext)
      };

      // Calculate weighted aggregate score
      const aggregateScore = this.calculateAggregateScore(dimensionScores);

      // Determine risk tier
      const riskProfile = this.determineRiskTier(aggregateScore);

      // Generate recommended controls based on tier and dimensions
      const recommendedControls = this.generateRecommendedControls(riskProfile, dimensionScores);

      // Generate audit requirements
      const auditRequirements = this.generateAuditRequirements(riskProfile, dimensionScores);

      // Build assessment rationale
      const rationale = this.buildAssessmentRationale(dimensionScores, riskProfile, aggregateScore);

      const processingTime = Date.now() - startTime;

      const assessment = {
        toolName: toolMetadata.name || toolMetadata.tool || 'Unknown',
        vendorName: vendorData.name || vendorData.vendor || 'Unknown',
        riskProfile,
        aggregateScore,
        riskMultiplier: this.riskMultipliers[riskProfile],
        dimensionScores,
        recommendedControls,
        auditRequirements,
        rationale,
        assessedAt: new Date().toISOString(),
        processingTime
      };

      // Store in history
      const assessmentId = this.generateAssessmentId(toolMetadata);
      this.assessmentHistory.set(assessmentId, assessment);

      this.log(`Assessment complete: ${riskProfile.toUpperCase()} risk (score: ${aggregateScore})`);

      return assessment;

    } catch (error) {
      this.log(`Error during risk profile assessment: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Dimension 1: Data Sensitivity & Privacy
   * Assesses whether tool ingests/produces sensitive or regulated data
   */
  assessDataSensitivity(toolMetadata, usageContext) {
    let score = 0;
    const findings = [];

    const dataHandling = (usageContext.dataHandling || toolMetadata.dataHandling || '').toLowerCase();
    const usage = (usageContext.usage || toolMetadata.usage || '').toLowerCase();

    // Critical data types (PHI, medical, SSN)
    if (dataHandling.includes('phi') || dataHandling.includes('medical') || 
        dataHandling.includes('ssn') || dataHandling.includes('health')) {
      score += 25;
      findings.push('Processes protected health information or medical data');
    }

    // PII and customer data
    if (dataHandling.includes('pii') || dataHandling.includes('customer data') ||
        dataHandling.includes('personal')) {
      score += 15;
      findings.push('Handles personally identifiable information');
    }

    // Data storage/retention
    if (dataHandling.includes('stores') || dataHandling.includes('permanently') ||
        dataHandling.includes('retention')) {
      score += 10;
      findings.push('Stores or retains user data');
    }

    // Regulated data (financial, legal)
    if (dataHandling.includes('financial') || dataHandling.includes('payment') ||
        dataHandling.includes('legal')) {
      score += 15;
      findings.push('Processes regulated financial or legal data');
    }

    // No sensitive data
    if ((dataHandling.includes('no') && dataHandling.includes('data')) ||
        dataHandling.includes('public only')) {
      score = Math.max(0, score - 10);
      findings.push('Minimal or no sensitive data handling');
    }

    return {
      score: Math.min(score, 25), // Cap at dimension max
      maxScore: this.dimensionWeights.dataSensitivity,
      percentage: Math.min((score / 25) * 100, 100),
      findings,
      riskLevel: this.scoreToDimensionRiskLevel(score, 25)
    };
  }

  /**
   * Dimension 2: External Exposure & Decision Impact
   * Assesses if output exposed to customers/external audiences or feeds high-stakes decisions
   */
  assessExternalExposure(toolMetadata, usageContext) {
    let score = 0;
    const findings = [];

    const usage = (usageContext.usage || toolMetadata.usage || '').toLowerCase();
    const audience = (usageContext.audience || toolMetadata.audience || '').toLowerCase();
    const purpose = (usageContext.purpose || toolMetadata.purpose || '').toLowerCase();

    // Customer-facing or external exposure
    if (audience.includes('customer') || audience.includes('client') || 
        audience.includes('external') || audience.includes('public')) {
      score += 12;
      findings.push('Output exposed to external audiences');
    }

    // High-stakes decisions
    if (purpose.includes('decision') || purpose.includes('diagnosis') ||
        purpose.includes('legal advice') || purpose.includes('financial advice')) {
      score += 15;
      findings.push('Feeds into high-stakes decisions');
    }

    // Automated decisions vs. human review
    if (usage.includes('automated') || usage.includes('autonomous')) {
      score += 8;
      findings.push('Automated decision-making without human review');
    } else if (usage.includes('human review') || usage.includes('assisted')) {
      score = Math.max(0, score - 5);
      findings.push('Human review in the loop');
    }

    // Marketing/content vs. operational decisions
    if (purpose.includes('marketing') || purpose.includes('content creation')) {
      score += 5;
      findings.push('Marketing or content creation use case');
    }

    // Internal only
    if (audience.includes('internal') && !audience.includes('external')) {
      score = Math.max(0, score - 8);
      findings.push('Internal use only');
    }

    return {
      score: Math.min(score, 20),
      maxScore: this.dimensionWeights.externalExposure,
      percentage: Math.min((score / 20) * 100, 100),
      findings,
      riskLevel: this.scoreToDimensionRiskLevel(score, 20)
    };
  }

  /**
   * Dimension 3: Model Transparency / Interpretability
   * Assesses how opaque the model is (black box vs. interpretable)
   */
  assessModelTransparency(toolMetadata, vendorData) {
    let score = 0;
    const findings = [];

    const modelType = (toolMetadata.modelType || toolMetadata.type || '').toLowerCase();
    const vendor = (vendorData.name || vendorData.vendor || toolMetadata.vendor || '').toLowerCase();
    const explainability = (toolMetadata.explainability || '').toLowerCase();

    // Black box models (complex neural networks, LLMs)
    if (modelType.includes('llm') || modelType.includes('large language model') ||
        modelType.includes('neural network') || modelType.includes('deep learning')) {
      score += 12;
      findings.push('Complex black box model (LLM or deep neural network)');
    }

    // Fine-tuned models
    if (modelType.includes('fine-tuned') || modelType.includes('custom')) {
      score += 5;
      findings.push('Custom or fine-tuned model');
    }

    // Prompt-based only (more transparent)
    if (modelType.includes('prompt') && !modelType.includes('fine-tuned')) {
      score = Math.max(0, score - 5);
      findings.push('Prompt-based interaction (more interpretable)');
    }

    // Explainability features
    if (explainability.includes('explainable') || explainability.includes('interpretable')) {
      score = Math.max(0, score - 5);
      findings.push('Provides explainability features');
    } else if (explainability.includes('none') || explainability.includes('black box')) {
      score += 5;
      findings.push('No explainability features');
    }

    // Unknown vendor increases opacity
    if (vendor.includes('unknown') || vendor === '') {
      score += 8;
      findings.push('Unknown vendor reduces transparency');
    }

    return {
      score: Math.min(score, 15),
      maxScore: this.dimensionWeights.modelTransparency,
      percentage: Math.min((score / 15) * 100, 100),
      findings,
      riskLevel: this.scoreToDimensionRiskLevel(score, 15)
    };
  }

  /**
   * Dimension 4: Misuse / Adversarial Vectors
   * Assesses risk of prompt injection, hallucination, or data leakage
   */
  assessMisuseVectors(toolMetadata, usageContext) {
    let score = 0;
    const findings = [];

    const modelType = (toolMetadata.modelType || toolMetadata.type || '').toLowerCase();
    const usage = (usageContext.usage || toolMetadata.usage || '').toLowerCase();
    const controls = (toolMetadata.controls || usageContext.controls || '').toLowerCase();

    // LLMs susceptible to prompt injection
    if (modelType.includes('llm') || modelType.includes('chatbot') || 
        modelType.includes('conversational')) {
      score += 8;
      findings.push('Susceptible to prompt injection attacks');
    }

    // Generative models can hallucinate
    if (modelType.includes('generative') || modelType.includes('generation')) {
      score += 7;
      findings.push('Generative model with hallucination risk');
    }

    // User input processing
    if (usage.includes('user input') || usage.includes('chat') || 
        usage.includes('interactive')) {
      score += 5;
      findings.push('Processes user input (attack vector)');
    }

    // Data leakage risk
    if (usage.includes('training') || usage.includes('learning from user data')) {
      score += 8;
      findings.push('Model may learn from sensitive user data');
    }

    // Input/output filtering
    if (controls.includes('input filtering') || controls.includes('output filtering') ||
        controls.includes('guardrails')) {
      score = Math.max(0, score - 5);
      findings.push('Input/output filtering controls in place');
    }

    // Sandboxed or isolated
    if (controls.includes('sandboxed') || controls.includes('isolated')) {
      score = Math.max(0, score - 3);
      findings.push('Sandboxed execution environment');
    }

    return {
      score: Math.min(score, 15),
      maxScore: this.dimensionWeights.misuseVectors,
      percentage: Math.min((score / 15) * 100, 100),
      findings,
      riskLevel: this.scoreToDimensionRiskLevel(score, 15)
    };
  }

  /**
   * Dimension 5: Legal / IP Risk
   * Assesses risk of copyright, defamation, or regulatory violations
   */
  assessLegalRisk(toolMetadata, usageContext) {
    let score = 0;
    const findings = [];

    const usage = (usageContext.usage || toolMetadata.usage || '').toLowerCase();
    const industry = (usageContext.industry || toolMetadata.industry || '').toLowerCase();
    const contentType = (usageContext.contentType || '').toLowerCase();

    // Content creation (copyright risk)
    if (usage.includes('content creation') || usage.includes('writing') ||
        usage.includes('image generation') || usage.includes('code generation')) {
      score += 8;
      findings.push('Content creation poses copyright/IP risk');
    }

    // Regulated industries
    if (industry.includes('healthcare') || industry.includes('pharmaceutical') ||
        industry.includes('financial') || industry.includes('legal')) {
      score += 10;
      findings.push('Operates in highly regulated industry');
    }

    // Legal/medical advice
    if (usage.includes('legal advice') || usage.includes('medical advice') ||
        usage.includes('diagnosis')) {
      score += 12;
      findings.push('Provides professional advice (liability risk)');
    }

    // Public-facing content
    if (contentType.includes('public') || contentType.includes('published')) {
      score += 5;
      findings.push('Generates public-facing content');
    }

    // Disclaimers and terms
    if ((toolMetadata.disclaimers || '').toLowerCase().includes('yes') ||
        (usageContext.disclaimers || '').toLowerCase().includes('yes')) {
      score = Math.max(0, score - 5);
      findings.push('Disclaimers and terms of use in place');
    }

    return {
      score: Math.min(score, 15),
      maxScore: this.dimensionWeights.legalRisk,
      percentage: Math.min((score / 15) * 100, 100),
      findings,
      riskLevel: this.scoreToDimensionRiskLevel(score, 15)
    };
  }

  /**
   * Dimension 6: Operational Criticality
   * Assesses if downtime or error causes major business harm
   */
  assessOperationalCriticality(toolMetadata, usageContext) {
    let score = 0;
    const findings = [];

    const criticality = (usageContext.criticality || toolMetadata.criticality || '').toLowerCase();
    const usage = (usageContext.usage || toolMetadata.usage || '').toLowerCase();
    const sla = toolMetadata.sla || usageContext.sla;

    // Mission-critical systems
    if (criticality.includes('critical') || criticality.includes('mission-critical')) {
      score += 10;
      findings.push('Mission-critical system');
    }

    // High availability requirements
    if (criticality.includes('high availability') || (sla && sla.uptime >= 99.9)) {
      score += 5;
      findings.push('High availability requirement');
    }

    // Customer-facing operations
    if (usage.includes('customer support') || usage.includes('customer service')) {
      score += 7;
      findings.push('Customer-facing operations');
    }

    // Fallback mechanisms
    if ((toolMetadata.fallback || '').toLowerCase().includes('yes') ||
        (usageContext.fallback || '').toLowerCase().includes('yes')) {
      score = Math.max(0, score - 4);
      findings.push('Fallback mechanisms available');
    }

    // Internal productivity (lower criticality)
    if (usage.includes('productivity') || usage.includes('internal tool')) {
      score = Math.max(0, score - 3);
      findings.push('Internal productivity tool (lower criticality)');
    }

    return {
      score: Math.min(score, 10),
      maxScore: this.dimensionWeights.operationalCriticality,
      percentage: Math.min((score / 10) * 100, 100),
      findings,
      riskLevel: this.scoreToDimensionRiskLevel(score, 10)
    };
  }

  /**
   * Calculate weighted aggregate score across all dimensions
   */
  calculateAggregateScore(dimensionScores) {
    let totalScore = 0;
    
    for (const [dimension, weight] of Object.entries(this.dimensionWeights)) {
      const dimensionScore = dimensionScores[dimension].score;
      totalScore += dimensionScore;
    }

    return Math.round(totalScore);
  }

  /**
   * Determine risk tier based on aggregate score
   */
  determineRiskTier(aggregateScore) {
    for (const [tier, threshold] of Object.entries(this.riskTierThresholds)) {
      if (aggregateScore >= threshold.min && aggregateScore <= threshold.max) {
        return tier;
      }
    }
    return 'medium'; // Default fallback
  }

  /**
   * Convert dimension score to risk level
   */
  scoreToDimensionRiskLevel(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'critical';
    if (percentage >= 60) return 'high';
    if (percentage >= 40) return 'medium';
    if (percentage >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Generate recommended controls based on risk profile and dimension scores
   */
  generateRecommendedControls(riskProfile, dimensionScores) {
    const controls = [];

    // Base controls for all tiers
    controls.push('usage_tracking', 'basic_logging');

    // Data sensitivity controls
    if (dimensionScores.dataSensitivity.riskLevel === 'high' || 
        dimensionScores.dataSensitivity.riskLevel === 'critical') {
      controls.push('data_encryption', 'access_controls', 'data_minimization', 'redaction_protocols');
    }

    // External exposure controls
    if (dimensionScores.externalExposure.riskLevel === 'high' || 
        dimensionScores.externalExposure.riskLevel === 'critical') {
      controls.push('human_review', 'output_validation', 'liability_disclaimers');
    }

    // Model transparency controls
    if (dimensionScores.modelTransparency.riskLevel === 'high' || 
        dimensionScores.modelTransparency.riskLevel === 'critical') {
      controls.push('explainability_requirements', 'model_documentation', 'decision_tracing');
    }

    // Misuse vector controls
    if (dimensionScores.misuseVectors.riskLevel === 'high' || 
        dimensionScores.misuseVectors.riskLevel === 'critical') {
      controls.push('input_filtering', 'output_filtering', 'prompt_injection_detection', 'rate_limiting');
    }

    // Legal risk controls
    if (dimensionScores.legalRisk.riskLevel === 'high' || 
        dimensionScores.legalRisk.riskLevel === 'critical') {
      controls.push('legal_review', 'compliance_audit', 'copyright_screening', 'professional_liability_insurance');
    }

    // Operational criticality controls
    if (dimensionScores.operationalCriticality.riskLevel === 'high' || 
        dimensionScores.operationalCriticality.riskLevel === 'critical') {
      controls.push('sla_monitoring', 'failover_systems', 'incident_response_plan', 'business_continuity_plan');
    }

    // Tier-specific controls
    switch (riskProfile) {
      case 'critical':
        controls.push('full_model_audit', 'continuous_monitoring', 'human_in_the_loop', 'regular_bias_testing');
        break;
      case 'high':
        controls.push('enhanced_monitoring', 'periodic_audits', 'bias_detection', 'escalation_protocols');
        break;
      case 'medium':
        controls.push('content_review', 'periodic_spot_checks', 'user_feedback_loops');
        break;
      case 'low':
        controls.push('quarterly_review', 'basic_monitoring');
        break;
      case 'minimal':
        // Base controls only
        break;
    }

    return [...new Set(controls)]; // Remove duplicates
  }

  /**
   * Generate audit requirements based on risk profile
   */
  generateAuditRequirements(riskProfile, dimensionScores) {
    const requirements = {
      frequency: this.getAuditFrequency(riskProfile),
      scope: [],
      documentation: [],
      reviewers: []
    };

    // Base audit scope
    requirements.scope.push('usage_logs', 'access_logs');

    switch (riskProfile) {
      case 'critical':
        requirements.scope.push('model_performance', 'bias_metrics', 'explainability_reports', 
                                'incident_logs', 'compliance_attestations');
        requirements.documentation.push('full_model_card', 'risk_assessment', 'mitigation_plans', 
                                        'incident_response_procedures');
        requirements.reviewers.push('compliance_officer', 'legal_counsel', 'security_team', 'business_owner');
        break;
      case 'high':
        requirements.scope.push('model_performance', 'bias_metrics', 'incident_logs');
        requirements.documentation.push('model_card', 'risk_assessment', 'control_implementation');
        requirements.reviewers.push('compliance_officer', 'security_team', 'business_owner');
        break;
      case 'medium':
        requirements.scope.push('error_rates', 'user_feedback');
        requirements.documentation.push('risk_summary', 'control_checklist');
        requirements.reviewers.push('compliance_officer', 'business_owner');
        break;
      case 'low':
        requirements.scope.push('basic_metrics');
        requirements.documentation.push('usage_summary');
        requirements.reviewers.push('business_owner');
        break;
      case 'minimal':
        requirements.documentation.push('basic_attestation');
        requirements.reviewers.push('team_lead');
        break;
    }

    return requirements;
  }

  /**
   * Get audit frequency based on risk profile
   */
  getAuditFrequency(riskProfile) {
    const frequencies = {
      critical: 'continuous', // Real-time monitoring + monthly review
      high: 'monthly',
      medium: 'quarterly',
      low: 'semi-annual',
      minimal: 'annual'
    };
    return frequencies[riskProfile] || 'quarterly';
  }

  /**
   * Build human-readable rationale for the assessment
   */
  buildAssessmentRationale(dimensionScores, riskProfile, aggregateScore) {
    const rationale = [];

    rationale.push(`Overall Risk Profile: ${riskProfile.toUpperCase()} (Aggregate Score: ${aggregateScore}/100)`);
    rationale.push('');
    rationale.push('Dimension Analysis:');

    for (const [dimension, data] of Object.entries(dimensionScores)) {
      const displayName = this.dimensionToDisplayName(dimension);
      rationale.push(`  ${displayName}: ${data.riskLevel.toUpperCase()} (${data.score}/${data.maxScore})`);
      if (data.findings.length > 0) {
        data.findings.forEach(finding => rationale.push(`    - ${finding}`));
      }
    }

    return rationale.join('\n');
  }

  /**
   * Convert dimension key to display name
   */
  dimensionToDisplayName(dimension) {
    const displayNames = {
      dataSensitivity: 'Data Sensitivity & Privacy',
      externalExposure: 'External Exposure & Decision Impact',
      modelTransparency: 'Model Transparency',
      misuseVectors: 'Misuse / Adversarial Vectors',
      legalRisk: 'Legal / IP Risk',
      operationalCriticality: 'Operational Criticality'
    };
    return displayNames[dimension] || dimension;
  }

  /**
   * Generate unique assessment ID
   */
  generateAssessmentId(toolMetadata) {
    const toolName = toolMetadata.name || toolMetadata.tool || 'unknown';
    const timestamp = Date.now();
    return `${toolName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
  }

  /**
   * Get assessment history
   */
  getAssessmentHistory(limit = 50) {
    const history = Array.from(this.assessmentHistory.values());
    return history
      .sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt))
      .slice(0, limit);
  }

  /**
   * Get assessment by ID
   */
  getAssessmentById(id) {
    return this.assessmentHistory.get(id) || null;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const history = Array.from(this.assessmentHistory.values());
    const tierCounts = { minimal: 0, low: 0, medium: 0, high: 0, critical: 0 };
    
    history.forEach(assessment => {
      tierCounts[assessment.riskProfile]++;
    });

    return {
      totalAssessments: history.length,
      tierDistribution: tierCounts,
      lastAssessment: history.length > 0 ? 
        history.sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt))[0].assessedAt : null
    };
  }
}

module.exports = RiskProfileTaxonomyAgent;












