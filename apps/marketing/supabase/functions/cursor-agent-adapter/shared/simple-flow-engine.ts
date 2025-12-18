// ================================
// SIMPLE FLOW ENGINE
// ================================
// Lightweight flow executor that follows flow definitions step-by-step
// Provides transparency and auditability without requiring Temporal/LangGraph

import { agentRegistry } from '../cursor-agent-registry.ts';
import { FlowDefinition, FlowNode, FlowStep } from './flow-types.ts';

export class SimpleFlowEngine {
  constructor(
    private supabase: any,
    private agentRegistry: any
  ) {}

  async executeFlow(
    flowDef: FlowDefinition,
    initialInput: any,
    context: any
  ): Promise<any> {
    // Create flow run
    const { data: flowRun, error: runError } = await this.supabase
      .from('flow_runs')
      .insert({
        enterprise_id: context.enterprise_id,
        flow_definition_id: flowDef.id,
        status: 'running',
        current_node: flowDef.entryNode,
        context: { input: initialInput },
        initiated_by: context.userId,
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create flow run: ${runError.message}`);
    }

    let currentNode = flowDef.entryNode;
    let flowContext = { ...initialInput };
    let stepOrder = 0;

    try {
      while (currentNode) {
        const node = flowDef.nodes.find(n => n.id === currentNode);
        if (!node) {
          console.warn(`[FlowEngine] Node ${currentNode} not found, ending flow`);
          break;
        }

        if (node.type === 'end') {
          break;
        }

        const stepStartTime = Date.now();
        let stepResult: any;
        let stepError: string | null = null;

        try {
          // Update flow run current node
          await this.supabase
            .from('flow_runs')
            .update({ current_node: currentNode })
            .eq('id', flowRun.id);

          // Execute node
          if (node.type === 'agent' && node.agent) {
            stepResult = await this.executeAgentNode(node, flowContext, context, flowRun.id);
          } else if (node.type === 'human_gate') {
            // Pause execution, wait for human input
            await this.supabase
              .from('flow_runs')
              .update({ 
                status: 'waiting_for_human',
                current_node: currentNode 
              })
              .eq('id', flowRun.id);

            return {
              flowRunId: flowRun.id,
              status: 'waiting_for_human',
              currentNode,
              context: flowContext,
            };
          } else if (node.type === 'condition') {
            stepResult = await this.evaluateCondition(node, flowContext);
          } else if (node.type === 'merge') {
            // Merge node - just pass through context
            stepResult = {};
          }

          // Update flow context with step result
          flowContext = { ...flowContext, ...stepResult };

          // Log successful step
          stepOrder++;
          await this.logFlowStep({
            flowRunId: flowRun.id,
            nodeId: node.id,
            agentName: node.agent,
            inputData: flowContext,
            outputData: stepResult,
            durationMs: Date.now() - stepStartTime,
            stepOrder,
          });

          // Log event
          await this.logEvent({
            aggregateId: flowRun.id,
            aggregateType: 'flow_run',
            eventType: `flow_step_completed`,
            payload: {
              nodeId: node.id,
              agentName: node.agent,
              result: stepResult,
            },
            metadata: {
              flowDefinitionId: flowDef.id,
              flowDefinitionName: flowDef.name,
              flowDefinitionVersion: flowDef.version,
            },
          });

          // Determine next node
          currentNode = this.getNextNode(flowDef, currentNode, stepResult);

        } catch (error) {
          stepError = error.message || String(error);
          stepOrder++;

          // Log failed step
          await this.logFlowStep({
            flowRunId: flowRun.id,
            nodeId: node.id,
            agentName: node.agent,
            inputData: flowContext,
            errorMessage: stepError,
            durationMs: Date.now() - stepStartTime,
            stepOrder,
          });

          // Update flow run status
          await this.supabase
            .from('flow_runs')
            .update({ 
              status: 'failed',
              current_node: currentNode,
              error_message: stepError
            })
            .eq('id', flowRun.id);

          throw error;
        }
      }

      // Flow completed successfully
      await this.supabase
        .from('flow_runs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_node: null 
        })
        .eq('id', flowRun.id);

      return {
        flowRunId: flowRun.id,
        status: 'completed',
        result: flowContext,
      };

    } catch (error) {
      // Flow failed
      await this.supabase
        .from('flow_runs')
        .update({ 
          status: 'failed',
          error_message: error.message || String(error)
        })
        .eq('id', flowRun.id);

      throw error;
    }
  }

  private async executeAgentNode(
    node: FlowNode,
    flowContext: any,
    context: any,
    flowRunId: string
  ): Promise<any> {
    const agent = this.agentRegistry.getAgent(node.agent!);
    if (!agent) {
      throw new Error(`Agent ${node.agent} not found`);
    }

    // Prepare agent input from flow context
    const agentInput = {
      ...flowContext,
      flowNodeId: node.id,
      flowRunId,
      ...(node.config || {}),
    };

    return await agent.process(agentInput, {
      ...context,
      flowRunId,
    });
  }

  private async evaluateCondition(node: FlowNode, flowContext: any): Promise<any> {
    // Simple condition evaluation
    const condition = node.config?.condition;
    if (!condition) return { conditionMet: true };

    // Evaluate based on config
    const field = node.config?.field;
    if (field) {
      const value = flowContext[field];
      return { 
        conditionMet: Boolean(value),
        [field]: value 
      };
    }

    return { conditionMet: true };
  }

  private getNextNode(
    flowDef: FlowDefinition,
    currentNode: string,
    stepResult: any
  ): string | null {
    const edges = flowDef.edges.filter(e => e.from === currentNode);
    
    if (edges.length === 0) return null; // End of flow
    if (edges.length === 1 && !edges[0].condition) return edges[0].to; // Single path

    // Multiple edges - evaluate conditions
    for (const edge of edges) {
      if (edge.condition) {
        if (this.evaluateEdgeCondition(edge.condition, stepResult, flowDef.nodes.find(n => n.id === currentNode))) {
          return edge.to;
        }
      } else {
        // Default path (no condition)
        return edge.to;
      }
    }

    return null;
  }

  private evaluateEdgeCondition(
    condition: string, 
    data: any,
    currentNode?: FlowNode
  ): boolean {
    // Handle negation
    if (condition.startsWith('!')) {
      const field = condition.substring(1);
      return !data[field];
    }

    // Direct field check
    if (data[condition] !== undefined) {
      return Boolean(data[condition]);
    }

    // Check if condition matches a field in the data
    if (data[condition] === true || data[condition] === 'true') {
      return true;
    }

    // Numeric comparisons (e.g., "risk_level > 0.7")
    if (condition.includes('>')) {
      const [field, thresholdStr] = condition.split('>').map(s => s.trim());
      const threshold = parseFloat(thresholdStr);
      const value = parseFloat(data[field]);
      return !isNaN(value) && !isNaN(threshold) && value > threshold;
    }

    if (condition.includes('<')) {
      const [field, thresholdStr] = condition.split('<').map(s => s.trim());
      const threshold = parseFloat(thresholdStr);
      const value = parseFloat(data[field]);
      return !isNaN(value) && !isNaN(threshold) && value < threshold;
    }

    if (condition.includes('>=')) {
      const [field, thresholdStr] = condition.split('>=').map(s => s.trim());
      const threshold = parseFloat(thresholdStr);
      const value = parseFloat(data[field]);
      return !isNaN(value) && !isNaN(threshold) && value >= threshold;
    }

    if (condition.includes('<=')) {
      const [field, thresholdStr] = condition.split('<=').map(s => s.trim());
      const threshold = parseFloat(thresholdStr);
      const value = parseFloat(data[field]);
      return !isNaN(value) && !isNaN(threshold) && value <= threshold;
    }

    // Default to true if condition not recognized (fail open)
    console.warn(`[FlowEngine] Unrecognized condition: ${condition}, defaulting to true`);
    return true;
  }

  private async logFlowStep(step: Partial<FlowStep>): Promise<void> {
    await this.supabase.from('flow_steps').insert({
      flow_run_id: step.flowRunId,
      node_id: step.nodeId,
      agent_name: step.agentName,
      input_data: step.inputData,
      output_data: step.outputData,
      duration_ms: step.durationMs,
      error_message: step.errorMessage,
      step_order: step.stepOrder,
    });
  }

  private async logEvent(params: {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    payload: any;
    metadata?: any;
  }): Promise<void> {
    // Get previous hash for this aggregate
    const { data: lastEvent } = await this.supabase
      .from('vera.events')
      .select('content_hash')
      .eq('aggregate_id', params.aggregateId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastEvent?.content_hash || '';

    // Calculate content hash
    const contentToHash = JSON.stringify(params.payload) + previousHash;
    const contentHash = await this.calculateHash(contentToHash);

    await this.supabase.from('vera.events').insert({
      aggregate_id: params.aggregateId,
      aggregate_type: params.aggregateType,
      event_type: params.eventType,
      payload: params.payload,
      metadata: params.metadata || {},
      content_hash: contentHash,
      previous_hash: previousHash || null,
    });
  }

  private async calculateHash(content: string): Promise<string> {
    // Use Web Crypto API for SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

