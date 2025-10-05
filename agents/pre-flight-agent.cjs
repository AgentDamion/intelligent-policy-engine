const AgentBase = require('./agent-base.cjs');
const EventBus = require('../core/event-bus');

class PreFlightAgent extends AgentBase {
  constructor() {
    super('pre-flight', 'assistance');
    this.compliancePatterns = new Map();
    this.riskIndicators = new Set();
    EventBus.on('pattern-detected', this.updatePatterns.bind(this));
    EventBus.on('risk-identified', this.updateRiskIndicators.bind(this));
  }

  async process(input, context) {
    const { content, contentType, client, liveMode = false } = input;
    const result = {
      suggestions: [],
      warnings: [],
      blockers: [],
      confidence: 0,
      helpfulTips: []
    };
    try {
      if (liveMode) {
        return this.processRealTime(content, context);
      }
      const patterns = await this.checkPatterns(content, client);
      const risks = await this.assessRisks(content, contentType, client);
      const brandCompliance = await this.checkBrandGuidelines(content, client);
      result.suggestions = [...patterns.suggestions, ...brandCompliance.suggestions];
      result.warnings = [...patterns.warnings, ...risks.warnings];
      result.blockers = [...patterns.blockers, ...risks.blockers];
      result.confidence = this.calculateConfidence(result);
      result.helpfulTips = await this.getContextualTips(result, context);
      EventBus.emit('pre-flight-check-complete', {
        input,
        result,
        timestamp: new Date()
      });
      return result;
    } catch (error) {
      if (this.logger) this.logger.error('Pre-flight check failed:', error);
      throw error;
    }
  }

  async processRealTime(content, context) {
    const quickChecks = {
      hasUnverifiedClaims: this.scanForClaims(content),
      riskPhrases: this.scanForRiskPhrases(content),
      missingElements: this.checkRequiredElements(content, context)
    };
    return {
      instant: true,
      feedback: this.formatInstantFeedback(quickChecks),
      severity: this.calculateSeverity(quickChecks)
    };
  }

  scanForClaims(content) {
    const claimPatterns = [
      /(\d+)%\s*(effective|efficacy|success|improvement)/gi,
      /(clinically|scientifically|medically)\s+proven/gi,
      /(fastest|best|only|superior|leading)/gi,
      /FDA[\s-]?approved/gi
    ];
    const findings = [];
    claimPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({
          type: 'unverified-claim',
          text: matches[0],
          suggestion: 'This claim requires supporting evidence'
        });
      }
    });
    return findings;
  }

  scanForRiskPhrases(content) {
    // Example: scan for risky language
    const riskPatterns = [/guaranteed/gi, /no risk/gi, /free trial/gi];
    const findings = [];
    riskPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({
          type: 'risk-phrase',
          text: matches[0],
          warning: 'This phrase may increase compliance risk.'
        });
      }
    });
    return findings;
  }

  checkRequiredElements(content, context) {
    // Example: check for required disclaimers or sections
    const required = ['disclaimer', 'references'];
    const missing = required.filter(el => !content.toLowerCase().includes(el));
    return missing.map(el => ({
      type: 'missing-element',
      element: el,
      blocker: `Missing required element: ${el}`
    }));
  }

  updatePatterns(event) {
    const { pattern, frequency, risk } = event;
    this.compliancePatterns.set(pattern.id, {
      ...pattern,
      frequency,
      risk,
      lastSeen: new Date()
    });
  }

  updateRiskIndicators(event) {
    if (event && event.indicator) {
      this.riskIndicators.add(event.indicator);
    }
  }

  async checkPatterns(content, client) {
    // Placeholder: simulate pattern check
    return { suggestions: [], warnings: [], blockers: [] };
  }

  async assessRisks(content, contentType, client) {
    // Placeholder: simulate risk assessment
    return { warnings: [], blockers: [] };
  }

  async checkBrandGuidelines(content, client) {
    // Placeholder: simulate brand compliance
    return { suggestions: [] };
  }

  calculateConfidence(result) {
    const base = 100;
    const deductions = { blocker: 30, warning: 10, suggestion: 3 };
    let confidence = base;
    confidence -= (result.blockers.length * deductions.blocker);
    confidence -= (result.warnings.length * deductions.warning);
    confidence -= (result.suggestions.length * deductions.suggestion);
    return Math.max(0, Math.min(100, confidence));
  }

  async getContextualTips(result, context) {
    // Placeholder: return helpful tips based on findings
    return [];
  }

  formatInstantFeedback(quickChecks) {
    // Format quick check results for real-time feedback
    const feedback = [];
    if (quickChecks.hasUnverifiedClaims.length > 0) {
      feedback.push({
        severity: 'warning',
        message: 'Unverified claims detected. Please provide evidence.'
      });
    }
    if (quickChecks.riskPhrases.length > 0) {
      feedback.push({
        severity: 'warning',
        message: 'Risky phrases detected. Consider revising.'
      });
    }
    if (quickChecks.missingElements.length > 0) {
      feedback.push({
        severity: 'blocker',
        message: 'Missing required elements: ' + quickChecks.missingElements.map(e => e.element).join(', ')
      });
    }
    return feedback;
  }

  calculateSeverity(quickChecks) {
    if (quickChecks.missingElements.length > 0) return 'blocker';
    if (quickChecks.hasUnverifiedClaims.length > 0 || quickChecks.riskPhrases.length > 0) return 'warning';
    return 'ok';
  }
}

module.exports = PreFlightAgent; 