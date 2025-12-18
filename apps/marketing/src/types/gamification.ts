/**
 * Shared gamification types to avoid circular dependencies
 */

export interface ComplianceStreak {
  current: number;
  best: number;
  lastDate: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface GamificationMetrics {
  complianceStreak: ComplianceStreak;
  achievements: Achievement[];
  totalPoints: number;
  level: number;
}

export interface RiskMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceMetric {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'compliant' | 'non-compliant' | 'pending';
}
