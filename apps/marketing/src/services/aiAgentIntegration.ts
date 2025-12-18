import { supabase } from '@/integrations/supabase/client';
import webSocketService from './webSocketService';
import { AIDecision } from '@/hooks/useAIDecisions';

interface DocumentAnalysisRequest {
  type: string;
  content: string;
  metadata?: Record<string, any>;
  enterpriseId?: string;
  workspaceId?: string;
  documentId?: string;
  documentType?: string;
  analysisContext?: string;
}

interface AIAgentResponse {
  decision: AIDecision;
  confidence: number;
  reasoning: string;
  recommendations?: string[];
}

class AIAgentIntegration {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private rateLimiter = new Map<string, number>();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 30;
  private performanceMetrics = new Map<string, { totalRequests: number; avgResponseTime: number; errorRate: number }>();

  /**
   * Analyze a document using AI agents with enterprise context and performance optimization
   */
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<AIAgentResponse> {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      const userKey = request.enterpriseId || 'anonymous';
      if (!this.checkRateLimit(userKey)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        console.log('Returning cached analysis result for:', cacheKey);
        this.updatePerformanceMetrics(userKey, now - startTime, false);
        return cached.data;
      }

      console.log('AI Agent analyzing document:', {
        type: request.type,
        enterpriseId: request.enterpriseId,
        workspaceId: request.workspaceId,
        documentId: request.documentId
      });

      // Get enterprise context
      let enterpriseContext = '';
      if (request.enterpriseId && request.workspaceId) {
        enterpriseContext = await this.fetchEnterpriseContext(request.enterpriseId, request.workspaceId);
      }

      // Call enhanced AI analysis
      const analysisResult = await this.callRealAI({
        ...request,
        analysisContext: enterpriseContext
      });

      // Store decision in database with full context
      const decisionData = {
        enterprise_id: request.enterpriseId,
        agent: 'AI Compliance Agent',
        action: `Document Analysis: ${request.type}`,
        outcome: analysisResult.outcome as any,
        risk: analysisResult.risk as any,
        details: {
          confidence: analysisResult.confidence,
          reasoning: analysisResult.reasoning,
          content_type: request.type,
          document_id: request.documentId,
          workspace_id: request.workspaceId,
          processing_time_ms: now - startTime,
          cache_hit: false,
          enterprise_context_applied: !!enterpriseContext,
          recommendations: analysisResult.recommendations,
          policy_issues: analysisResult.policy_issues,
          security_concerns: analysisResult.security_concerns
        } as any
      };

      const { data: decision, error } = await supabase
        .from('ai_agent_decisions')
        .insert(decisionData)
        .select()
        .single();

      if (error) {
        console.error('Error storing AI decision:', error);
        throw error;
      }

      // Transform to AIDecision format
      const aiDecision: AIDecision = {
        id: decision.id.toString(),
        agent: decision.agent,
        action: decision.action,
        outcome: decision.outcome as AIDecision['outcome'],
        risk: decision.risk as AIDecision['risk'],
        details: decision.details as Record<string, any>,
        created_at: decision.created_at
      };

      // Cache successful result
      const response: AIAgentResponse = {
        decision: aiDecision,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        recommendations: analysisResult.recommendations
      };
      
      this.cache.set(cacheKey, { data: response, timestamp: now });

      // Emit real-time update via WebSocket with enterprise context
      webSocketService.sendMessage({
        type: 'ai_decision',
        enterpriseId: request.enterpriseId,
        workspaceId: request.workspaceId,
        ...aiDecision,
        source: 'ai_agent_integration'
      });

      // Update performance metrics
      this.updatePerformanceMetrics(userKey, now - startTime, false);

      console.log('AI Analysis complete:', {
        id: aiDecision.id,
        outcome: aiDecision.outcome,
        processingTime: now - startTime
      });
      
      return response;

    } catch (error) {
      console.error('AI Agent analysis failed:', error);
      this.updatePerformanceMetrics(request.enterpriseId || 'anonymous', Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Generate cache key for similar requests
   */
  private generateCacheKey(request: DocumentAnalysisRequest): string {
    const contentHash = request.content.substring(0, 100);
    return `${request.type}_${contentHash}_${request.enterpriseId || 'global'}`;
  }

  /**
   * Check and update rate limiting
   */
  private checkRateLimit(userKey: string): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(userKey) || 0;
    
    // Reset count every minute
    if (requests === 0) {
      setTimeout(() => this.rateLimiter.delete(userKey), this.RATE_LIMIT_WINDOW);
    }
    
    if (requests >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    this.rateLimiter.set(userKey, requests + 1);
    return true;
  }

  /**
   * Fetch enterprise-specific context for AI analysis
   */
  private async fetchEnterpriseContext(enterpriseId: string, workspaceId: string): Promise<string> {
    try {
      // Use basic enterprise info since policies table structure varies
      const { data: enterprise } = await supabase
        .from('enterprises')
        .select('name, domain, subscription_tier')
        .eq('id', enterpriseId)
        .single();

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name, enterprise_name')
        .eq('id', workspaceId)
        .single();

      let context = '';
      if (workspace) {
        context += `Analyzing for ${workspace.enterprise_name} - ${workspace.name}. `;
      }
      
      if (enterprise) {
        context += `Enterprise: ${enterprise.name}, Tier: ${enterprise.subscription_tier}.`;
      }

      return context;
    } catch (error) {
      console.warn('Could not fetch enterprise context:', error);
      return '';
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(userKey: string, responseTime: number, hadError: boolean) {
    const existing = this.performanceMetrics.get(userKey) || { totalRequests: 0, avgResponseTime: 0, errorRate: 0 };
    
    const newMetrics = {
      totalRequests: existing.totalRequests + 1,
      avgResponseTime: (existing.avgResponseTime * existing.totalRequests + responseTime) / (existing.totalRequests + 1),
      errorRate: (existing.errorRate * existing.totalRequests + (hadError ? 1 : 0)) / (existing.totalRequests + 1)
    };
    
    this.performanceMetrics.set(userKey, newMetrics);
  }

  /**
   * Real AI analysis using Lovable AI Gateway with enterprise context
   */
  private async callRealAI(request: DocumentAnalysisRequest) {
    const startTime = Date.now();
    console.log('Calling enhanced AI for document analysis:', request.type);

    try {
      // Enhanced structured prompt with enterprise context
      const analysisPrompt = `
        Analyze this ${request.type} document content for enterprise compliance:
        
        ${request.content}
        
        ${request.analysisContext ? `\nEnterprise Context: ${request.analysisContext}` : ''}
        
        Please provide a structured analysis in JSON format with the following fields:
        - document_type: detected type of document
        - outcome: "approved", "flagged", or "rejected"  
        - risk: "low", "medium", or "high"
        - confidence: number between 0 and 1
        - reasoning: detailed explanation of the analysis
        - recommendations: array of actionable recommendations
        - policy_issues: array of any policy violations found
        - security_concerns: array of security issues identified
        
        Focus on compliance, security, and regulatory aspects specific to this enterprise.
      `;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai', {
        body: { 
          message: analysisPrompt,
          enterpriseId: request.enterpriseId,
          workspaceId: request.workspaceId,
          documentType: request.type,
          analysisContext: request.analysisContext
        }
      });

      const processingTime = Date.now() - startTime;

      if (functionError) {
        console.error('AI function error:', functionError);
        throw new Error(functionError.message || "Failed to get AI response");
      }

      const aiResponse = functionData?.response;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      // Try to parse structured JSON response
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.log('AI response was not JSON, creating structured response from text');
        // Fallback: create structured response from text
        parsedResponse = this.parseTextResponse(aiResponse, request.type);
      }

      return {
        outcome: parsedResponse.outcome || 'flagged',
        risk: parsedResponse.risk || 'medium',
        confidence: parsedResponse.confidence || 0.8,
        reasoning: parsedResponse.reasoning || aiResponse,
        recommendations: parsedResponse.recommendations || ['Review document thoroughly'],
        timestamp: new Date().toISOString(),
        document_type: parsedResponse.document_type || request.type,
        policy_issues: parsedResponse.policy_issues || [],
        security_concerns: parsedResponse.security_concerns || [],
        processing_time_ms: processingTime,
        enhanced_with_enterprise_context: !!request.analysisContext
      };

    } catch (error) {
      console.error('Real AI analysis failed:', error);
      // Fallback to basic analysis with performance data
      return {
        ...this.createFallbackAnalysis(request),
        processing_time_ms: Date.now() - startTime,
        is_fallback: true
      };
    }
  }

  /**
   * Parse text response into structured format
   */
  private parseTextResponse(response: string, docType: string) {
    const lowerResponse = response.toLowerCase();
    
    // Determine outcome based on keywords
    let outcome = 'flagged';
    if (lowerResponse.includes('approved') || lowerResponse.includes('compliant')) {
      outcome = 'approved';
    } else if (lowerResponse.includes('rejected') || lowerResponse.includes('violation')) {
      outcome = 'rejected';
    }

    // Determine risk level
    let risk = 'medium';
    if (lowerResponse.includes('high risk') || lowerResponse.includes('critical')) {
      risk = 'high';
    } else if (lowerResponse.includes('low risk') || lowerResponse.includes('minimal')) {
      risk = 'low';
    }

    return {
      document_type: docType,
      outcome,
      risk,
      confidence: 0.75,
      reasoning: response,
      recommendations: ['Review AI analysis', 'Verify compliance status'],
      policy_issues: [],
      security_concerns: []
    };
  }

  /**
   * Fallback analysis when AI fails
   */
  private createFallbackAnalysis(request: DocumentAnalysisRequest) {
    return {
      outcome: 'flagged' as const,
      risk: 'medium' as const,
      confidence: 0.5,
      reasoning: 'AI analysis unavailable. Manual review required for complete assessment.',
      recommendations: ['Manual review required', 'Check AI service connectivity'],
      timestamp: new Date().toISOString(),
      document_type: request.type,
      policy_issues: ['Unable to verify policy compliance'],
      security_concerns: ['Unable to assess security risks']
    };
  }

  /**
   * Get AI agent status and health with performance metrics
   */
  async getAgentStatus(): Promise<{ connected: boolean; agents: string[]; performanceMetrics: Record<string, any> }> {
    return {
      connected: webSocketService.isConnected(),
      agents: ['AI Compliance Agent', 'Policy Analysis Agent', 'Risk Assessment Agent'],
      performanceMetrics: Object.fromEntries(this.performanceMetrics)
    };
  }

  /**
   * Send command to specific AI agent
   */
  async sendAgentCommand(agentId: string, command: any): Promise<boolean> {
    return webSocketService.sendToAIAgent(agentId, command);
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(enterpriseId?: string): Record<string, any> {
    if (enterpriseId) {
      return this.performanceMetrics.get(enterpriseId) || { totalRequests: 0, avgResponseTime: 0, errorRate: 0 };
    }
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Clear cache (for testing or manual cleanup)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('AI analysis cache cleared');
  }
}

// Export singleton instance
const aiAgentIntegration = new AIAgentIntegration();
export default aiAgentIntegration;

// Export class for testing
export { AIAgentIntegration };