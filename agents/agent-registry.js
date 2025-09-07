const { PolicyAgent } = require('./policy-agent');
const AuditAgent = require('./audit-agent');
const NegotiationAgent = require('./negotiation-agent');
const PreFlightAgent = require('./pre-flight-agent');
const SubmissionStateManager = require('./submission-state-manager');
const ContextAgent = require('./context-agent');
const { ConflictDetectionAgent } = require('./conflict-detection-agent');
const PatternRecognitionAgent = require('./pattern-recognition-agent');
const TriageRouterAgent = require('./triage-router-agent');
const GuardrailOrchestratorAgent = require('./guardrail-orchestrator-agent');
const HumanEscalationAgent = require('./human-escalation-agent');
const MultiTenantOrchestratorAgent = require('./multi-tenant-orchestrator-agent');

// New external data discovery and monitoring agents
const ToolDiscoveryAgent = require('./tool-discovery-agent');
const DataExtractionAgent = require('./data-extraction-agent');
const MonitoringAgent = require('./monitoring-agent');
const VendorOutreachAgent = require('./vendor-outreach-agent');
const ComplianceScoringAgent = require('./compliance-scoring-agent');

const registry = {
  policy: new PolicyAgent(),
  audit: new AuditAgent(),
  negotiation: new NegotiationAgent(),
  'pre-flight': new PreFlightAgent(),
  'submission-state': new SubmissionStateManager(),
  context: new ContextAgent(),
  'conflict-detection': new ConflictDetectionAgent(),
  'pattern-recognition': new PatternRecognitionAgent(),
  'triage-router': new TriageRouterAgent(),
  'guardrail-orchestrator': new GuardrailOrchestratorAgent(),
  'human-escalation': new HumanEscalationAgent(),
  'multi-tenant-orchestrator': new MultiTenantOrchestratorAgent(),
  
  // New external data discovery and monitoring agents
  'tool-discovery': new ToolDiscoveryAgent(),
  'data-extraction': new DataExtractionAgent(),
  'monitoring': new MonitoringAgent(),
  'vendor-outreach': new VendorOutreachAgent(),
  'compliance-scoring': new ComplianceScoringAgent(),
  
  getAgent(name) {
    return this[name];
  }
};

module.exports = registry;