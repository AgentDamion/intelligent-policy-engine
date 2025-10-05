const { PolicyAgent } = require('./policy-agent.cjs');
const AuditAgent = require('./audit-agent.cjs');
const NegotiationAgent = require('./negotiation-agent.cjs');
const PreFlightAgent = require('./pre-flight-agent.cjs');
const SubmissionStateManager = require('./submission-state-manager.cjs');
const ContextAgent = require('./context-agent.cjs');
const { ConflictDetectionAgent } = require('./conflict-detection-agent.cjs');
const PatternRecognitionAgent = require('./pattern-recognition-agent.cjs');
const TriageRouterAgent = require('./triage-router-agent.cjs');
const GuardrailOrchestratorAgent = require('./guardrail-orchestrator-agent.cjs');
const HumanEscalationAgent = require('./human-escalation-agent.cjs');
const MultiTenantOrchestratorAgent = require('./multi-tenant-orchestrator-agent.cjs');

// New external data discovery and monitoring agents
const ToolDiscoveryAgent = require('./tool-discovery-agent.cjs');
const DataExtractionAgent = require('./data-extraction-agent.cjs');
const MonitoringAgent = require('./monitoring-agent.cjs');
const VendorOutreachAgent = require('./vendor-outreach-agent.cjs');
const ComplianceScoringAgent = require('./compliance-scoring-agent.cjs');

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