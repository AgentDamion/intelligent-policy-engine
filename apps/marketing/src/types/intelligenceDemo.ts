export type DemoAgent = 'regulatory' | 'ethics' | 'data' | 'integration';

export type DemoStageType = 'intro' | 'conversation' | 'decision' | 'proof' | 'outcome';

export interface DemoMessage {
  id: string;
  agent: DemoAgent;
  content: string;
  timestamp: number; // milliseconds from stage start
  reasoning?: string;
  policyReference?: string;
}

export interface DemoDecision {
  policyId: string;
  policyName: string;
  requirements: Array<{ text: string; satisfied: boolean }>;
  conflicts: Array<{ text: string; resolved: boolean; resolution?: string }>;
  recommendation: string;
  recommendationType: 'approve' | 'approve_with_conditions' | 'reject' | 'escalate';
}

export interface DemoProof {
  auditTrail: Array<{ timestamp: string; event: string; agent: DemoAgent }>;
  hash: string;
  timestamp: string;
  compliance: string[];
}

export interface DemoMetrics {
  timeSaved: string;
  complianceScore: number;
  riskReduction: number;
  costImpact: string;
}

export interface DemoIntroContent {
  title: string;
  challenge: string;
  stakeholders: string[];
  successCriteria: string[];
}

export interface DemoStageContent {
  // For intro stage
  intro?: DemoIntroContent;
  
  // For conversation stage
  messages?: DemoMessage[];
  
  // For decision stage
  decision?: DemoDecision;
  
  // For proof stage
  proof?: DemoProof;
  
  // For outcome stage
  metrics?: DemoMetrics;
}

export interface DemoStage {
  id: string;
  type: DemoStageType;
  duration: number; // milliseconds
  content: DemoStageContent;
  narrative?: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  duration: number; // total milliseconds
  stages: DemoStage[];
  metrics: DemoMetrics;
}

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;
