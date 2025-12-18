/**
 * Real Cursor AI Integration for Agency Operations
 * Now uses AgentCoordinator for real agent intelligence
 */
import { AgentCoordinator } from '@/services/agents/AgentCoordinator';
import { supabase } from '@/integrations/supabase/client';
import webSocketService from './webSocketService';

export interface AgencyDocument {
  id: string;
  title: string;
  content: string;
  clientId: string;
  clientName: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface AgencyBatchResult {
  batchId: string;
  results: Array<{
    documentId: string;
    clientId: string;
    outcome: 'approved' | 'rejected' | 'needs_review';
    risk: 'low' | 'medium' | 'high';
    confidence: number;
    recommendations: string[];
  }>;
  summary: {
    totalProcessed: number;
    approvedCount: number;
    rejectedCount: number;
    processingTime: number;
  };
}

export class RealCursorAgencyIntegration {
  private static instance: RealCursorAgencyIntegration;
  private agencyContext: {
    agencyId: string;
    agencyName: string;
    clientIds: string[];
  } | null = null;

  static getInstance(): RealCursorAgencyIntegration {
    if (!RealCursorAgencyIntegration.instance) {
      RealCursorAgencyIntegration.instance = new RealCursorAgencyIntegration();
    }
    return RealCursorAgencyIntegration.instance;
  }

  setAgencyContext(context: { agencyId: string; agencyName: string; clientIds: string[] }) {
    this.agencyContext = context;
    console.log('Real Cursor Agency context set:', context);
  }

  /**
   * Process batch of documents through real agent coordination
   */
  async processBatch(documents: AgencyDocument[]): Promise<AgencyBatchResult> {
    if (!this.agencyContext) {
      throw new Error('Agency context must be set before batch processing');
    }

    console.log('Processing batch through real agent coordination:', documents.length, 'documents');

    try {
      // Prepare agent requests for batch processing
      const agentRequests = documents.map(doc => ({
        agentType: 'PolicyAgent',
        context: {
          document: {
            title: doc.title,
            content: doc.content,
            clientId: doc.clientId,
            clientName: doc.clientName,
            metadata: doc.metadata
          },
          agencyId: this.agencyContext!.agencyId,
          agencyName: this.agencyContext!.agencyName
        },
        enterpriseId: this.agencyContext!.agencyId,
        priority: 'medium' as const,
        timeout: 30000
      }));

      // Use AgentCoordinator for real intelligence
      const coordinatedResponse = await AgentCoordinator.coordinateAgents(agentRequests);

      // Transform coordination results into batch format
      const batchResult: AgencyBatchResult = {
        batchId: `batch-${Date.now()}`,
        results: documents.map((doc, index) => {
          const agentResult = coordinatedResponse.agentResults[index];
          return {
            documentId: doc.id,
            clientId: doc.clientId,
            outcome: coordinatedResponse.finalDecision === 'APPROVED' ? 'approved' : 
                    coordinatedResponse.finalDecision === 'REJECTED' ? 'rejected' : 'needs_review',
            risk: agentResult?.riskLevel === 'HIGH' ? 'high' : 
                  agentResult?.riskLevel === 'MEDIUM' ? 'medium' : 'low',
            confidence: agentResult?.confidence || 0.8,
            recommendations: coordinatedResponse.recommendedActions
          };
        }),
        summary: {
          totalProcessed: documents.length,
          approvedCount: coordinatedResponse.finalDecision === 'APPROVED' ? documents.length : 0,
          rejectedCount: coordinatedResponse.finalDecision === 'REJECTED' ? documents.length : 0,
          processingTime: coordinatedResponse.processingTime
        }
      };

      // Send real-time update via WebSocket
      webSocketService.sendMessage({
        type: 'agency_batch_complete',
        agencyId: this.agencyContext.agencyId,
        batchId: batchResult.batchId,
        summary: batchResult.summary
      });

      return batchResult;

    } catch (error) {
      console.error('Real agent coordination batch processing failed:', error);
      throw error;
    }
  }

  /**
   * Analyze client portfolio using real agent coordination
   */
  async analyzePortfolio(clientIds: string[], analysisType: 'risk' | 'compliance' | 'sla'): Promise<any> {
    if (!this.agencyContext) {
      throw new Error('Agency context required for portfolio analysis');
    }

    console.log('Real agent coordination portfolio analysis:', analysisType, 'for clients:', clientIds);

    try {
      // Prepare agent requests for portfolio analysis
      const agentRequests = [{
        agentType: 'ContextAgent',
        context: {
          analysisType,
          clientIds,
          agencyId: this.agencyContext.agencyId,
          agencyName: this.agencyContext.agencyName,
          portfolioMode: true
        },
        enterpriseId: this.agencyContext.agencyId,
        priority: 'high' as const,
        timeout: 45000
      }];

      // Use AgentCoordinator for real intelligence
      const coordinatedResponse = await AgentCoordinator.coordinateAgents(agentRequests);
      
      const result = {
        analysisType,
        clientIds,
        finalDecision: coordinatedResponse.finalDecision,
        overallRisk: 'MEDIUM', // Default risk level for portfolio analysis
        confidence: coordinatedResponse.confidence,
        reasoning: coordinatedResponse.synthesizedRationale,
        recommendations: coordinatedResponse.recommendedActions,
        processingTime: coordinatedResponse.processingTime
      };
      
      // Send real-time update
      webSocketService.sendMessage({
        type: 'agency_portfolio_complete',
        agencyId: this.agencyContext.agencyId,
        analysisType,
        clientIds,
        result
      });

      return result;

    } catch (error) {
      console.error('Real agent coordination portfolio analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get real AI agent decisions from database
   */
  async getRecentDecisions(limit: number = 10): Promise<any[]> {
    if (!this.agencyContext) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('ai_agent_decisions')
        .select('*')
        .eq('enterprise_id', this.agencyContext.agencyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch real AI decisions:', error);
      return [];
    }
  }

  /**
   * Get real-time analytics from actual database
   */
  async getAnalytics(): Promise<any> {
    if (!this.agencyContext) {
      return null;
    }

    try {
      const decisions = await this.getRecentDecisions(100);
      
      const analytics = {
        totalDecisions: decisions.length,
        approvedCount: decisions.filter(d => d.outcome === 'approved').length,
        rejectedCount: decisions.filter(d => d.outcome === 'rejected').length,
        avgProcessingTime: decisions.length > 0 
          ? decisions.reduce((sum, d) => sum + (d.details?.processingTime || 0), 0) / decisions.length 
          : 0,
        riskDistribution: {
          low: decisions.filter(d => d.risk === 'low').length,
          medium: decisions.filter(d => d.risk === 'medium').length,
          high: decisions.filter(d => d.risk === 'high').length
        }
      };

      return analytics;
    } catch (error) {
      console.error('Failed to generate real analytics:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time AI decision updates
   */
  subscribeToDecisions(callback: (decision: any) => void) {
    if (!this.agencyContext) {
      console.warn('No agency context for subscription');
      return () => {};
    }

    return webSocketService.subscribeToAIDecisions(callback);
  }
}

export const realCursorAgencyIntegration = RealCursorAgencyIntegration.getInstance();