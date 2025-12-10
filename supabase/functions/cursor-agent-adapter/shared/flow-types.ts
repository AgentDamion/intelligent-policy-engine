// ================================
// FLOW ENGINE TYPES
// ================================
// Type definitions for the lightweight flow engine

export interface FlowNode {
  id: string;
  agent?: string; // Agent name if this is an agent node
  type: 'agent' | 'human_gate' | 'condition' | 'merge' | 'end';
  config?: any; // Node-specific configuration
  label?: string; // Human-readable label
}

export interface FlowEdge {
  from: string;
  to: string;
  condition?: string; // Optional condition expression (e.g., "requires_human_review", "risk_level > 0.7")
  label?: string;
}

export interface FlowDefinition {
  id?: string;
  name: string;
  version: string;
  description?: string;
  entryNode: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  is_active?: boolean;
}

export interface FlowRun {
  id: string;
  enterpriseId: string;
  flowDefinitionId: string;
  status: 'running' | 'completed' | 'failed' | 'waiting_for_human' | 'cancelled';
  currentNode?: string;
  context: any; // The "memory" of this run
  proofBundleId?: string;
  initiatedBy?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface FlowStep {
  id: string;
  flowRunId: string;
  nodeId: string;
  agentName?: string;
  inputData?: any;
  outputData?: any;
  durationMs?: number;
  errorMessage?: string;
  createdAt: string;
  stepOrder: number;
}

