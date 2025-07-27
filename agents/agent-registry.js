const { PolicyAgent } = require('./policy-agent');
const AuditAgent = require('./audit-agent');
const NegotiationAgent = require('./negotiation-agent');
const PreFlightAgent = require('./pre-flight-agent');
const SubmissionStateManager = require('./submission-state-manager');
const ContextAgent = require('./context-agent');
// const ClaimVerificationAgent = require('./claim-verification-agent');
// const MedicalAccuracyAgent = require('./medical-accuracy-agent');
// const PatternRecognitionAgent = require('./pattern-recognition-agent');

const registry = {
  policy: new PolicyAgent(),
  audit: new AuditAgent(),
  negotiation: new NegotiationAgent(),
  'pre-flight': new PreFlightAgent(),
  'submission-state': new SubmissionStateManager(),
  context: new ContextAgent(),
  // 'claim-verification': new ClaimVerificationAgent(),
  // 'medical-accuracy': new MedicalAccuracyAgent(),
  // 'pattern-recognition': new PatternRecognitionAgent(),
  getAgent(name) {
    return this[name];
  }
};

module.exports = registry;