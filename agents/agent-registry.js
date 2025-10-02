import { PolicyAgent } from './policy-agent.js';
import AuditAgent from './audit-agent.js';
import NegotiationAgent from './negotiation-agent.js';
import PreFlightAgent from './pre-flight-agent.js';
import SubmissionStateManager from './submission-state-manager.js';
import ContextAgent from './context-agent.js';
import { ConflictDetectionAgent } from './conflict-detection-agent.js';
import PatternRecognitionAgent from './pattern-recognition-agent.js';
import TriageRouterAgent from './triage-router-agent.js';
import GuardrailOrchestratorAgent from './guardrail-orchestrator-agent.js';
import HumanEscalationAgent from './human-escalation-agent.js';
import MultiTenantOrchestratorAgent from './multi-tenant-orchestrator-agent.js';

// New external data discovery and monitoring agents
import ToolDiscoveryAgent from './tool-discovery-agent.js';
import DataExtractionAgent from './data-extraction-agent.js';
import MonitoringAgent from './monitoring-agent.js';
import VendorOutreachAgent from './vendor-outreach-agent.js';
import ComplianceScoringAgent from './compliance-scoring-agent.js';

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

export default registry;