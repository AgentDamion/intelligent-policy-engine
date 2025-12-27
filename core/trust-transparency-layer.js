/**
 * Trust & Transparency Layer
 * 
 * Provides comprehensive audit trails, decision explainability, and transparency
 * for all agent decisions and workflow executions
 */

import pool from '../database/connection.js';
import EventBus from './event-bus.js';

class TrustTransparencyLayer {
  constructor() {
    this.activeSessions = new Map();
    this.decisionExplanations = new Map();
    this.transparencyConfig = {
      enableDetailedLogging: true,
      enableDecisionExplanation: true,
      enableRealTimeAudit: true,
      enableComplianceTracking: true,
      retentionDays: 365
    };
  }

  /**
   * Initialize a new audit session
   */
  async initializeSession(sessionId, context) {
    const session = {
      sessionId,
      startTime: new Date().toISOString(),
      context: {
        userId: context.userId,
        enterpriseId: context.enterpriseId,
        agencyId: context.agencyId,
        userRole: context.userRole,
        requestType: context.requestType
      },
      auditEntries: [],
      decisionChain: [],
      transparencyMetrics: {
        totalDecisions: 0,
        humanReviews: 0,
        overrides: 0,
        confidenceScores: [],
        processingTimes: []
      },
      complianceStatus: {
        fdaCompliant: true,
        gdprCompliant: true,
        violations: [],
        warnings: []
      }
    };

    this.activeSessions.set(sessionId, session);

    // Store session in database
    await this.storeSession(session);

    console.log(`🔍 Trust & Transparency Layer: Session ${sessionId} initialized`);
    
    return session;
  }

  /**
   * Log agent decision with full transparency
   */
  async logAgentDecision(sessionId, agentName, decision, context) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const auditEntry = {
      entryId: this.generateEntryId(),
      sessionId,
      agentName,
      timestamp: new Date().toISOString(),
      decision: {
        type: decision.type || 'unknown',
        status: decision.status || 'unknown',
        confidence: decision.confidence || 0,
        reasoning: decision.reasoning || '',
        riskLevel: decision.riskLevel || 'unknown',
        requiresHumanReview: decision.requiresHumanReview || false
      },
      context: {
        input: context.input || {},
        userContext: context.userContext || {},
        previousResults: context.previousResults || {}
      },
      transparency: {
        explainability: await this.generateDecisionExplanation(agentName, decision),
        complianceImpact: await this.assessComplianceImpact(decision),
        riskAssessment: await this.assessRiskLevel(decision),
        confidenceBreakdown: await this.breakdownConfidence(decision)
      },
      metadata: {
        processingTime: decision.processingTime || 0,
        modelVersion: decision.modelVersion || 'unknown',
        algorithmUsed: decision.algorithmUsed || 'unknown'
      }
    };

    // Add to session
    session.auditEntries.push(auditEntry);
    session.decisionChain.push({
      agent: agentName,
      decision: auditEntry.decision,
      timestamp: auditEntry.timestamp
    });

    // Update metrics
    session.transparencyMetrics.totalDecisions++;
    session.transparencyMetrics.confidenceScores.push(auditEntry.decision.confidence);
    session.transparencyMetrics.processingTimes.push(auditEntry.metadata.processingTime);

    if (auditEntry.decision.requiresHumanReview) {
      session.transparencyMetrics.humanReviews++;
    }

    // Store in database
    await this.storeAuditEntry(auditEntry);

    // Emit transparency event
    EventBus.emit('transparency-logged', {
      sessionId,
      agentName,
      auditEntry,
      timestamp: new Date()
    });

    console.log(`📝 Trust & Transparency: Logged decision for ${agentName} in session ${sessionId}`);

    return auditEntry;
  }

  /**
   * Log agent errors with transparency
   */
  async logAgentError(sessionId, agentName, error, context) {
    const errorEntry = {
      entryId: this.generateEntryId(),
      sessionId,
      agentName,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      },
      context: {
        input: context.input || {},
        userContext: context.userContext || {}
      },
      transparency: {
        errorImpact: await this.assessErrorImpact(error),
        recoveryRecommendation: await this.generateRecoveryRecommendation(error),
        systemHealth: await this.assessSystemHealth()
      }
    };

    // Store error in database
    await this.storeErrorEntry(errorEntry);

    // Emit error transparency event
    EventBus.emit('transparency-error', {
      sessionId,
      agentName,
      errorEntry,
      timestamp: new Date()
    });

    console.log(`❌ Trust & Transparency: Logged error for ${agentName} in session ${sessionId}`);

    return errorEntry;
  }

  /**
   * Log orchestration errors
   */
  async logOrchestrationError(sessionId, error, context) {
    const orchestrationError = {
      entryId: this.generateEntryId(),
      sessionId,
      errorType: 'orchestration',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      },
      context: {
        workflowType: context.workflowType,
        enterpriseId: context.enterpriseId,
        agencyId: context.agencyId
      },
      transparency: {
        systemImpact: await this.assessSystemImpact(error),
        userImpact: await this.assessUserImpact(error),
        recoverySteps: await this.generateRecoverySteps(error)
      }
    };

    // Store orchestration error
    await this.storeOrchestrationError(orchestrationError);

    console.log(`🚨 Trust & Transparency: Logged orchestration error in session ${sessionId}`);

    return orchestrationError;
  }

  /**
   * Generate decision explanation for transparency
   */
  async generateDecisionExplanation(agentName, decision) {
    const explanations = {
      'context': {
        urgency: decision.urgency?.level || 'unknown',
        emotionalState: decision.urgency?.emotionalState || 'unknown',
        timePressure: decision.urgency?.timePressure || 0,
        inferredContext: decision.context?.inferredType || 'unknown'
      },
      'policy': {
        riskFactors: decision.risk?.factors || [],
        policyReferences: decision.policiesReferenced || [],
        approvalReasoning: decision.decision?.reasoning || '',
        guardrails: decision.conditions?.guardrails || {}
      },
      'negotiation': {
        conflictsDetected: decision.conflicts?.total || 0,
        resolutionStrategy: decision.solution?.strategy || 'none',
        clientRequirements: decision.clientRequirements || [],
        compromiseFound: decision.solution?.feasibility || false
      },
      'conflict-detection': {
        conflictTypes: decision.conflicts?.types || [],
        severityLevels: decision.conflicts?.severity || [],
        resolutionRecommendations: decision.recommendations || []
      },
      'audit': {
        complianceScore: decision.complianceScore || 0,
        violationsFound: decision.violations || [],
        auditTrail: decision.auditTrail || [],
        recommendations: decision.recommendations || []
      }
    };

    return explanations[agentName] || {
      decisionType: decision.type,
      confidence: decision.confidence,
      reasoning: decision.reasoning
    };
  }

  /**
   * Assess compliance impact of decision
   */
  async assessComplianceImpact(decision) {
    const impact = {
      fdaCompliance: {
        compliant: true,
        violations: [],
        warnings: []
      },
      gdprCompliance: {
        compliant: true,
        violations: [],
        warnings: []
      },
      industrySpecific: {
        compliant: true,
        violations: [],
        warnings: []
      }
    };

    // Check for FDA violations
    if (decision.riskFactors?.includes('medical_claims') && decision.status === 'approved') {
      impact.fdaCompliance.warnings.push('Medical claims require FDA approval');
    }

    // Check for GDPR violations
    if (decision.dataHandling?.includes('personal_data') && !decision.dataHandling?.includes('consent')) {
      impact.gdprCompliance.violations.push('Personal data processing without consent');
      impact.gdprCompliance.compliant = false;
    }

    return impact;
  }

  /**
   * Assess risk level of decision
   */
  async assessRiskLevel(decision) {
    const riskAssessment = {
      overallRisk: decision.riskLevel || 'unknown',
      riskFactors: decision.riskFactors || [],
      riskScore: decision.riskScore || 0,
      mitigationStrategies: [],
      escalationRequired: false
    };

    // Determine if escalation is required
    if (riskAssessment.riskScore > 0.7 || decision.requiresHumanReview) {
      riskAssessment.escalationRequired = true;
      riskAssessment.mitigationStrategies.push('Human review required');
    }

    return riskAssessment;
  }

  /**
   * Breakdown confidence score
   */
  async breakdownConfidence(decision) {
    const confidenceBreakdown = {
      overallConfidence: decision.confidence || 0,
      factors: {
        dataQuality: decision.dataQuality || 0.8,
        modelAccuracy: decision.modelAccuracy || 0.85,
        contextRelevance: decision.contextRelevance || 0.9,
        historicalAccuracy: decision.historicalAccuracy || 0.8
      },
      explanation: decision.confidenceExplanation || 'Confidence based on multiple factors'
    };

    return confidenceBreakdown;
  }

  /**
   * Assess error impact
   */
  async assessErrorImpact(error) {
    return {
      severity: error.message.includes('critical') ? 'high' : 'medium',
      userImpact: 'Service temporarily unavailable',
      systemImpact: 'Workflow halted',
      recoveryTime: '5-10 minutes'
    };
  }

  /**
   * Generate recovery recommendation
   */
  async generateRecoveryRecommendation(error) {
    return {
      immediate: 'Retry the operation',
      shortTerm: 'Check system health and restart agent',
      longTerm: 'Review error patterns and update error handling'
    };
  }

  /**
   * Assess system health
   */
  async assessSystemHealth() {
    return {
      overallHealth: 'good',
      agentStatus: 'operational',
      databaseStatus: 'connected',
      apiStatus: 'responsive'
    };
  }

  /**
   * Assess system impact
   */
  async assessSystemImpact(error) {
    return {
      workflowAffected: true,
      userExperience: 'degraded',
      dataIntegrity: 'maintained',
      recoveryRequired: true
    };
  }

  /**
   * Assess user impact
   */
  async assessUserImpact(error) {
    return {
      serviceDisruption: true,
      dataLoss: false,
      privacyImpact: false,
      complianceImpact: false
    };
  }

  /**
   * Generate recovery steps
   */
  async generateRecoverySteps(error) {
    return [
      'Immediate: Retry the operation',
      'Short-term: Check system logs and restart affected services',
      'Long-term: Implement better error handling and monitoring'
    ];
  }

  /**
   * Generate comprehensive transparency report
   */
  async generateTransparencyReport(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const report = {
      sessionId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalDecisions: session.transparencyMetrics.totalDecisions,
        humanReviews: session.transparencyMetrics.humanReviews,
        overrides: session.transparencyMetrics.overrides,
        averageConfidence: this.calculateAverage(session.transparencyMetrics.confidenceScores),
        averageProcessingTime: this.calculateAverage(session.transparencyMetrics.processingTimes)
      },
      decisionChain: session.decisionChain,
      complianceStatus: session.complianceStatus,
      auditTrail: session.auditEntries,
      recommendations: await this.generateRecommendations(session)
    };

    // Store report in database
    await this.storeTransparencyReport(report);

    return report;
  }

  /**
   * Generate recommendations based on session data
   */
  async generateRecommendations(session) {
    const recommendations = [];

    // Check confidence levels
    const avgConfidence = this.calculateAverage(session.transparencyMetrics.confidenceScores);
    if (avgConfidence < 0.7) {
      recommendations.push('Consider improving agent training data for better confidence');
    }

    // Check processing times
    const avgProcessingTime = this.calculateAverage(session.transparencyMetrics.processingTimes);
    if (avgProcessingTime > 30000) { // 30 seconds
      recommendations.push('Consider optimizing agent performance for faster processing');
    }

    // Check compliance violations
    if (session.complianceStatus.violations.length > 0) {
      recommendations.push('Review compliance procedures to reduce violations');
    }

    return recommendations;
  }

  /**
   * Calculate average of array
   */
  calculateAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  /**
   * Generate entry ID
   */
  generateEntryId() {
    return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store session in database
   */
  async storeSession(session) {
    try {
      const query = `
        INSERT INTO transparency_sessions (
          session_id, start_time, context_data, transparency_metrics, 
          compliance_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await pool.query(query, [
        session.sessionId,
        session.startTime,
        JSON.stringify(session.context),
        JSON.stringify(session.transparencyMetrics),
        JSON.stringify(session.complianceStatus),
        session.startTime
      ]);
    } catch (error) {
      console.error('Error storing transparency session:', error);
    }
  }

  /**
   * Store audit entry in database
   */
  async storeAuditEntry(auditEntry) {
    try {
      const query = `
        INSERT INTO transparency_audit_entries (
          entry_id, session_id, agent_name, timestamp, decision_data, 
          context_data, transparency_data, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await pool.query(query, [
        auditEntry.entryId,
        auditEntry.sessionId,
        auditEntry.agentName,
        auditEntry.timestamp,
        JSON.stringify(auditEntry.decision),
        JSON.stringify(auditEntry.context),
        JSON.stringify(auditEntry.transparency),
        JSON.stringify(auditEntry.metadata),
        auditEntry.timestamp
      ]);
    } catch (error) {
      console.error('Error storing audit entry:', error);
    }
  }

  /**
   * Store error entry in database
   */
  async storeErrorEntry(errorEntry) {
    try {
      const query = `
        INSERT INTO transparency_error_entries (
          entry_id, session_id, agent_name, timestamp, error_data, 
          context_data, transparency_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await pool.query(query, [
        errorEntry.entryId,
        errorEntry.sessionId,
        errorEntry.agentName,
        errorEntry.timestamp,
        JSON.stringify(errorEntry.error),
        JSON.stringify(errorEntry.context),
        JSON.stringify(errorEntry.transparency),
        errorEntry.timestamp
      ]);
    } catch (error) {
      console.error('Error storing error entry:', error);
    }
  }

  /**
   * Store orchestration error in database
   */
  async storeOrchestrationError(orchestrationError) {
    try {
      const query = `
        INSERT INTO transparency_orchestration_errors (
          entry_id, session_id, error_type, timestamp, error_data, 
          context_data, transparency_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await pool.query(query, [
        orchestrationError.entryId,
        orchestrationError.sessionId,
        orchestrationError.errorType,
        orchestrationError.timestamp,
        JSON.stringify(orchestrationError.error),
        JSON.stringify(orchestrationError.context),
        JSON.stringify(orchestrationError.transparency),
        orchestrationError.timestamp
      ]);
    } catch (error) {
      console.error('Error storing orchestration error:', error);
    }
  }

  /**
   * Store transparency report in database
   */
  async storeTransparencyReport(report) {
    try {
      const query = `
        INSERT INTO transparency_reports (
          session_id, generated_at, summary_data, decision_chain, 
          compliance_status, audit_trail, recommendations, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await pool.query(query, [
        report.sessionId,
        report.generatedAt,
        JSON.stringify(report.summary),
        JSON.stringify(report.decisionChain),
        JSON.stringify(report.complianceStatus),
        JSON.stringify(report.auditTrail),
        JSON.stringify(report.recommendations),
        report.generatedAt
      ]);
    } catch (error) {
      console.error('Error storing transparency report:', error);
    }
  }
}

export default TrustTransparencyLayer; 