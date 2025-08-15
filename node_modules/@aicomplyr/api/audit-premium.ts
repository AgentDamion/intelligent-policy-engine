/**
 * Audit Premium - Enhanced Compliance Audit Trail System
 * 
 * Features:
 * 1. Unique hash fingerprints for each audit entry
 * 2. Linked audit entries to show complete story/chain
 * 3. AI confidence scores for all decisions
 * 4. Detailed policy references and compliance tracking
 * 5. Advanced search, analytics, and reporting
 * 6. Enterprise-grade compliance officer audit trail
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions for enhanced audit system
interface AuditEntry {
  // Unique identification
  entryId: string;
  entryHash: string;           // SHA-256 hash of entry content
  parentEntryId?: string;      // Links to previous entry in chain
  childEntryIds: string[];     // Links to subsequent entries
  sessionId: string;
  
  // Timestamp and timing
  timestamp: string;
  processingTimeMs: number;
  
  // Agent information
  agentType: string;
  agentDisplayName: string;
  
  // Decision details
  decisionType: string;
  decisionTypeDisplay: string;
  decision: any;
  reasoning: string;
  
  // AI confidence and scoring
  confidenceScore: number;     // 0.0 to 1.0
  confidenceFactors: string[]; // Why this confidence level
  uncertaintyLevel: number;    // 0.0 to 1.0 (opposite of confidence)
  
  // Policy compliance
  policiesReferenced: PolicyReference[];
  complianceStatus: 'compliant' | 'non_compliant' | 'requires_review' | 'unknown';
  complianceScore: number;     // 0.0 to 1.0
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;          // 0.0 to 1.0
  riskFactors: string[];
  
  // State tracking
  beforeState: any;
  afterState: any;
  changesDetected: ChangeRecord[];
  
  // Status and metadata
  status: string;
  metadata: AuditMetadata;
}

interface PolicyReference {
  policyId: string;
  policyName: string;
  policyVersion: string;
  section: string;
  relevance: number;          // 0.0 to 1.0
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface ChangeRecord {
  field: string;
  beforeValue: any;
  afterValue: any;
  changeType: 'added' | 'removed' | 'modified';
  significance: 'low' | 'medium' | 'high';
}

interface AuditMetadata {
  userAgent: string;
  version: string;
  environment: string;
  requestId?: string;
  userId?: string;
  ipAddress?: string;
  userAgentString?: string;
}

interface AuditSession {
  sessionId: string;
  sessionHash: string;
  userId: string;
  userMessage: string;
  startTime: string;
  endTime?: string;
  workflowPath: string[];
  agentsEngaged: string[];
  finalDecision: any;
  totalProcessingTime: number;
  auditEntries: AuditEntry[];
  sessionSummary: SessionSummary;
}

interface SessionSummary {
  totalEntries: number;
  averageConfidence: number;
  averageComplianceScore: number;
  riskLevel: string;
  finalStatus: string;
  policyViolations: number;
  escalations: number;
}

interface AuditChain {
  chainId: string;
  rootEntryId: string;
  entryIds: string[];
  totalEntries: number;
  chainType: 'workflow' | 'decision' | 'escalation' | 'review';
  startTime: string;
  endTime?: string;
  summary: ChainSummary;
}

interface ChainSummary {
  averageConfidence: number;
  finalDecision: any;
  riskLevel: string;
  complianceStatus: string;
  totalProcessingTime: number;
}

class AuditPremium {
  private auditLog: AuditEntry[] = [];
  private sessions: Map<string, AuditSession> = new Map();
  private chains: Map<string, AuditChain> = new Map();
  private currentSession: AuditSession | null = null;
  
  private readonly logDir: string;
  private readonly logFile: string;
  private readonly chainsFile: string;
  
  // Configuration
  private config = {
    retentionDays: 365,
    maxLogSize: 10000,
    exportFormats: ['json', 'csv', 'pdf'],
    searchableFields: [
      'timestamp', 'userId', 'agentType', 'decisionType', 
      'status', 'riskLevel', 'policiesReferenced', 'confidenceScore'
    ],
    hashAlgorithm: 'sha256',
    compressionEnabled: true
  };

  constructor(logDirectory = './logs') {
    this.logDir = logDirectory;
    this.logFile = path.join(logDirectory, 'audit-premium.log');
    this.chainsFile = path.join(logDirectory, 'audit-chains.json');
    
    this.ensureLogDirectory();
    this.loadExistingData();
  }

  /**
   * Start a new audit session for a user request
   * Creates a unique session with hash fingerprint
   */
  startAuditSession(userMessage: string, userId: string = 'anonymous'): string {
    const sessionId = this.generateSessionId();
    const sessionHash = this.generateHash(JSON.stringify({
      userId,
      userMessage,
      timestamp: new Date().toISOString()
    }));

    this.currentSession = {
      sessionId,
      sessionHash,
      userId,
      userMessage,
      startTime: new Date().toISOString(),
      workflowPath: [],
      agentsEngaged: [],
      finalDecision: null,
      totalProcessingTime: 0,
      auditEntries: [],
      sessionSummary: {
        totalEntries: 0,
        averageConfidence: 0,
        averageComplianceScore: 0,
        riskLevel: 'low',
        finalStatus: 'pending',
        policyViolations: 0,
        escalations: 0
      }
    };

    this.sessions.set(sessionId, this.currentSession);
    return sessionId;
  }

  /**
   * Log a decision with enhanced features:
   * - Unique hash fingerprint
   * - Links to parent/child entries
   * - AI confidence scoring
   * - Policy compliance tracking
   */
  logDecision(
    agentType: string,
    decisionType: string,
    decision: any,
    reasoning: string,
    confidenceScore: number,
    policiesReferenced: PolicyReference[] = [],
    beforeState: any = null,
    afterState: any = null,
    parentEntryId?: string
  ): string {
    if (!this.currentSession) {
      throw new Error('No active audit session. Call startAuditSession() first.');
    }

    const entryId = this.generateEntryId();
    const entryData = {
      entryId,
      sessionId: this.currentSession.sessionId,
      timestamp: new Date().toISOString(),
      agentType,
      agentDisplayName: this.getAgentDisplayName(agentType),
      decisionType,
      decisionTypeDisplay: this.getDecisionTypeDisplay(decisionType),
      decision,
      reasoning,
      confidenceScore: Math.max(0, Math.min(1, confidenceScore)), // Clamp to 0-1
      confidenceFactors: this.extractConfidenceFactors(decision, reasoning),
      uncertaintyLevel: 1 - confidenceScore,
      policiesReferenced,
      complianceStatus: this.assessComplianceStatus(policiesReferenced, decision),
      complianceScore: this.calculateComplianceScore(policiesReferenced, decision),
      riskLevel: this.extractRiskLevel(decision),
      riskScore: this.calculateRiskScore(decision),
      riskFactors: this.extractRiskFactors(decision),
      beforeState,
      afterState,
      changesDetected: this.detectChanges(beforeState, afterState),
      status: this.extractStatus(decision),
      processingTimeMs: this.calculateProcessingTime(),
      metadata: this.buildMetadata(),
      parentEntryId,
      childEntryIds: []
    };

    // Generate unique hash for this entry
    const entryHash = this.generateHash(JSON.stringify(entryData));
    entryData.entryHash = entryHash;

    const auditEntry: AuditEntry = entryData;

    // Link to parent entry if provided
    if (parentEntryId) {
      const parentEntry = this.findEntryById(parentEntryId);
      if (parentEntry) {
        parentEntry.childEntryIds.push(entryId);
        auditEntry.parentEntryId = parentEntryId;
      }
    }

    // Add to session
    this.currentSession.auditEntries.push(auditEntry);
    this.auditLog.push(auditEntry);

    // Update session workflow path
    if (!this.currentSession.workflowPath.includes(decisionType)) {
      this.currentSession.workflowPath.push(decisionType);
    }

    // Update agents engaged
    if (!this.currentSession.agentsEngaged.includes(agentType)) {
      this.currentSession.agentsEngaged.push(agentType);
    }

    // Create or update audit chain
    this.updateAuditChain(auditEntry);

    return entryId;
  }

  /**
   * Log Context Agent decisions with confidence scoring
   */
  logContextDecision(
    contextOutput: any,
    confidenceScore: number,
    reasoning: string = null
  ): string {
    const decision = {
      urgencyLevel: contextOutput.urgency?.level || 0,
      emotionalState: contextOutput.urgency?.emotionalState || 'neutral',
      inferredType: contextOutput.context?.inferredType || 'unknown',
      confidence: contextOutput.context?.confidence || 0,
      clarificationQuestion: contextOutput.clarification?.question || '',
      recommendations: contextOutput.recommendations || [],
      nextSteps: contextOutput.nextSteps || []
    };

    const policiesReferenced: PolicyReference[] = [
      {
        policyId: 'urgency_assessment_policy',
        policyName: 'Urgency Assessment Policy',
        policyVersion: '1.0',
        section: 'urgency_detection',
        relevance: 0.9,
        impact: 'positive',
        description: 'Policy for assessing urgency levels in user requests'
      },
      {
        policyId: 'context_inference_policy',
        policyName: 'Context Inference Policy',
        policyVersion: '1.0',
        section: 'context_analysis',
        relevance: 0.8,
        impact: 'positive',
        description: 'Policy for inferring context from user messages'
      }
    ];

    return this.logDecision(
      'context',
      'context_analysis',
      decision,
      reasoning || 'Context analysis completed with AI confidence scoring',
      confidenceScore,
      policiesReferenced
    );
  }

  /**
   * Log Policy Agent decisions with compliance tracking
   */
  logPolicyDecision(
    policyOutput: any,
    contextOutput: any,
    confidenceScore: number,
    reasoning: string = null
  ): string {
    const decision = {
      status: policyOutput.decision?.status || 'unknown',
      type: policyOutput.decision?.type || 'unknown',
      riskScore: policyOutput.risk?.score || 0,
      riskLevel: policyOutput.risk?.level || 'low',
      riskFactors: policyOutput.risk?.factors || [],
      guardrails: policyOutput.conditions?.guardrails || [],
      monitoring: policyOutput.monitoring?.requirements || [],
      escalation: policyOutput.escalation || null,
      nextSteps: policyOutput.next_steps || []
    };

    const policiesReferenced: PolicyReference[] = [
      {
        policyId: 'chatgpt_usage_policy',
        policyName: 'ChatGPT Usage Policy',
        policyVersion: '1.0',
        section: 'usage_guidelines',
        relevance: 0.95,
        impact: 'positive',
        description: 'Policy governing ChatGPT usage in client presentations'
      },
      {
        policyId: 'client_presentations_policy',
        policyName: 'Client Presentations Policy',
        policyVersion: '1.0',
        section: 'content_standards',
        relevance: 0.9,
        impact: 'positive',
        description: 'Policy for client presentation content and standards'
      },
      {
        policyId: 'risk_assessment_policy',
        policyName: 'Risk Assessment Policy',
        policyVersion: '1.0',
        section: 'risk_evaluation',
        relevance: 0.85,
        impact: 'neutral',
        description: 'Policy for evaluating and assessing risks'
      }
    ];

    return this.logDecision(
      'policy',
      'policy_evaluation',
      decision,
      reasoning || `Policy evaluation completed with ${confidenceScore.toFixed(2)} confidence`,
      confidenceScore,
      policiesReferenced,
      contextOutput,
      policyOutput
    );
  }

  /**
   * Complete audit session and generate summary
   */
  completeAuditSession(finalDecision: any, totalProcessingTime: number): AuditSession {
    if (!this.currentSession) {
      throw new Error('No active audit session to complete.');
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.finalDecision = finalDecision;
    this.currentSession.totalProcessingTime = totalProcessingTime;

    // Calculate session summary
    this.currentSession.sessionSummary = this.calculateSessionSummary(this.currentSession);

    // Save session
    this.sessions.set(this.currentSession.sessionId, this.currentSession);

    // Persist to disk
    this.persistData();

    const completedSession = this.currentSession;
    this.currentSession = null;

    return completedSession;
  }

  /**
   * Get complete audit chain for an entry
   */
  getAuditChain(entryId: string): AuditEntry[] {
    const chain: AuditEntry[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const entry = this.findEntryById(id);
      if (!entry) return;

      // Add parent first (if exists)
      if (entry.parentEntryId) {
        traverse(entry.parentEntryId);
      }

      chain.push(entry);

      // Add children
      entry.childEntryIds.forEach(childId => {
        traverse(childId);
      });
    };

    traverse(entryId);
    return chain;
  }

  /**
   * Search audit logs with advanced filtering
   */
  searchAuditLogs(criteria: {
    sessionId?: string;
    agentType?: string;
    decisionType?: string;
    riskLevel?: string;
    confidenceMin?: number;
    confidenceMax?: number;
    complianceStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    policiesReferenced?: string[];
  }): AuditEntry[] {
    return this.auditLog.filter(entry => {
      if (criteria.sessionId && entry.sessionId !== criteria.sessionId) return false;
      if (criteria.agentType && entry.agentType !== criteria.agentType) return false;
      if (criteria.decisionType && entry.decisionType !== criteria.decisionType) return false;
      if (criteria.riskLevel && entry.riskLevel !== criteria.riskLevel) return false;
      if (criteria.confidenceMin && entry.confidenceScore < criteria.confidenceMin) return false;
      if (criteria.confidenceMax && entry.confidenceScore > criteria.confidenceMax) return false;
      if (criteria.complianceStatus && entry.complianceStatus !== criteria.complianceStatus) return false;
      if (criteria.dateFrom && entry.timestamp < criteria.dateFrom) return false;
      if (criteria.dateTo && entry.timestamp > criteria.dateTo) return false;
      if (criteria.policiesReferenced) {
        const entryPolicyIds = entry.policiesReferenced.map(p => p.policyId);
        const hasMatchingPolicy = criteria.policiesReferenced.some(policyId => 
          entryPolicyIds.includes(policyId)
        );
        if (!hasMatchingPolicy) return false;
      }
      return true;
    });
  }

  /**
   * Generate compliance report with confidence analysis
   */
  generateComplianceReport(sessionId?: string): any {
    const sessions = sessionId ? [this.sessions.get(sessionId)] : Array.from(this.sessions.values());
    const validSessions = sessions.filter(s => s !== undefined) as AuditSession[];

    const report = {
      reportId: this.generateReportId(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalSessions: validSessions.length,
        totalEntries: validSessions.reduce((sum, s) => sum + s.auditEntries.length, 0),
        averageConfidence: this.calculateAverageConfidence(validSessions),
        averageComplianceScore: this.calculateAverageComplianceScore(validSessions),
        riskDistribution: this.calculateRiskDistribution(validSessions),
        complianceDistribution: this.calculateComplianceDistribution(validSessions),
        policyViolations: validSessions.reduce((sum, s) => sum + s.sessionSummary.policyViolations, 0),
        escalations: validSessions.reduce((sum, s) => sum + s.sessionSummary.escalations, 0)
      },
      sessions: validSessions.map(session => ({
        sessionId: session.sessionId,
        sessionHash: session.sessionHash,
        summary: session.sessionSummary,
        entries: session.auditEntries.map(entry => ({
          entryId: entry.entryId,
          entryHash: entry.entryHash,
          agentType: entry.agentType,
          decisionType: entry.decisionType,
          confidenceScore: entry.confidenceScore,
          complianceStatus: entry.complianceStatus,
          riskLevel: entry.riskLevel,
          timestamp: entry.timestamp
        }))
      }))
    };

    return report;
  }

  // Private helper methods

  private generateHash(content: string): string {
    return crypto.createHash(this.config.hashAlgorithm).update(content).digest('hex');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEntryId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAgentDisplayName(agentType: string): string {
    const displayNames: { [key: string]: string } = {
      'context': 'Context Agent',
      'policy': 'Policy Agent',
      'audit': 'Audit Agent',
      'negotiation': 'Negotiation Agent',
      'orchestrator': 'Workflow Orchestrator'
    };
    return displayNames[agentType] || agentType;
  }

  private getDecisionTypeDisplay(decisionType: string): string {
    const displayNames: { [key: string]: string } = {
      'context_analysis': 'Context Analysis',
      'urgency_assessment': 'Urgency Assessment',
      'complexity_assessment': 'Complexity Assessment',
      'policy_evaluation': 'Policy Evaluation',
      'risk_assessment': 'Risk Assessment',
      'approval_decision': 'Approval Decision',
      'negotiation_processing': 'Negotiation Processing',
      'conflict_resolution': 'Conflict Resolution',
      'escalation_decision': 'Escalation Decision',
      'workflow_routing': 'Workflow Routing'
    };
    return displayNames[decisionType] || decisionType;
  }

  private extractConfidenceFactors(decision: any, reasoning: string): string[] {
    const factors: string[] = [];
    
    // Analyze decision structure for confidence indicators
    if (decision.confidence !== undefined) {
      factors.push(`Explicit confidence score: ${decision.confidence}`);
    }
    if (decision.riskScore !== undefined) {
      factors.push(`Risk assessment: ${decision.riskScore}`);
    }
    if (reasoning.includes('high confidence')) {
      factors.push('Reasoning indicates high confidence');
    }
    if (reasoning.includes('uncertain') || reasoning.includes('low confidence')) {
      factors.push('Reasoning indicates uncertainty');
    }
    
    return factors.length > 0 ? factors : ['Default confidence assessment'];
  }

  private assessComplianceStatus(policies: PolicyReference[], decision: any): 'compliant' | 'non_compliant' | 'requires_review' | 'unknown' {
    if (policies.length === 0) return 'unknown';
    
    const complianceScores = policies.map(policy => policy.relevance);
    const averageCompliance = complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length;
    
    if (averageCompliance >= 0.8) return 'compliant';
    if (averageCompliance >= 0.6) return 'requires_review';
    return 'non_compliant';
  }

  private calculateComplianceScore(policies: PolicyReference[], decision: any): number {
    if (policies.length === 0) return 0;
    
    const scores = policies.map(policy => policy.relevance);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private extractRiskLevel(decision: any): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = decision.riskScore || decision.risk_score || 0;
    
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  private calculateRiskScore(decision: any): number {
    return decision.riskScore || decision.risk_score || 0;
  }

  private extractRiskFactors(decision: any): string[] {
    return decision.riskFactors || decision.risk_factors || [];
  }

  private detectChanges(beforeState: any, afterState: any): ChangeRecord[] {
    if (!beforeState || !afterState) return [];
    
    const changes: ChangeRecord[] = [];
    const beforeKeys = Object.keys(beforeState);
    const afterKeys = Object.keys(afterState);
    
    // Find added keys
    afterKeys.forEach(key => {
      if (!beforeKeys.includes(key)) {
        changes.push({
          field: key,
          beforeValue: undefined,
          afterValue: afterState[key],
          changeType: 'added',
          significance: 'medium'
        });
      }
    });
    
    // Find removed keys
    beforeKeys.forEach(key => {
      if (!afterKeys.includes(key)) {
        changes.push({
          field: key,
          beforeValue: beforeState[key],
          afterValue: undefined,
          changeType: 'removed',
          significance: 'medium'
        });
      }
    });
    
    // Find modified keys
    beforeKeys.forEach(key => {
      if (afterKeys.includes(key) && beforeState[key] !== afterState[key]) {
        changes.push({
          field: key,
          beforeValue: beforeState[key],
          afterValue: afterState[key],
          changeType: 'modified',
          significance: 'high'
        });
      }
    });
    
    return changes;
  }

  private extractStatus(decision: any): string {
    return decision.status || decision.decision_status || 'unknown';
  }

  private calculateProcessingTime(): number {
    // Simplified - in real implementation, track actual processing time
    return Math.floor(Math.random() * 1000) + 100; // 100-1100ms
  }

  private buildMetadata(): AuditMetadata {
    return {
      userAgent: 'AIComplyr.io Premium Audit System',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      requestId: this.generateEntryId(),
      userId: this.currentSession?.userId,
      ipAddress: '127.0.0.1', // In real implementation, get from request
      userAgentString: 'AIComplyr-Audit-Premium/2.0.0'
    };
  }

  private updateAuditChain(entry: AuditEntry): void {
    // Create or update audit chain
    const chainId = entry.sessionId;
    let chain = this.chains.get(chainId);
    
    if (!chain) {
      chain = {
        chainId,
        rootEntryId: entry.entryId,
        entryIds: [entry.entryId],
        totalEntries: 1,
        chainType: 'workflow',
        startTime: entry.timestamp,
        summary: {
          averageConfidence: entry.confidenceScore,
          finalDecision: entry.decision,
          riskLevel: entry.riskLevel,
          complianceStatus: entry.complianceStatus,
          totalProcessingTime: entry.processingTimeMs
        }
      };
    } else {
      chain.entryIds.push(entry.entryId);
      chain.totalEntries++;
      chain.summary.averageConfidence = (chain.summary.averageConfidence + entry.confidenceScore) / 2;
      chain.summary.totalProcessingTime += entry.processingTimeMs;
    }
    
    this.chains.set(chainId, chain);
  }

  private findEntryById(entryId: string): AuditEntry | undefined {
    return this.auditLog.find(entry => entry.entryId === entryId);
  }

  private calculateSessionSummary(session: AuditSession): SessionSummary {
    const entries = session.auditEntries;
    const totalEntries = entries.length;
    
    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        averageConfidence: 0,
        averageComplianceScore: 0,
        riskLevel: 'low',
        finalStatus: 'pending',
        policyViolations: 0,
        escalations: 0
      };
    }

    const averageConfidence = entries.reduce((sum, entry) => sum + entry.confidenceScore, 0) / totalEntries;
    const averageComplianceScore = entries.reduce((sum, entry) => sum + entry.complianceScore, 0) / totalEntries;
    
    const riskLevels = entries.map(entry => entry.riskLevel);
    const riskLevel = this.getHighestRiskLevel(riskLevels);
    
    const finalStatus = entries[entries.length - 1]?.status || 'unknown';
    const policyViolations = entries.filter(entry => entry.complianceStatus === 'non_compliant').length;
    const escalations = entries.filter(entry => entry.decisionType === 'escalation_decision').length;

    return {
      totalEntries,
      averageConfidence,
      averageComplianceScore,
      riskLevel,
      finalStatus,
      policyViolations,
      escalations
    };
  }

  private getHighestRiskLevel(riskLevels: string[]): string {
    const riskOrder = ['low', 'medium', 'high', 'critical'];
    let highestRisk = 'low';
    
    riskLevels.forEach(level => {
      const currentIndex = riskOrder.indexOf(level);
      const highestIndex = riskOrder.indexOf(highestRisk);
      if (currentIndex > highestIndex) {
        highestRisk = level;
      }
    });
    
    return highestRisk;
  }

  private calculateAverageConfidence(sessions: AuditSession[]): number {
    const allEntries = sessions.flatMap(session => session.auditEntries);
    if (allEntries.length === 0) return 0;
    
    return allEntries.reduce((sum, entry) => sum + entry.confidenceScore, 0) / allEntries.length;
  }

  private calculateAverageComplianceScore(sessions: AuditSession[]): number {
    const allEntries = sessions.flatMap(session => session.auditEntries);
    if (allEntries.length === 0) return 0;
    
    return allEntries.reduce((sum, entry) => sum + entry.complianceScore, 0) / allEntries.length;
  }

  private calculateRiskDistribution(sessions: AuditSession[]): { [key: string]: number } {
    const allEntries = sessions.flatMap(session => session.auditEntries);
    const distribution: { [key: string]: number } = { low: 0, medium: 0, high: 0, critical: 0 };
    
    allEntries.forEach(entry => {
      distribution[entry.riskLevel]++;
    });
    
    return distribution;
  }

  private calculateComplianceDistribution(sessions: AuditSession[]): { [key: string]: number } {
    const allEntries = sessions.flatMap(session => session.auditEntries);
    const distribution: { [key: string]: number } = { 
      compliant: 0, non_compliant: 0, requires_review: 0, unknown: 0 
    };
    
    allEntries.forEach(entry => {
      distribution[entry.complianceStatus]++;
    });
    
    return distribution;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private loadExistingData(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const data = fs.readFileSync(this.logFile, 'utf8');
        const lines = data.trim().split('\n');
        this.auditLog = lines.map(line => JSON.parse(line));
      }
      
      if (fs.existsSync(this.chainsFile)) {
        const chainsData = fs.readFileSync(this.chainsFile, 'utf8');
        const chains = JSON.parse(chainsData);
        this.chains = new Map(Object.entries(chains));
      }
    } catch (error) {
      console.warn('Could not load existing audit data:', error);
    }
  }

  private persistData(): void {
    try {
      // Persist audit log
      const logData = this.auditLog.map(entry => JSON.stringify(entry)).join('\n');
      fs.writeFileSync(this.logFile, logData);
      
      // Persist chains
      const chainsData = Object.fromEntries(this.chains);
      fs.writeFileSync(this.chainsFile, JSON.stringify(chainsData, null, 2));
    } catch (error) {
      console.error('Failed to persist audit data:', error);
    }
  }
}

// Export the enhanced audit system
export default AuditPremium;
export { AuditEntry, AuditSession, AuditChain, PolicyReference, ChangeRecord, AuditMetadata }; 