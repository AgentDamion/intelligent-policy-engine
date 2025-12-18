import { ASSESSMENT_CONFIG_V1, type AssessmentConfig } from '@/config/assessment-config';

export interface AssessmentAnswer {
  questionId: string;
  domainId: string;
  value: number; // 1-5 Likert scale
  evidenceUrl?: string;
  evidenceType?: 'policy' | 'workflow' | 'documentation' | 'screenshot' | 'other';
}

export interface DomainScore {
  domainId: string;
  domainName: string;
  rawScore: number;
  evidenceBoostedScore: number;
  weight: number;
  isMustPass: boolean;
  passesThreshold: boolean;
  evidenceCount: number;
  totalQuestions: number;
}

export interface AssessmentResult {
  assessmentId: string;
  version: string;
  composite: number;
  band: 'blocked' | 'cautious' | 'enabled' | 'native';
  domainBreakdown: DomainScore[];
  confidence: number;
  projectedTTA: number;
  recommendations: string[];
  mustPassGates: {
    passed: string[];
    failed: string[];
    cappedScore: boolean;
  };
  evidence: {
    totalProvided: number;
    domainsWithEvidence: number;
    evidenceRatio: number;
  };
  metadata: {
    completionRate: number;
    timestamp: string;
    organizationType?: 'enterprise' | 'agency';
    organizationSize?: string;
  };
}

export class AssessmentScoringEngine {
  private config: AssessmentConfig;

  constructor(config = ASSESSMENT_CONFIG_V1) {
    this.config = config;
  }

  calculateScore(
    answers: AssessmentAnswer[],
    organizationType?: 'enterprise' | 'agency',
    organizationSize?: string
  ): AssessmentResult {
    const assessmentId = this.generateAssessmentId();
    const domainScores = this.calculateDomainScores(answers);
    const mustPassResults = this.evaluateMustPassGates(domainScores);
    const composite = this.calculateCompositeScore(domainScores, mustPassResults.cappedScore);
    const band = this.determineBand(composite);
    const confidence = this.calculateConfidence(answers, domainScores);
    const projectedTTA = this.calculateProjectedTTA(domainScores, organizationType, organizationSize);
    const recommendations = this.generateRecommendations(domainScores, mustPassResults);
    const evidence = this.analyzeEvidence(answers, domainScores);
    const completionRate = this.calculateCompletionRate(answers);

    return {
      assessmentId,
      version: this.config.version,
      composite,
      band,
      domainBreakdown: domainScores,
      confidence,
      projectedTTA,
      recommendations,
      mustPassGates: mustPassResults,
      evidence,
      metadata: {
        completionRate,
        timestamp: new Date().toISOString(),
        organizationType,
        organizationSize
      }
    };
  }

  private calculateDomainScores(answers: AssessmentAnswer[]): DomainScore[] {
    return this.config.domains.map(domain => {
      const domainAnswers = answers.filter(a => a.domainId === domain.id);
      const totalQuestions = domain.questions.length;
      const answeredQuestions = domainAnswers.length;
      
      // Calculate raw average (0-5 scale, then convert to 0-100)
      const rawAverage = answeredQuestions > 0 
        ? domainAnswers.reduce((sum, a) => sum + a.value, 0) / answeredQuestions
        : 0;
      
      // Count evidence
      const evidenceCount = domainAnswers.filter(a => a.evidenceUrl?.trim()).length;
      const evidenceRatio = answeredQuestions > 0 ? evidenceCount / answeredQuestions : 0;
      
      // Apply evidence bonus if threshold met
      const evidenceBonus = evidenceRatio >= this.config.scoring.evidenceThreshold 
        ? this.config.scoring.evidenceBonus 
        : 0;
      
      const evidenceBoostedScore = Math.min(5, rawAverage + evidenceBonus);
      const passesThreshold = domain.isMustPass ? evidenceBoostedScore >= domain.mustPassThreshold : true;

      return {
        domainId: domain.id,
        domainName: domain.name,
        rawScore: rawAverage,
        evidenceBoostedScore,
        weight: domain.weight,
        isMustPass: domain.isMustPass,
        passesThreshold,
        evidenceCount,
        totalQuestions
      };
    });
  }

  private evaluateMustPassGates(domainScores: DomainScore[]) {
    const mustPassDomains = domainScores.filter(d => d.isMustPass);
    const passed = mustPassDomains.filter(d => d.passesThreshold).map(d => d.domainName);
    const failed = mustPassDomains.filter(d => !d.passesThreshold).map(d => d.domainName);
    const cappedScore = failed.length > 0;

    return { passed, failed, cappedScore };
  }

  private calculateCompositeScore(domainScores: DomainScore[], cappedScore: boolean): number {
    // Calculate weighted average (convert 0-5 to 0-100 scale)
    const weightedSum = domainScores.reduce((sum, domain) => {
      return sum + (domain.evidenceBoostedScore * domain.weight);
    }, 0);
    
    const totalWeight = domainScores.reduce((sum, domain) => sum + domain.weight, 0);
    const rawComposite = (weightedSum / totalWeight) * 20; // Convert 0-5 to 0-100

    // Apply must-pass cap if needed
    return cappedScore ? Math.min(rawComposite, this.config.scoring.mustPassCapScore) : rawComposite;
  }

  private determineBand(composite: number): 'blocked' | 'cautious' | 'enabled' | 'native' {
    for (const [band, config] of Object.entries(this.config.bands)) {
      if (composite >= config.min && composite <= config.max) {
        return band as 'blocked' | 'cautious' | 'enabled' | 'native';
      }
    }
    return 'blocked'; // Fallback
  }

  private calculateConfidence(answers: AssessmentAnswer[], domainScores: DomainScore[]): number {
    const totalQuestions = this.config.domains.reduce((sum, d) => sum + d.questions.length, 0);
    const completionFactor = answers.length / totalQuestions;
    
    const evidenceCount = answers.filter(a => a.evidenceUrl?.trim()).length;
    const evidenceFactor = evidenceCount / totalQuestions;
    
    // Confidence = 70% completion + 30% evidence
    return Math.min(1, (completionFactor * 0.7) + (evidenceFactor * 0.3));
  }

  private calculateProjectedTTA(
    domainScores: DomainScore[], 
    organizationType?: 'enterprise' | 'agency',
    organizationSize?: string
  ): number {
    // Base improvement factors by domain strength
    const dataGovernance = domainScores.find(d => d.domainId === 'data-governance')?.evidenceBoostedScore || 0;
    const humanInLoop = domainScores.find(d => d.domainId === 'human-in-loop')?.evidenceBoostedScore || 0;
    const auditTrail = domainScores.find(d => d.domainId === 'audit-trail')?.evidenceBoostedScore || 0;
    
    // Higher scores in critical domains = more TTA reduction
    const avgCriticalScore = (dataGovernance + humanInLoop + auditTrail) / 3;
    
    // Base TTA improvement (15-60% range based on critical domain scores)
    let ttaReduction = 15 + (avgCriticalScore / 5) * 45;
    
    // Adjust for organization type and size
    if (organizationType === 'enterprise') {
      ttaReduction *= 1.1; // Enterprises typically see higher gains
    }
    
    if (organizationSize === 'large') {
      ttaReduction *= 1.15; // Larger orgs have more complex approval chains
    }
    
    return Math.round(Math.min(ttaReduction, 75)); // Cap at 75%
  }

  private generateRecommendations(domainScores: DomainScore[], mustPassResults: any): string[] {
    const recommendations: string[] = [];
    
    // Must-fix recommendations (failed gates)
    if (mustPassResults.failed.length > 0) {
      recommendations.push(`🔴 MUST-FIX: Address gaps in ${mustPassResults.failed.join(', ')} to unlock higher bands`);
    }
    
    // High-impact improvements
    const lowScoreDomains = domainScores
      .filter(d => d.evidenceBoostedScore < 3)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2);
      
    lowScoreDomains.forEach(domain => {
      recommendations.push(`🟠 HIGH-IMPACT: Strengthen ${domain.domainName} processes`);
    });
    
    // Evidence improvements
    const lowEvidenceDomains = domainScores.filter(d => d.evidenceCount / d.totalQuestions < 0.5);
    if (lowEvidenceDomains.length > 0) {
      recommendations.push(`🟡 EVIDENCE: Add documentation for ${lowEvidenceDomains[0].domainName}`);
    }
    
    // Optimization opportunities
    const mediumScoreDomains = domainScores.filter(d => d.evidenceBoostedScore >= 3 && d.evidenceBoostedScore < 4);
    if (mediumScoreDomains.length > 0) {
      recommendations.push(`🟢 OPTIMIZE: Enhance ${mediumScoreDomains[0].domainName} for competitive advantage`);
    }
    
    return recommendations.slice(0, 5); // Limit to top 5
  }

  private analyzeEvidence(answers: AssessmentAnswer[], domainScores: DomainScore[]) {
    const totalProvided = answers.filter(a => a.evidenceUrl?.trim()).length;
    const domainsWithEvidence = new Set(
      answers.filter(a => a.evidenceUrl?.trim()).map(a => a.domainId)
    ).size;
    const evidenceRatio = totalProvided / answers.length;

    return {
      totalProvided,
      domainsWithEvidence,
      evidenceRatio
    };
  }

  private calculateCompletionRate(answers: AssessmentAnswer[]): number {
    const totalQuestions = this.config.domains.reduce((sum, d) => sum + d.questions.length, 0);
    return answers.length / totalQuestions;
  }

  private generateAssessmentId(): string {
    return `asmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const assessmentScoring = new AssessmentScoringEngine();