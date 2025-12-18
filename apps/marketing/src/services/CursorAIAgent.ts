import { supabase } from '@/integrations/supabase/client';

export interface CursorAgentRequest {
  agentName: string;
  action: string;
  input: any;
  context: {
    enterpriseId?: string;
    workspaceId?: string;
    clientName?: string;
    [key: string]: any;
  };
}

export interface CursorAgentResponse {
  success: boolean;
  result: {
    decision: string;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    reasoning: string;
    metadata: any;
  };
  error?: string;
}

/**
 * CursorAIAgent - Real AI Integration Service
 * Connects Lovable frontend to sophisticated Cursor agent adapter
 */
export class CursorAIAgent {
  private static instance: CursorAIAgent;
  private supabaseUrl: string;

  private constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dqemokpnzasbeytdbzei.supabase.co';
  }

  static getInstance(): CursorAIAgent {
    if (!CursorAIAgent.instance) {
      CursorAIAgent.instance = new CursorAIAgent();
    }
    return CursorAIAgent.instance;
  }

  /**
   * Process policy documents with sophisticated AI analysis
   */
  async analyzePolicyDocument(document: any, enterpriseId: string, options: any = {}): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'policy',
      action: 'analyze',
      input: document,
      context: {
        enterpriseId,
        clientName: options.clientName,
        workspaceId: options.workspaceId,
        analysisType: 'comprehensive'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Validate policy compliance with FDA regulations
   */
  async validateCompliance(document: any, enterpriseId: string): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'policy',
      action: 'validate',
      input: document,
      context: {
        enterpriseId,
        validationType: 'fda_compliance'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Assess risks with sophisticated AI analysis
   */
  async assessRisk(document: any, enterpriseId: string): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'policy',
      action: 'assess_risk',
      input: document,
      context: {
        enterpriseId,
        riskType: 'comprehensive'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Analyze context and urgency with emotion detection
   */
  async analyzeContext(contextData: any, enterpriseId: string): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'context',
      action: 'assess_context',
      input: contextData,
      context: {
        enterpriseId,
        analysisType: 'full_context'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Detect urgency and escalation needs
   */
  async analyzeUrgency(contextData: any, enterpriseId: string): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'context',
      action: 'analyze_urgency',
      input: contextData,
      context: {
        enterpriseId,
        urgencyType: 'escalation_analysis'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Detect emotions and stress indicators
   */
  async detectEmotion(contextData: any, enterpriseId: string): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'context',
      action: 'detect_emotion',
      input: contextData,
      context: {
        enterpriseId,
        emotionType: 'stress_analysis'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Process batch documents for agency workflows
   */
  async processBatch(documents: any[], agencyContext: any): Promise<CursorAgentResponse> {
    const request: CursorAgentRequest = {
      agentName: 'workflow',
      action: 'process_batch',
      input: { documents, agencyContext },
      context: {
        enterpriseId: agencyContext.enterpriseId,
        batchType: 'agency_processing'
      }
    };

    return this.processAgentRequest(request);
  }

  /**
   * Coordinate multiple agents for complex decisions
   */
  async coordinateAgents(agentRequests: CursorAgentRequest[]): Promise<CursorAgentResponse[]> {
    try {
      const promises = agentRequests.map(request => this.processAgentRequest(request));
      const results = await Promise.allSettled(promises);

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Agent ${agentRequests[index].agentName} failed:`, result.reason);
          return {
            success: false,
            result: {
              decision: 'error',
              confidence: 0.1,
              riskLevel: 'high' as const,
              reasoning: `Agent coordination failed: ${result.reason}`,
              metadata: { error: result.reason }
            },
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
          };
        }
      });
    } catch (error) {
      console.error('Agent coordination error:', error);
      throw error;
    }
  }

  /**
   * Get real-time agent activity for dashboard
   */
  async getAgentActivities(enterpriseId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('agent_activities')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch agent activities:', error);
      return [];
    }
  }

  /**
   * Get AI decision history for precedent learning
   */
  async getDecisionHistory(enterpriseId: string, agentName?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('ai_agent_decisions')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('created_at', { ascending: false });

      if (agentName) {
        query = query.eq('agent', agentName);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch decision history:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time agent updates
   */
  subscribeToAgentUpdates(enterpriseId: string, callback: (update: any) => void) {
    return supabase
      .channel('agent-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_activities',
        filter: `enterprise_id=eq.${enterpriseId}`
      }, callback)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_agent_decisions',
        filter: `enterprise_id=eq.${enterpriseId}`
      }, callback)
      .subscribe();
  }

  /**
   * Execute a specific agent action (for RFP workflow)
   */
  static async executeAgentAction(params: {
    agentName: string;
    action: string;
    context: any;
    workspaceId: string;
    enterpriseId: string;
  }): Promise<{ confidence: number; reasoning: string; result: any }> {
    const instance = CursorAIAgent.getInstance();
    const request: CursorAgentRequest = {
      agentName: params.agentName,
      action: params.action,
      input: params.context,
      context: {
        enterpriseId: params.enterpriseId,
        workspaceId: params.workspaceId,
      }
    };

    const response = await instance.processAgentRequest(request);
    return {
      confidence: response.result.confidence,
      reasoning: response.result.reasoning,
      result: response.result.metadata,
    };
  }

  /**
   * Core method to process agent requests with real AI
   */
  private async processAgentRequest(request: CursorAgentRequest): Promise<CursorAgentResponse> {
    try {
      console.log(`Processing ${request.agentName}:${request.action} with real AI`);

      const response = await fetch(`${this.supabaseUrl}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: CursorAgentResponse = await response.json();
      
      console.log(`✅ ${request.agentName} completed with ${result.result.confidence} confidence`);
      
      return result;
    } catch (error) {
      console.error('CursorAIAgent request failed:', error);
      
      // Return fallback response
      return {
        success: false,
        result: {
          decision: 'error',
          confidence: 0.1,
          riskLevel: 'high',
          reasoning: `AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
          metadata: {
            fallback: true,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for AI services
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const testRequest: CursorAgentRequest = {
        agentName: 'policy',
        action: 'analyze',
        input: { title: 'Health Check', content: 'Test document for health check' },
        context: { enterpriseId: 'health-check' }
      };

      const response = await this.processAgentRequest(testRequest);
      
      return {
        status: response.success ? 'healthy' : 'degraded',
        details: {
          aiAvailable: response.success,
          confidence: response.result.confidence,
          provider: response.result.metadata?.aiProvider || 'unknown'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export singleton instance
export const cursorAIAgent = CursorAIAgent.getInstance();