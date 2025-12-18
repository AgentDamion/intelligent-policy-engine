export interface GovernanceHealthData {
  compliance: number;
  toolApproval: number;
  auditCompleteness: number;
}

export interface GovernanceEntity {
  id: string;
  name: string;
  type: 'client' | 'partner' | 'tool' | 'policy';
  ghi: number;
  compliance: number;
  toolApproval: number;
  auditCompleteness: number;
  openRisks: number;
  lastUpdate: string;
  owner?: string;
  region?: string;
}

export interface GovernanceAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  entity: string;
  entityType: 'client' | 'partner' | 'tool' | 'policy';
  daysOpen: number;
  assignee?: string;
  category: string;
}

export const calculateGovernanceHealth = (data: GovernanceHealthData): number => {
  return Math.round(
    (data.compliance * 0.4) +
    (data.toolApproval * 0.3) +
    (data.auditCompleteness * 0.3)
  );
};

export const getGovernanceHealthBand = (score: number): 'green' | 'yellow' | 'red' => {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  return 'red';
};

export const getGovernanceHealthColor = (score: number): string => {
  const band = getGovernanceHealthBand(score);
  switch (band) {
    case 'green': return 'text-green-600';
    case 'yellow': return 'text-yellow-600';
    case 'red': return 'text-red-600';
  }
};

export const getGovernanceHealthBackground = (score: number): string => {
  const band = getGovernanceHealthBand(score);
  switch (band) {
    case 'green': return 'bg-green-50 border-green-200';
    case 'yellow': return 'bg-yellow-50 border-yellow-200';
    case 'red': return 'bg-red-50 border-red-200';
  }
};

export const generateSparklineData = (baseValue: number, days: number = 30): number[] => {
  const data = [];
  let current = baseValue;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 4; // ±2% change
    current = Math.max(0, Math.min(100, current + change));
    data.push(Math.round(current));
  }
  
  return data;
};

export const getSeverityEmoji = (severity: 'critical' | 'warning' | 'info'): string => {
  switch (severity) {
    case 'critical': return '🔴';
    case 'warning': return '🟠';
    case 'info': return '🟢';
  }
};

export const getPriorityLevel = (score: number): 'high' | 'medium' | 'low' => {
  if (score < 70) return 'high';
  if (score < 85) return 'medium';
  return 'low';
};