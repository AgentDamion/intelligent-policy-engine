export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  name: string;
  score: number; // 0-1 scale
  weight: number; // How much this contributes to overall score
  description: string;
  recommendation?: string;
}

export interface RiskMetrics {
  overall: number; // 0-1 scale
  level: RiskLevel;
  factors: RiskFactor[];
  timestamp: string;
}

export interface RiskDelta {
  before: RiskMetrics;
  after: RiskMetrics;
  improvements: Array<{
    factor: string;
    reduction: number; // Percentage
  }>;
}
