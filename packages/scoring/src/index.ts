// Deterministic compliance scoring engine

import type { Policy, Submission } from '@aicomplyr/shared';

export interface ComplianceScore {
  overall: number;
  categories: {
    security: number;
    privacy: number;
    accessibility: number;
    performance: number;
  };
  recommendations: string[];
  violations: string[];
}

export interface ComplianceRequirements {
  security: {
    encryption: boolean;
    authentication: boolean;
    authorization: boolean;
  };
  privacy: {
    dataMinimization: boolean;
    consent: boolean;
    retention: boolean;
  };
  accessibility: {
    wcag: boolean;
    screenReader: boolean;
    keyboard: boolean;
  };
  performance: {
    loadTime: boolean;
    responsiveness: boolean;
    scalability: boolean;
  };
}

export class ComplianceEngine {
  calculateScore(policy: Policy, requirements: ComplianceRequirements): ComplianceScore {
    const categories = {
      security: this.calculateSecurityScore(policy, requirements.security),
      privacy: this.calculatePrivacyScore(policy, requirements.privacy),
      accessibility: this.calculateAccessibilityScore(policy, requirements.accessibility),
      performance: this.calculatePerformanceScore(policy, requirements.performance),
    };

    const overall = Object.values(categories).reduce((sum, score) => sum + score, 0) / 4;

    return {
      overall: Math.round(overall),
      categories,
      recommendations: this.generateRecommendations(categories),
      violations: this.identifyViolations(categories),
    };
  }

  private calculateSecurityScore(policy: Policy, requirements: any): number {
    let score = 0;
    const content = policy.content.toLowerCase();

    if (requirements.encryption && content.includes('encryption')) score += 25;
    if (requirements.authentication && content.includes('authentication')) score += 25;
    if (requirements.authorization && content.includes('authorization')) score += 25;
    if (content.includes('security') && content.includes('policy')) score += 25;

    return Math.min(score, 100);
  }

  private calculatePrivacyScore(policy: Policy, requirements: any): number {
    let score = 0;
    const content = policy.content.toLowerCase();

    if (requirements.dataMinimization && content.includes('data minimization')) score += 33;
    if (requirements.consent && content.includes('consent')) score += 33;
    if (requirements.retention && content.includes('retention')) score += 34;

    return Math.min(score, 100);
  }

  private calculateAccessibilityScore(policy: Policy, requirements: any): number {
    let score = 0;
    const content = policy.content.toLowerCase();

    if (requirements.wcag && content.includes('wcag')) score += 33;
    if (requirements.screenReader && content.includes('screen reader')) score += 33;
    if (requirements.keyboard && content.includes('keyboard')) score += 34;

    return Math.min(score, 100);
  }

  private calculatePerformanceScore(policy: Policy, requirements: any): number {
    let score = 0;
    const content = policy.content.toLowerCase();

    if (requirements.loadTime && content.includes('performance')) score += 33;
    if (requirements.responsiveness && content.includes('responsive')) score += 33;
    if (requirements.scalability && content.includes('scalable')) score += 34;

    return Math.min(score, 100);
  }

  private generateRecommendations(categories: any): string[] {
    const recommendations: string[] = [];

    if (categories.security < 80) {
      recommendations.push('Improve security policy coverage');
    }
    if (categories.privacy < 80) {
      recommendations.push('Enhance privacy compliance measures');
    }
    if (categories.accessibility < 80) {
      recommendations.push('Strengthen accessibility guidelines');
    }
    if (categories.performance < 80) {
      recommendations.push('Optimize performance requirements');
    }

    return recommendations;
  }

  private identifyViolations(categories: any): string[] {
    const violations: string[] = [];

    if (categories.security < 50) {
      violations.push('Critical security policy gaps');
    }
    if (categories.privacy < 50) {
      violations.push('Privacy compliance violations');
    }
    if (categories.accessibility < 50) {
      violations.push('Accessibility standard violations');
    }
    if (categories.performance < 50) {
      violations.push('Performance requirement violations');
    }

    return violations;
  }

  validateCompliance(submission: Submission): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!submission.policy_id) {
      issues.push('No policy associated with submission');
    }

    if (submission.status === 'pending' && !submission.submitted_by) {
      issues.push('Submission missing submitter information');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}