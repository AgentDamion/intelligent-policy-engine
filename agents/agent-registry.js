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

// Enhanced coordination system
const EnhancedAgentCoordinator = require('./enhanced-agent-coordinator');
const AdvancedCacheService = require('./advanced-cache-service');
const ErrorHandlingService = require('./error-handling-service');
const PerformanceMonitoringService = require('./performance-monitoring-service');

class EnhancedAgentRegistry {
  constructor() {
    // Initialize enhanced services
    this.cacheService = new AdvancedCacheService();
    this.errorHandling = new ErrorHandlingService();
    this.monitoring = new PerformanceMonitoringService();
    this.coordinator = new EnhancedAgentCoordinator();
    
    // Initialize agents
    this.agents = new Map();
    this.agentWeights = new Map();
    
    // Register all agents with enhanced coordination
    this.registerAllAgents();
  }

  registerAllAgents() {
    // Core agents with weights based on importance
    this.registerAgent('policy', new PolicyAgent(), 1.0, []);
    this.registerAgent('audit', new AuditAgent(), 0.9, []);
    this.registerAgent('context', new ContextAgent(), 0.8, []);
    this.registerAgent('negotiation', new NegotiationAgent(), 0.7, ['policy', 'context']);
    this.registerAgent('conflict-detection', new ConflictDetectionAgent(), 0.6, ['policy', 'context']);
    this.registerAgent('pattern-recognition', new PatternRecognitionAgent(), 0.5, []);
    this.registerAgent('guardrail-orchestrator', new GuardrailOrchestratorAgent(), 0.8, ['policy', 'audit']);
    this.registerAgent('human-escalation', new HumanEscalationAgent(), 0.7, []);
    this.registerAgent('multi-tenant-orchestrator', new MultiTenantOrchestratorAgent(), 0.6, []);
    
    // Supporting agents
    this.registerAgent('pre-flight', new PreFlightAgent(), 0.4, []);
    this.registerAgent('submission-state', new SubmissionStateManager(), 0.3, []);
    this.registerAgent('triage-router', new TriageRouterAgent(), 0.5, ['context']);
    
    // External data discovery and monitoring agents
    this.registerAgent('tool-discovery', new ToolDiscoveryAgent(), 0.4, []);
    this.registerAgent('data-extraction', new DataExtractionAgent(), 0.5, []);
    this.registerAgent('monitoring', new MonitoringAgent(), 0.6, []);
    this.registerAgent('vendor-outreach', new VendorOutreachAgent(), 0.3, []);
    this.registerAgent('compliance-scoring', new ComplianceScoringAgent(), 0.7, ['policy', 'audit']);
  }

  registerAgent(name, agent, weight = 1.0, dependencies = []) {
    this.agents.set(name, agent);
    this.agentWeights.set(name, weight);
    this.coordinator.registerAgent(name, agent, weight, dependencies);
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  // Enhanced coordination methods
  async coordinateAgents(requests) {
    return await this.coordinator.coordinateAgents(requests);
  }

  async processWithErrorHandling(agentName, input, context = {}) {
    return await this.errorHandling.executeWithErrorHandling(
      () => this.getAgent(agentName).process(input, context),
      { serviceName: agentName, ...context }
    );
  }

  // Performance and monitoring methods
  getMetrics() {
    return {
      coordinator: this.coordinator.getMetrics(),
      monitoring: this.monitoring.getMetricsSummary(),
      errorHandling: this.errorHandling.getMetrics(),
      cache: this.cacheService.getStats()
    };
  }

  getAgentHealth() {
    return this.coordinator.healthCheck();
  }

  // Cache management
  async getFromCache(key) {
    return await this.cacheService.get(key);
  }

  async setCache(key, value, ttl) {
    return await this.cacheService.set(key, value, ttl);
  }

  async clearCache() {
    return await this.cacheService.clear();
  }

  // Error handling management
  resetCircuitBreakers() {
    this.errorHandling.resetAllCircuitBreakers();
  }

  clearRateLimiters() {
    this.errorHandling.clearAllRateLimiters();
  }

  // Legacy compatibility
  get allAgents() {
    return Object.fromEntries(this.agents);
  }
}

// Create enhanced registry instance
const registry = new EnhancedAgentRegistry();

// Export both the instance and the class for backward compatibility
module.exports = registry;
module.exports.EnhancedAgentRegistry = EnhancedAgentRegistry;

module.exports = registry;