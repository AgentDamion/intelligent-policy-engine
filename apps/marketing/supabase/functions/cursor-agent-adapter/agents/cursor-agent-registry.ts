import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PolicyAgent } from "./policy-agent.ts";
import { ContextAgent } from "./context-agent.ts";
import { AuditAgent } from "./audit-agent.ts";
import { PolicyDefinitionAgent } from "./policy-definition-agent.ts";
import { PolicyMaintenanceAgent } from "./policy-maintenance-agent.ts";
import { ConfigurationAgent } from "./configuration-agent.ts";
import { InboxAgent } from "./inbox-agent.ts";
import { SimulationAgent } from "./simulation-agent.ts";
import { AssetDeclarationAgent } from "./asset-declaration-agent.ts";

/**
 * Base Agent Interface
 */
export interface Agent {
  process(input: any, context: Record<string, unknown>): Promise<any>;
}

/**
 * AgentRegistry - Central registry for all agents
 * 
 * Manages agent lifecycle and provides unified access
 */
export class AgentRegistry {
  private agents: Map<string, Agent>;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.agents = new Map();
    this.registerAgents();
  }

  /**
   * Register all available agents
   */
  private registerAgents(): void {
    // Boundary governance agents
    this.agents.set('policy', new PolicyAgent(this.supabase));
    this.agents.set('context', new ContextAgent(this.supabase));
    this.agents.set('audit', new AuditAgent(this.supabase));
    
    // Conversational policy creation
    this.agents.set('policy-definition', new PolicyDefinitionAgent(this.supabase));
    
    // Policy maintenance and optimization
    this.agents.set('policy-maintenance', new PolicyMaintenanceAgent(this.supabase));
    
    // Asset registry and configuration management
    this.agents.set('configuration', new ConfigurationAgent(this.supabase));
    
    // Task and approval routing
    this.agents.set('inbox', new InboxAgent(this.supabase));
    
    // Simulation and optimization
    this.agents.set('simulation', new SimulationAgent(this.supabase));
    
    // Universal asset governance
    this.agents.set('asset-declaration', new AssetDeclarationAgent(this.supabase));

    console.log('AgentRegistry initialized with agents:', Array.from(this.agents.keys()));
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): Agent {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent '${name}' not found. Available agents: ${Array.from(this.agents.keys()).join(', ')}`);
    }
    return agent;
  }

  /**
   * Check if agent exists
   */
  hasAgent(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * List all registered agents
   */
  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent metadata (for discovery/documentation)
   */
  getAgentMetadata(): Array<{ name: string; description: string; actions: string[] }> {
    return [
      {
        name: 'policy',
        description: 'Evaluates AI requests against boundary governance policies',
        actions: ['evaluate', 'validate']
      },
      {
        name: 'context',
        description: 'Analyzes AI request context and characteristics',
        actions: ['analyze']
      },
      {
        name: 'audit',
        description: 'Generates cryptographic proof bundles for audit trails',
        actions: ['generate_proof', 'verify_proof', 'export_trail']
      },
      {
        name: 'policy-definition',
        description: 'Conversational AI agent for creating governance policies from natural language',
        actions: ['define_policy', 'refine_policy', 'validate_consistency']
      },
      {
        name: 'policy-maintenance',
        description: 'Continuous policy health monitoring, anomaly detection, and optimization suggestions',
        actions: ['analyze', 'detect_anomalies', 'suggest_optimizations', 'validate_compliance', 'identify_cleanup']
      },
      {
        name: 'configuration',
        description: 'Asset registry management for models, data sources, and partner credentials with metadata validation',
        actions: ['validate_model', 'validate_data_source', 'check_metadata_consistency', 'get_dependencies', 'suggest_tags', 'generate_partner_key', 'check_key_expiration']
      },
      {
        name: 'inbox',
        description: 'Task and approval routing for human-in-the-loop workflows',
        actions: ['create_task', 'execute_action', 'update_task_status']
      },
      {
        name: 'simulation',
        description: 'Historical traffic analysis, cost optimization, and deprecation impact analysis',
        actions: ['historical_replay', 'cost_optimization', 'deprecation_impact', 'detect_conflicts']
      },
      {
        name: 'asset-declaration',
        description: 'Universal AI asset governance for declaring and validating tool usage in deliverables',
        actions: ['declare_asset', 'get_asset_declaration', 'list_asset_declarations', 'validate_asset_compliance', 'get_declaration_stats']
      }
    ];
  }
}
