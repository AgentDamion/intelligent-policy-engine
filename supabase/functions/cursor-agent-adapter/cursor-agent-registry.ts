// Import the actual agent implementations
// Note: In a real implementation, these would need to be converted to Deno-compatible versions
// or use a bridge pattern to call the Node.js agents

import { PolicyAgent } from './agents/policy-agent.ts'
import { AuditAgent } from './agents/audit-agent.ts'
import { ContextAgent } from './agents/context-agent.ts'
import { ConflictDetectionAgent } from './agents/conflict-detection-agent.ts'
import { NegotiationAgent } from './agents/negotiation-agent.ts'
import { ComplianceScoringAgent } from './agents/compliance-scoring-agent.ts'
import { PatternRecognitionAgent } from './agents/pattern-recognition-agent.ts'
import { GuardrailOrchestratorAgent } from './agents/guardrail-orchestrator-agent.ts'
import { HumanEscalationAgent } from './agents/human-escalation-agent.ts'
import { MultiTenantOrchestratorAgent } from './agents/multi-tenant-orchestrator-agent.ts'
import { ToolDiscoveryAgent } from './agents/tool-discovery-agent.ts'
import { DataExtractionAgent } from './agents/data-extraction-agent.ts'
import { MonitoringAgent } from './agents/monitoring-agent.ts'
import { VendorOutreachAgent } from './agents/vendor-outreach-agent.ts'
import { SandboxAgent } from './agents/sandbox-agent.ts'

export interface Agent {
  process(input: any, context: any): Promise<any>
  getInfo(): { name: string, type: string }
}

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map()

  constructor() {
    this.registerAgents()
  }

  private registerAgents() {
    // Register all available agents
    this.agents.set('policy', new PolicyAgent())
    this.agents.set('audit', new AuditAgent())
    this.agents.set('context', new ContextAgent())
    this.agents.set('sandbox', new SandboxAgent()) // NEW: Policy Sandbox Agent
    this.agents.set('conflict-detection', new ConflictDetectionAgent())
    this.agents.set('negotiation', new NegotiationAgent())
    this.agents.set('compliance-scoring', new ComplianceScoringAgent())
    this.agents.set('pattern-recognition', new PatternRecognitionAgent())
    this.agents.set('guardrail-orchestrator', new GuardrailOrchestratorAgent())
    this.agents.set('human-escalation', new HumanEscalationAgent())
    this.agents.set('multi-tenant-orchestrator', new MultiTenantOrchestratorAgent())
    this.agents.set('tool-discovery', new ToolDiscoveryAgent())
    this.agents.set('data-extraction', new DataExtractionAgent())
    this.agents.set('monitoring', new MonitoringAgent())
    this.agents.set('vendor-outreach', new VendorOutreachAgent())
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name)
  }

  listAgents(): string[] {
    return Array.from(this.agents.keys())
  }

  getAgentInfo(name: string): { name: string, type: string } | undefined {
    const agent = this.agents.get(name)
    return agent?.getInfo()
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry()
