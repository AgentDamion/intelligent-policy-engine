// TypeScript interfaces for LiveProofWidget
export interface LiveMetrics {
  decisions_today?: number;
  compliance_rate?: number;
  total_decisions?: number;
  avg_decision_time?: number;
  last_updated?: string;
}

export interface Decision {
  id: string;
  type: 'approve' | 'flag' | 'modify' | 'escalate' | 'unknown';
  context: string;
  tool: string;
  citation: string;
  timestamp: string;
  human_involved?: boolean;
}

export interface LiveProofWidgetProps {
  className?: string;
  refreshInterval?: number;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  color?: 'primary' | 'success' | 'secondary' | 'accent';
  animate?: boolean;
}

export interface RecentDecisionsFeedProps {
  decisions: Decision[];
}

export interface DecisionTypeBadgeProps {
  type: Decision['type'];
}