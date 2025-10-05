/**
 * Cursor AI Agent - Main service for Cursor AI integration
 * Implements the CursorAIAgent mentioned in the analysis
 */

const { EnhancedAIClient } = require('./enhanced-ai-client.cjs');
const { EnhancedAgentCoordinator } = require('./enhanced-agent-coordinator.cjs');
const registry = require('./agent-registry.cjs');

class CursorAIAgent {
  constructor() {
    this.aiClient = new EnhancedAIClient();
    this.coordinator = new EnhancedAgentCoordinator();
    this.agentRegistry = registry;
  }

  /**
   * Process document with Cursor AI analysis
   * This is the main entry point mentioned in the analysis
   */
  static async processDocument(parsedDoc, enterpriseId) {
    const agent = new CursorAIAgent();
    return await agent.analyzeDocument(parsedDoc, enterpriseId);
  }

  /**
   * Analyze document using Cursor AI agents
   */
  async analyzeDocument(parsedDoc, enterpriseId) {
    try {
      console.log('🔍 Cursor AI Agent: Processing document for enterprise:', enterpriseId);
      
      // Prepare context for analysis
      const context = {
        enterprise_id: enterpriseId,
        document_type: parsedDoc.type || 'unknown',
        timestamp: new Date().toISOString(),
        analysis_type: 'document_compliance'
      };

      // Determine which agents to use based on document type
      const agentRequests = this.selectAgentsForDocument(parsedDoc, context);

      // Execute agents in parallel using enhanced coordinator
      const result = await this.coordinator.coordinateAgents(agentRequests);

      // Create AI decision object
      const aiDecision = {
        id: this.generateDecisionId(),
        enterprise_id: enterpriseId,
        document_id: parsedDoc.id || 'unknown',
        decision: result.finalDecision,
        confidence: result.confidence,
        reasoning: result.synthesizedRationale,
        agent_results: result.agentResults,
        recommended_actions: result.recommendedActions,
        metadata: {
          ...result.metadata,
          cursor_ai_version: '3.0',
          processing_agents: result.agentResults.length,
          failed_agents: result.failedAgents
        },
        created_at: new Date().toISOString()
      };

      // Log the decision for audit trail
      await this.logDecision(aiDecision);

      // Dispatch real-time update
      this.dispatchRealtimeUpdate(aiDecision);

      return aiDecision;

    } catch (error) {
      console.error('Cursor AI Agent Error:', error);
      
      // Return error decision
      return {
        id: this.generateDecisionId(),
        enterprise_id: enterpriseId,
        document_id: parsedDoc.id || 'unknown',
        decision: 'HUMAN_IN_LOOP',
        confidence: 0.0,
        reasoning: 'System error occurred, human review required',
        error: error.message,
        metadata: {
          cursor_ai_version: '3.0',
          error: true,
          processing_agents: 0,
          failed_agents: 1
        },
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Select appropriate agents for document analysis
   */
  selectAgentsForDocument(parsedDoc, context) {
    const baseAgents = [
      {
        agentName: 'context',
        input: parsedDoc,
        context: { ...context, analysis_type: 'document_classification' }
      },
      {
        agentName: 'policy',
        input: parsedDoc,
        context: { ...context, analysis_type: 'policy_compliance' }
      }
    ];

    // Add specialized agents based on document type
    const specializedAgents = this.getSpecializedAgents(parsedDoc, context);
    
    return [...baseAgents, ...specializedAgents];
  }

  /**
   * Get specialized agents based on document characteristics
   */
  getSpecializedAgents(parsedDoc, context) {
    const agents = [];

    // Always include compliance scoring
    agents.push({
      agentName: 'compliance-scoring',
      input: parsedDoc,
      context: { ...context, analysis_type: 'compliance_scoring' }
    });

    // Add conflict detection for policy documents
    if (parsedDoc.type === 'policy' || parsedDoc.content?.includes('policy')) {
      agents.push({
        agentName: 'conflict-detection',
        input: parsedDoc,
        context: { ...context, analysis_type: 'conflict_detection' }
      });
    }

    // Add pattern recognition for complex documents
    if (parsedDoc.content && parsedDoc.content.length > 1000) {
      agents.push({
        agentName: 'pattern-recognition',
        input: parsedDoc,
        context: { ...context, analysis_type: 'pattern_analysis' }
      });
    }

    // Add audit agent for compliance documents
    if (parsedDoc.type === 'compliance' || parsedDoc.content?.includes('compliance')) {
      agents.push({
        agentName: 'audit',
        input: parsedDoc,
        context: { ...context, analysis_type: 'audit_analysis' }
      });
    }

    return agents;
  }

  /**
   * Process RFP question using Cursor AI orchestration
   */
  async processRFPQuestion(question, organizationId, userId) {
    try {
      console.log('📋 Cursor AI Agent: Processing RFP question for org:', organizationId);

      const context = {
        enterprise_id: organizationId,
        user_id: userId,
        question_id: question.id,
        timestamp: new Date().toISOString(),
        analysis_type: 'rfp_question_analysis'
      };

      // Create agent requests for RFP processing
      const agentRequests = [
        {
          agentName: 'context',
          input: question,
          context: { ...context, analysis_type: 'rfp_question_classification' }
        },
        {
          agentName: 'policy',
          input: question,
          context: { ...context, analysis_type: 'rfp_requirements_mapping' }
        },
        {
          agentName: 'compliance-scoring',
          input: question,
          context: { ...context, analysis_type: 'rfp_compliance_scoring' }
        },
        {
          agentName: 'negotiation',
          input: question,
          context: { ...context, analysis_type: 'rfp_negotiation_strategy' }
        }
      ];

      // Execute agents in parallel
      const result = await this.coordinator.coordinateAgents(agentRequests);

      // Create RFP submission
      const submission = {
        id: this.generateDecisionId(),
        organization_id: organizationId,
        user_id: userId,
        question_id: question.id,
        decision: result.finalDecision,
        confidence: result.confidence,
        reasoning: result.synthesizedRationale,
        agent_analysis: result.agentResults,
        recommended_actions: result.recommendedActions,
        metadata: {
          ...result.metadata,
          rfp_processing: true,
          cursor_ai_version: '3.0'
        },
        created_at: new Date().toISOString()
      };

      // Log and dispatch
      await this.logDecision(submission);
      this.dispatchRealtimeUpdate(submission);

      return submission;

    } catch (error) {
      console.error('RFP Processing Error:', error);
      throw error;
    }
  }

  /**
   * Generate unique decision ID
   */
  generateDecisionId() {
    return `cursor_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log decision for audit trail
   */
  async logDecision(decision) {
    try {
      // In a real implementation, this would log to Supabase
      console.log('📝 Logging decision:', decision.id);
      
      // For now, just log to console
      console.log('Decision logged:', {
        id: decision.id,
        enterprise_id: decision.enterprise_id,
        decision: decision.decision,
        confidence: decision.confidence,
        timestamp: decision.created_at
      });
    } catch (error) {
      console.error('Failed to log decision:', error);
    }
  }

  /**
   * Dispatch real-time update
   */
  dispatchRealtimeUpdate(decision) {
    try {
      // In a real implementation, this would use Supabase Realtime
      console.log('📡 Dispatching real-time update for decision:', decision.id);
      
      // Dispatch custom event for frontend
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('ai-decision', {
          detail: decision
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to dispatch real-time update:', error);
    }
  }

  /**
   * Get agent status and metrics
   */
  async getAgentStatus() {
    const metrics = this.coordinator.getMetrics();
    const aiStatus = await this.aiClient.testConnection();
    
    return {
      cursor_ai_version: '3.0',
      status: 'active',
      metrics: {
        ...metrics,
        ai_provider: aiStatus.provider,
        ai_connected: aiStatus.success
      },
      agents: Object.keys(this.agentRegistry).filter(key => key !== 'getAgent'),
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Test Cursor AI system
   */
  async testSystem() {
    try {
      const testDoc = {
        id: 'test_doc',
        type: 'policy',
        content: 'Test policy document for Cursor AI analysis',
        tool: 'test_tool',
        vendor: 'test_vendor',
        usage: 'testing',
        dataHandling: 'no customer data'
      };

      const result = await this.analyzeDocument(testDoc, 'test_enterprise');
      
      return {
        success: true,
        test_result: result,
        system_status: 'operational'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        system_status: 'error'
      };
    }
  }
}

module.exports = { CursorAIAgent };
