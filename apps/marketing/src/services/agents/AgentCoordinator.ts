/**
 * Agent Coordination Service
 * Central nervous system for orchestrating Cursor AI agents with Lovable intelligence
 */
import { supabase } from '@/integrations/supabase/client';

export interface AgentRequest {
  agentType: string;
  context: any;
  enterpriseId: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  timeoutMs?: number;
}

export interface AgentResponse {
  agentType: string;
  decision: 'APPROVED' | 'REJECTED' | 'HUMAN_IN_LOOP';
  confidence: number;
  rationale: string;
  requiredControls: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  processingTime: number;
  metadata?: any;
}

export interface CoordinatedResponse {
  finalDecision: 'APPROVED' | 'REJECTED' | 'HUMAN_IN_LOOP';
  confidence: number;
  processingTime: number;
  agentResults: AgentResponse[];
  synthesizedRationale: string;
  recommendedActions: string[];
}

export class AgentCoordinator {
  
  /**
   * Coordinate multiple agents in parallel for intelligent decision making
   */
  static async coordinateAgents(
    requests: AgentRequest[]
  ): Promise<CoordinatedResponse> {
    const startTime = Date.now();
    
    try {
      // Execute all agent requests in parallel
      const agentPromises = requests.map(request => 
        this.executeAgent(request)
      );
      
      const agentResults = await Promise.allSettled(agentPromises);
      
      // Process results and handle any failures
      const successfulResults: AgentResponse[] = [];
      const failedAgents: string[] = [];
      
      agentResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
        } else {
          failedAgents.push(requests[index].agentType);
          console.error(`Agent ${requests[index].agentType} failed:`, result.reason);
        }
      });
      
      // Synthesize results using intelligent coordination
      const coordination = await this.synthesizeResults(successfulResults, failedAgents);
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...coordination,
        agentResults: successfulResults,
        processingTime
      };
      
    } catch (error) {
      console.error('Agent coordination failed:', error);
      throw new Error(`Agent coordination failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Execute individual agent through Supabase edge function
   */
  private static async executeAgent(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('agent-coordinator', {
        body: {
          agentType: request.agentType,
          context: request.context,
          enterpriseId: request.enterpriseId,
          priority: request.priority || 'medium'
        }
      });
      
      if (error) {
        throw new Error(`Agent ${request.agentType} execution failed: ${error.message}`);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...data,
        agentType: request.agentType,
        processingTime
      };
      
    } catch (error) {
      console.error(`Agent ${request.agentType} execution failed:`, error);
      
      // Return fallback response for failed agents
      return {
        agentType: request.agentType,
        decision: 'HUMAN_IN_LOOP',
        confidence: 0,
        rationale: `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiredControls: ['manual_review'],
        riskLevel: 'HIGH',
        processingTime: Date.now() - startTime,
        metadata: { error: true }
      };
    }
  }
  
  /**
   * Synthesize multiple agent results into coordinated decision
   */
  private static async synthesizeResults(
    agentResults: AgentResponse[],
    failedAgents: string[]
  ): Promise<Omit<CoordinatedResponse, 'agentResults' | 'processingTime'>> {
    
    if (agentResults.length === 0) {
      return {
        finalDecision: 'HUMAN_IN_LOOP',
        confidence: 0,
        synthesizedRationale: 'All agents failed - manual review required',
        recommendedActions: ['escalate_to_human', 'retry_analysis']
      };
    }
    
    // Calculate weighted decision based on agent confidence and risk levels
    const approvalVotes = agentResults.filter(r => r.decision === 'APPROVED');
    const rejectionVotes = agentResults.filter(r => r.decision === 'REJECTED');
    const humanLoopVotes = agentResults.filter(r => r.decision === 'HUMAN_IN_LOOP');
    
    // Weight votes by confidence and risk assessment
    const approvalWeight = approvalVotes.reduce((sum, r) => sum + (r.confidence * this.getRiskWeight(r.riskLevel)), 0);
    const rejectionWeight = rejectionVotes.reduce((sum, r) => sum + (r.confidence * this.getRiskWeight(r.riskLevel)), 0);
    const humanLoopWeight = humanLoopVotes.reduce((sum, r) => sum + (r.confidence * this.getRiskWeight(r.riskLevel)), 0);
    
    // Determine final decision
    let finalDecision: 'APPROVED' | 'REJECTED' | 'HUMAN_IN_LOOP';
    let confidence: number;
    
    if (humanLoopWeight > 0 || failedAgents.length > 0) {
      finalDecision = 'HUMAN_IN_LOOP';
      confidence = Math.max(0.3, 1 - (failedAgents.length / (agentResults.length + failedAgents.length)));
    } else if (rejectionWeight > approvalWeight) {
      finalDecision = 'REJECTED';
      confidence = rejectionWeight / (approvalWeight + rejectionWeight);
    } else if (approvalWeight > 0) {
      finalDecision = 'APPROVED';
      confidence = approvalWeight / (approvalWeight + rejectionWeight);
    } else {
      finalDecision = 'HUMAN_IN_LOOP';
      confidence = 0.3;
    }
    
    // Generate synthesized rationale
    const synthesizedRationale = this.generateSynthesizedRationale(
      agentResults, 
      finalDecision, 
      failedAgents
    );
    
    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      agentResults, 
      finalDecision, 
      failedAgents
    );
    
    return {
      finalDecision,
      confidence: Math.min(0.95, Math.max(0.05, confidence)),
      synthesizedRationale,
      recommendedActions
    };
  }
  
  /**
   * Get risk weighting factor for decision synthesis
   */
  private static getRiskWeight(riskLevel: string): number {
    switch (riskLevel) {
      case 'CRITICAL': return 2.0;
      case 'HIGH': return 1.5;
      case 'MEDIUM': return 1.0;
      case 'LOW': return 0.8;
      default: return 1.0;
    }
  }
  
  /**
   * Generate human-readable rationale from agent results
   */
  private static generateSynthesizedRationale(
    agentResults: AgentResponse[],
    finalDecision: string,
    failedAgents: string[]
  ): string {
    const rationales = agentResults.map(r => `${r.agentType}: ${r.rationale}`);
    
    let synthesis = `Based on analysis from ${agentResults.length} agents: `;
    
    if (finalDecision === 'APPROVED') {
      synthesis += 'Consensus indicates approval with appropriate controls. ';
    } else if (finalDecision === 'REJECTED') {
      synthesis += 'Multiple agents identified significant risks requiring rejection. ';
    } else {
      synthesis += 'Complex factors require human review for final determination. ';
    }
    
    if (failedAgents.length > 0) {
      synthesis += `Note: ${failedAgents.join(', ')} agents unavailable. `;
    }
    
    return synthesis + rationales.join(' | ');
  }
  
  /**
   * Generate actionable recommendations
   */
  private static generateRecommendedActions(
    agentResults: AgentResponse[],
    finalDecision: string,
    failedAgents: string[]
  ): string[] {
    const actions: string[] = [];
    
    // Collect required controls from all agents
    const allControls = agentResults.flatMap(r => r.requiredControls);
    const uniqueControls = [...new Set(allControls)];
    
    if (uniqueControls.length > 0) {
      actions.push(...uniqueControls);
    }
    
    // Add decision-specific actions
    if (finalDecision === 'HUMAN_IN_LOOP') {
      actions.push('escalate_to_human', 'detailed_review');
    }
    
    if (failedAgents.length > 0) {
      actions.push('retry_failed_agents', 'manual_verification');
    }
    
    // Add risk-based actions
    const highRiskAgents = agentResults.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
    if (highRiskAgents.length > 0) {
      actions.push('additional_safeguards', 'enhanced_monitoring');
    }
    
    return [...new Set(actions)];
  }
  
  /**
   * Quick single agent execution for simple cases
   */
  static async executeSimpleAgent(
    agentType: string,
    context: any,
    enterpriseId: string
  ): Promise<AgentResponse> {
    const request: AgentRequest = {
      agentType,
      context,
      enterpriseId,
      priority: 'medium'
    };
    
    return this.executeAgent(request);
  }
}