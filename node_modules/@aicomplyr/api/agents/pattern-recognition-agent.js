const AgentBase = require('./agent-base');
const EventBus = require('../core/event-bus');

class PatternRecognitionAgent extends AgentBase {
  constructor() {
    super('pattern-recognition', 'intelligence');
    this.patterns = new Map();
    this.anomalies = [];
    EventBus.on('workflow-completed', this.analyzeWorkflow.bind(this));
    EventBus.on('agent-completed', this.analyzeAgentResult.bind(this));
  }

  async analyzeWorkflow(event) {
    // Track workflow patterns
    const pattern = `${event.contentType || 'unknown'}-${event.workflow}`;
    this.incrementPattern(pattern);
    // Detect anomalies
    if (event.duration && event.sla && event.duration > event.sla * 1.5) {
      this.anomalies.push({
        type: 'sla-breach',
        workflow: event.workflow,
        expected: event.sla,
        actual: event.duration
      });
    }
  }

  async analyzeAgentResult(event) {
    // Example: track agent-specific anomalies
    if (event.duration && event.duration > 60000) { // > 1 min
      this.anomalies.push({
        type: 'slow-agent',
        agent: event.agentName,
        duration: event.duration,
        submissionId: event.submissionId
      });
    }
  }

  incrementPattern(pattern) {
    this.patterns.set(pattern, (this.patterns.get(pattern) || 0) + 1);
  }

  async process(input, context) {
    // Return current patterns and anomalies
    return {
      patterns: Array.from(this.patterns.entries()),
      anomalies: this.anomalies
    };
  }
}

module.exports = PatternRecognitionAgent; 