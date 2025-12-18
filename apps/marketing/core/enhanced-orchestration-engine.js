/**
 * Enhanced Agent Integration & Orchestration Engine
 * 
 * Connects all existing agents with Trust & Transparency Layer and Agency-Enterprise Bridge
 * Provides intelligent workflow routing based on enterprise-agency relationships
 */

const EventBus = require('./event-bus');
const agentRegistry = require('../agents/agent-registry');
const pool = require('../database/connection');
const TrustTransparencyLayer = require('./trust-transparency-layer');
const AgencyEnterpriseBridge = require('./agency-enterprise-bridge');

// Enhanced workflow configurations
const WORKFLOWS = {
  'agency-tool-submission': {
    agents: ['pre-flight', 'context', 'policy', 'conflict-detection', 'negotiation', 'audit'],
    enterprise_review: true,
    sla_hours: 48,
    auto_distribute: true, // Distribute to connected agencies if approved
    description: 'Agency AI tool submission workflow with enterprise review'
  },
  'enterprise-policy-creation': {
    agents: ['context', 'policy', 'conflict-detection', 'audit'],
    auto_distribute: true, // Auto-distribute to agencies
    requires_approval: false,
    sla_hours: 24,
    description: 'Enterprise policy creation with automatic distribution'
  },
  'multi-client-conflict-resolution': {
    agents: ['context', 'conflict-detection', 'negotiation', 'audit'],
    requires_human_review: true,
    escalation_level: 'high',
    sla_hours: 72,
    description: 'Multi-client conflict resolution with human oversight'
  },
  'compliance-audit-workflow': {
    agents: ['audit', 'pattern-recognition', 'policy'],
    schedule: 'weekly',
    generates_reports: true,
    auto_notify: ['enterprise', 'agencies'],
    description: 'Scheduled compliance audit with automated reporting'
  },
  'human-override-review': {
    agents: ['context', 'audit'],
    requires_human_review: true,
    escalation_level: 'critical',
    sla_hours: 4,
    description: 'Human override review workflow'
  },
  'policy-distribution-sync': {
    agents: ['policy', 'conflict-detection', 'audit'],
    auto_distribute: true,
    real_time_sync: true,
    description: 'Real-time policy distribution and sync'
  }
};

class EnhancedOrchestrationEngine {
  constructor() {
    this.registry = agentRegistry;
    this.workflows = WORKFLOWS;
    this.activeWorkflows = new Map();
    this.enterpriseAgencyRelationships = new Map();
    this.trustTransparencyLayer = new TrustTransparencyLayer();
    this.agencyEnterpriseBridge = new AgencyEnterpriseBridge();
    
    this.setupEventListeners();
  }

  /**
   * Main orchestration method - intelligently routes requests
   */
  async orchestrateRequest(input, context) {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      console.log('🚀 Enhanced Orchestration Engine Starting...');
      console.log(`📝 Request Type: ${input.type || 'unknown'}`);
      console.log(`👤 User Context: ${context.userId || 'anonymous'}`);
      console.log(`🏢 Enterprise: ${context.enterpriseId || 'unknown'}`);
      console.log(`🏭 Agency: ${context.agencyId || 'none'}`);

      // Pre-step: Resolve tenant context
      const tenantAgent = this.registry.getAgent('multi-tenant-orchestrator');
      if (tenantAgent) {
        const tenantInfo = await tenantAgent.process(input, context);
        context = { ...context, tenantInfo };
      }

      // Step 1: Determine workflow type based on input, triage, and context
      let workflowType = await this.determineWorkflowType(input, context);
      const triage = this.registry.getAgent('triage-router');
      if (triage) {
        try {
          const triageResult = await triage.process(input, { ...context, sessionId });
          if (triageResult?.workflowType) {
            workflowType = triageResult.workflowType;
          }
        } catch (e) {
          console.warn('Triage agent failed, falling back to default workflow:', e.message);
        }
      }
      
      // Step 2: Initialize Trust & Transparency Layer
      await this.trustTransparencyLayer.initializeSession(sessionId, context);
      
      // Step 3: Execute workflow with enhanced monitoring
      const result = await this.executeEnhancedWorkflow(workflowType, input, context, sessionId);

      // Pre-response guardrail validation
      const guardrails = this.registry.getAgent('guardrail-orchestrator');
      if (guardrails) {
        const guard = await guardrails.process(result, { ...context, requestType: input?.type });
        if (!guard.ok) {
          // Escalate to human if violations present
          const escalator = this.registry.getAgent('human-escalation');
          if (escalator) {
            await escalator.process({ agentName: 'guardrail-orchestrator', reason: 'guardrail_violations', result }, { ...context, sessionId });
          }
        }
      }
      
      // Step 4: Handle post-workflow actions (distribution, notifications, etc.)
      await this.handlePostWorkflowActions(result, context);
      
      // Step 5: Generate comprehensive audit trail
      const auditTrail = await this.generateComprehensiveAuditTrail(sessionId, result);
      
      const processingTime = Date.now() - startTime;
      
      return {
        sessionId,
        workflowType,
        result,
        auditTrail,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Orchestration Error:', error);
      await this.handleOrchestrationError(error, sessionId, context);
      throw error;
    }
  }

  /**
   * Determine the appropriate workflow based on input and context
   */
  async determineWorkflowType(input, context) {
    const { type, content, enterpriseId, agencyId } = input;
    
    // Check enterprise-agency relationship
    const relationship = await this.getEnterpriseAgencyRelationship(enterpriseId, agencyId);
    
    // Determine workflow based on input type and relationship
    if (type === 'agency-tool-submission') {
      return 'agency-tool-submission';
    } else if (type === 'enterprise-policy-creation') {
      return 'enterprise-policy-creation';
    } else if (type === 'multi-client-conflict') {
      return 'multi-client-conflict-resolution';
    } else if (type === 'compliance-audit') {
      return 'compliance-audit-workflow';
    } else if (type === 'human-override') {
      return 'human-override-review';
    } else if (type === 'policy-distribution') {
      return 'policy-distribution-sync';
    }
    
    // Default to standard workflow
    return 'enterprise-policy-creation';
  }

  /**
   * Execute enhanced workflow with all agents
   */
  async executeEnhancedWorkflow(workflowType, input, context, sessionId) {
    const workflow = this.workflows[workflowType];
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    console.log(`🔄 Executing Workflow: ${workflowType}`);
    console.log(`📋 Agents: ${workflow.agents.join(', ')}`);
    console.log(`⏱️  SLA: ${workflow.sla_hours} hours`);

    const results = {};
    const auditEntries = [];

    // Execute agents in sequence
    for (const agentName of workflow.agents) {
      try {
        console.log(`🤖 Running Agent: ${agentName}`);
        
        // Get agent from registry
        const agent = this.registry.getAgent(agentName);
        if (!agent) {
          console.warn(`⚠️  Agent not found: ${agentName}`);
          results[agentName] = { skipped: true, reason: 'Agent not found' };
          continue;
        }

        // Prepare agent input with enhanced context
        const agentInput = this.prepareAgentInput(agentName, input, context, results);
        
        // Execute agent
        const agentResult = await agent.process(agentInput, {
          ...context,
          sessionId,
          workflowType,
          previousResults: results
        });

        // Store result
        results[agentName] = agentResult;

        // Log to audit trail
        const auditEntry = await this.trustTransparencyLayer.logAgentDecision(
          sessionId,
          agentName,
          agentResult,
          context
        );
        auditEntries.push(auditEntry);

        // Check for human review requirement
        if (agentResult.requiresHumanReview || agentResult.confidence < 0.7) {
          await this.handleHumanReviewRequirement(agentName, agentResult, context, sessionId);
        }

        // Emit agent completion event
        EventBus.emit('agent-completed', {
          sessionId,
          agentName,
          result: agentResult,
          timestamp: new Date()
        });

      } catch (error) {
        console.error(`❌ Agent ${agentName} failed:`, error);
        results[agentName] = { error: error.message, status: 'failed' };
        
        // Log error to audit trail
        await this.trustTransparencyLayer.logAgentError(sessionId, agentName, error, context);
      }
    }

    // Generate final result
    const finalResult = this.generateFinalResult(results, workflow, context);
    
    // Handle auto-distribution if configured
    if (workflow.auto_distribute && finalResult.status === 'approved') {
      await this.handleAutoDistribution(finalResult, context);
    }

    return {
      workflowType,
      results,
      finalResult,
      auditEntries,
      sla: workflow.sla_hours
    };
  }

  /**
   * Prepare agent-specific input with enhanced context
   */
  prepareAgentInput(agentName, input, context, previousResults) {
    const baseInput = {
      ...input,
      context,
      previousResults,
      sessionId: context.sessionId
    };

    // Agent-specific input preparation
    switch (agentName) {
      case 'context':
        return {
          ...baseInput,
          userMessage: input.content || input.message,
          userContext: context.userContext
        };
      
      case 'policy':
        return {
          ...baseInput,
          policies: context.policies || [],
          riskFactors: context.riskFactors || []
        };
      
      case 'conflict-detection':
        return {
          ...baseInput,
          policies: context.policies || [],
          clients: context.clients || []
        };
      
      case 'negotiation':
        return {
          ...baseInput,
          clients: context.clients || [],
          conflicts: previousResults['conflict-detection']?.conflicts || []
        };
      
      case 'audit':
        return {
          ...baseInput,
          allResults: previousResults,
          auditLevel: context.auditLevel || 'standard'
        };
      
      default:
        return baseInput;
    }
  }

  /**
   * Handle post-workflow actions (distribution, notifications, etc.)
   */
  async handlePostWorkflowActions(result, context) {
    const { workflowType, finalResult } = result;
    const workflow = this.workflows[workflowType];

    // Handle auto-distribution
    if (workflow.auto_distribute && finalResult.status === 'approved') {
      await this.agencyEnterpriseBridge.distributeToAgencies(finalResult, context);
    }

    // Handle notifications
    if (workflow.auto_notify) {
      await this.sendNotifications(workflow.auto_notify, result, context);
    }

    // Handle human review requirements
    if (workflow.requires_human_review || finalResult.requiresHumanReview) {
      await this.createHumanReviewRequest(result, context);
    }

    // Handle real-time sync
    if (workflow.real_time_sync) {
      await this.syncRealTimeUpdates(result, context);
    }
  }

  /**
   * Generate comprehensive audit trail
   */
  async generateComprehensiveAuditTrail(sessionId, result) {
    const auditTrail = {
      sessionId,
      workflowType: result.workflowType,
      agentsExecuted: Object.keys(result.results),
      finalDecision: result.finalResult,
      auditEntries: result.auditEntries,
      timestamp: new Date().toISOString()
    };

    // Store in database
    await this.storeAuditTrail(auditTrail);

    return auditTrail;
  }

  /**
   * Handle human review requirements
   */
  async handleHumanReviewRequirement(agentName, agentResult, context, sessionId) {
    const reviewRequest = {
      sessionId,
      agentName,
      reason: agentResult.requiresHumanReview ? 'Agent flagged for review' : 'Low confidence',
      confidence: agentResult.confidence,
      result: agentResult,
      context,
      timestamp: new Date().toISOString()
    };

    // Create human override request
    await this.createHumanOverrideRequest(reviewRequest);
    
    // Notify relevant parties
    await this.notifyHumanReviewRequired(reviewRequest);
  }

  /**
   * Handle auto-distribution to agencies
   */
  async handleAutoDistribution(result, context) {
    const { enterpriseId } = context;
    
    // Get connected agencies
    const agencies = await this.getConnectedAgencies(enterpriseId);
    
    // Distribute to each agency
    for (const agency of agencies) {
      await this.agencyEnterpriseBridge.distributeToAgency(result, agency, context);
    }
  }

  /**
   * Get enterprise-agency relationship
   */
  async getEnterpriseAgencyRelationship(enterpriseId, agencyId) {
    if (!enterpriseId || !agencyId) {
      return { type: 'none', trustLevel: 0 };
    }

    try {
      const query = `
        SELECT relationship_status, compliance_score, last_audit_date
        FROM agency_enterprise_relationships
        WHERE enterprise_org_id = $1 AND agency_org_id = $2
      `;
      
      const result = await pool.query(query, [enterpriseId, agencyId]);
      
      if (result.rows.length > 0) {
        const relationship = result.rows[0];
        return {
          type: relationship.relationship_status,
          trustLevel: relationship.compliance_score / 100,
          lastAudit: relationship.last_audit_date
        };
      }
      
      return { type: 'none', trustLevel: 0 };
    } catch (error) {
      console.error('Error getting enterprise-agency relationship:', error);
      return { type: 'none', trustLevel: 0 };
    }
  }

  /**
   * Get connected agencies for an enterprise
   */
  async getConnectedAgencies(enterpriseId) {
    try {
      const query = `
        SELECT a.id, a.name, aer.compliance_score, aer.relationship_status
        FROM organizations a
        JOIN agency_enterprise_relationships aer ON a.id = aer.agency_org_id
        WHERE aer.enterprise_org_id = $1 AND aer.relationship_status = 'active'
      `;
      
      const result = await pool.query(query, [enterpriseId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting connected agencies:', error);
      return [];
    }
  }

  /**
   * Setup event listeners for enhanced orchestration
   */
  setupEventListeners() {
    EventBus.on('agent-completed', this.handleAgentCompletion.bind(this));
    EventBus.on('human-override-requested', this.handleHumanOverrideRequest.bind(this));
    EventBus.on('policy-distributed', this.handlePolicyDistribution.bind(this));
  }

  /**
   * Handle agent completion events
   */
  handleAgentCompletion(event) {
    console.log(`✅ Agent ${event.agentName} completed in ${event.duration}ms`);
    
    // Update pattern recognition
    const patternAgent = this.registry.getAgent('pattern-recognition');
    if (patternAgent) {
      patternAgent.analyzeAgentResult(event);
    }
  }

  /**
   * Handle human override requests
   */
  async handleHumanOverrideRequest(event) {
    console.log('🔄 Human override requested:', event);
    
    // Create override request in database
    await this.createOverrideRequest(event);
    
    // Notify relevant parties
    await this.notifyOverrideRequest(event);
  }

  /**
   * Handle policy distribution events
   */
  async handlePolicyDistribution(event) {
    console.log('📤 Policy distributed:', event);
    
    // Update distribution tracking
    await this.updatePolicyDistribution(event);
    
    // Notify agencies
    await this.notifyAgenciesOfDistribution(event);
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store audit trail in database
   */
  async storeAuditTrail(auditTrail) {
    try {
      const query = `
        INSERT INTO audit_sessions (
          session_id, workflow_type, agents_executed, final_decision, 
          audit_entries, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await pool.query(query, [
        auditTrail.sessionId,
        auditTrail.workflowType,
        JSON.stringify(auditTrail.agentsExecuted),
        JSON.stringify(auditTrail.finalDecision),
        JSON.stringify(auditTrail.auditEntries),
        auditTrail.timestamp
      ]);
    } catch (error) {
      console.error('Error storing audit trail:', error);
    }
  }

  /**
   * Create human override request
   */
  async createOverrideRequest(reviewRequest) {
    try {
      const query = `
        INSERT INTO override_requests (
          session_id, agent_name, reason, confidence, result_data, 
          context_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await pool.query(query, [
        reviewRequest.sessionId,
        reviewRequest.agentName,
        reviewRequest.reason,
        reviewRequest.confidence,
        JSON.stringify(reviewRequest.result),
        JSON.stringify(reviewRequest.context),
        reviewRequest.timestamp
      ]);
    } catch (error) {
      console.error('Error creating override request:', error);
    }
  }

  /**
   * Generate final result from agent results
   */
  generateFinalResult(results, workflow, context) {
    const finalResult = {
      status: 'approved',
      requiresHumanReview: false,
      confidence: 0.8,
      reasoning: 'All agents completed successfully',
      nextSteps: [],
      distributedToAgencies: [],
      conflictsResolved: 0
    };

    // Check if any agent requires human review
    for (const [agentName, result] of Object.entries(results)) {
      if (result.requiresHumanReview || (result.confidence && result.confidence < 0.7)) {
        finalResult.requiresHumanReview = true;
        finalResult.status = 'requires_review';
        finalResult.reasoning = `${agentName} requires human review`;
      }
    }

    // Calculate overall confidence
    const confidences = Object.values(results)
      .filter(result => result.confidence)
      .map(result => result.confidence);
    
    if (confidences.length > 0) {
      finalResult.confidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    // Add workflow-specific logic
    if (workflow.auto_distribute) {
      finalResult.distributedToAgencies = ['agency_789', 'agency_101', 'agency_112']; // Mock data
    }

    if (workflow.requires_human_review) {
      finalResult.requiresHumanReview = true;
      finalResult.status = 'requires_review';
    }

    return finalResult;
  }

  /**
   * Handle orchestration errors
   */
  async handleOrchestrationError(error, sessionId, context) {
    console.error('Orchestration error:', error);
    
    // Log error to audit trail
    await this.trustTransparencyLayer.logOrchestrationError(sessionId, error, context);
    
    // Notify administrators
    await this.notifyAdministrators(error, sessionId, context);
  }

  /**
   * Send notifications to relevant parties
   */
  async sendNotifications(recipients, result, context) {
    // Implementation for sending notifications
    console.log(`📧 Sending notifications to: ${recipients.join(', ')}`);
  }

  /**
   * Create human review request
   */
  async createHumanReviewRequest(result, context) {
    // Implementation for creating human review request
    console.log('👤 Creating human review request');
  }

  /**
   * Sync real-time updates
   */
  async syncRealTimeUpdates(result, context) {
    // Implementation for real-time sync
    console.log('🔄 Syncing real-time updates');
  }

  /**
   * Notify human review required
   */
  async notifyHumanReviewRequired(reviewRequest) {
    // Implementation for notifying human review
    console.log('🔔 Notifying human review required');
  }

  /**
   * Notify override request
   */
  async notifyOverrideRequest(event) {
    // Implementation for notifying override request
    console.log('🔔 Notifying override request');
  }

  /**
   * Update policy distribution
   */
  async updatePolicyDistribution(event) {
    // Implementation for updating policy distribution
    console.log('📤 Updating policy distribution');
  }

  /**
   * Notify agencies of distribution
   */
  async notifyAgenciesOfDistribution(event) {
    // Implementation for notifying agencies
    console.log('📧 Notifying agencies of distribution');
  }

  /**
   * Notify administrators
   */
  async notifyAdministrators(error, sessionId, context) {
    // Implementation for notifying administrators
    console.log('🚨 Notifying administrators of error');
  }
}

module.exports = EnhancedOrchestrationEngine; 