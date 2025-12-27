export interface DecisionItem {
  id: string;
  campaignName: string;
  partner: string;
  brand: string;
  tools: string[];
  dataScope: string[];
  veraReasoning: string;
  recommendation: 'ESCALATE' | 'BLOCK' | 'ALLOW';
  confidence: number;
  timestamp: Date;
  shadowMode: boolean;
}

export const mockDecisions: DecisionItem[] = [
  {
    id: 'dec-001',
    campaignName: 'ONCAVEX Launch Campaign',
    partner: 'IPG Health (Partner)',
    brand: 'ONCAVEX',
    tools: ['Midjourney v6.1', 'Claude 3.5'],
    dataScope: ['Customer PII', 'Marketing Materials'],
    veraReasoning: 'Potential PHI exposure – recommend legal review of vendor data practices',
    recommendation: 'ESCALATE',
    confidence: 67,
    timestamp: new Date('2025-11-28T09:23:00'),
    shadowMode: true
  },
  {
    id: 'dec-002',
    campaignName: 'GLUCOSTABLE Social Media',
    partner: 'IPG Health (Partner)',
    brand: 'GLUCOSTABLE',
    tools: ['Synthesia', 'ElevenLabs'],
    dataScope: ['Patient Testimonials (Anonymized)'],
    veraReasoning: 'No BAA with video synthesis vendor – blocks EU AI Act compliance',
    recommendation: 'BLOCK',
    confidence: 88,
    timestamp: new Date('2025-11-28T07:10:00'),
    shadowMode: true
  },
  {
    id: 'dec-003',
    campaignName: 'ONCAVEX HCP Portal',
    partner: 'Omnicom Health (Partner)',
    brand: 'ONCAVEX',
    tools: ['GPT-4 Turbo', 'Perplexity Pro'],
    dataScope: ['Clinical Trial Data (De-identified)'],
    veraReasoning: 'Clinical data scope requires CMO approval per policy v2.3',
    recommendation: 'ESCALATE',
    confidence: 73,
    timestamp: new Date('2025-11-28T06:30:00'),
    shadowMode: true
  },
  {
    id: 'dec-004',
    campaignName: 'CARDIOMAX Patient Guide',
    partner: 'Publicis Health (Partner)',
    brand: 'CARDIOMAX',
    tools: ['Claude 3.5', 'Midjourney v6.1'],
    dataScope: ['Patient Education Content'],
    veraReasoning: 'All tools approved, data scope within policy bounds, agency certified',
    recommendation: 'ALLOW',
    confidence: 96,
    timestamp: new Date('2025-11-28T05:45:00'),
    shadowMode: true
  }
];

export const missionControlStats = {
  enterprise: 'GlobalMed Therapeutics',
  autoClearRate: 90,
  decisionsNeedingAttention: 11,
  totalSubmissions: 127,
  last24Hours: true
};

export default mockDecisions;










