import { useState, useEffect } from 'react';

export interface ComplianceArea {
  name: string;
  status: 'compliant' | 'warning' | 'critical';
  score: number;
  details: string;
  lastChecked: string;
}

export interface ActionItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  area: string;
  description: string;
}

export interface ClientCompliance {
  id: string;
  name: string;
  overallStatus: 'compliant' | 'warning' | 'critical';
  overallScore: number;
  lastAudit: string;
  nextAudit: string;
  complianceAreas: ComplianceArea[];
  actionItems: ActionItem[];
  riskFactors: string[];
}

const sampleComplianceData: ClientCompliance[] = [
  {
    id: 'pfizer',
    name: 'Pfizer Inc.',
    overallStatus: 'compliant',
    overallScore: 94,
    lastAudit: '2024-01-15',
    nextAudit: '2024-04-15',
    complianceAreas: [
      { name: '21 CFR Part 11', status: 'compliant', score: 98, details: 'Electronic records fully compliant', lastChecked: '2024-01-15' },
      { name: 'Data Integrity', status: 'compliant', score: 96, details: 'Strong data governance policies', lastChecked: '2024-01-10' },
      { name: 'Audit Trail', status: 'warning', score: 87, details: 'Minor gaps in decision tracking', lastChecked: '2024-01-12' },
      { name: 'Risk Management', status: 'compliant', score: 95, details: 'Comprehensive risk assessment', lastChecked: '2024-01-08' }
    ],
    actionItems: [
      { id: '1', title: 'Enhance decision audit logging', priority: 'medium', dueDate: '2024-02-01', area: 'Audit Trail', description: 'Implement detailed decision tracking for AI tools' }
    ],
    riskFactors: ['Regulatory changes in Q2 2024']
  },
  {
    id: 'novartis',
    name: 'Novartis AG',
    overallStatus: 'warning',
    overallScore: 78,
    lastAudit: '2024-01-08',
    nextAudit: '2024-04-08',
    complianceAreas: [
      { name: '21 CFR Part 11', status: 'warning', score: 82, details: 'Electronic signature gaps identified', lastChecked: '2024-01-08' },
      { name: 'Data Integrity', status: 'warning', score: 75, details: 'Data validation procedures need updates', lastChecked: '2024-01-06' },
      { name: 'Audit Trail', status: 'compliant', score: 88, details: 'Good audit trail coverage', lastChecked: '2024-01-07' },
      { name: 'Risk Management', status: 'critical', score: 67, details: 'Risk assessment framework outdated', lastChecked: '2024-01-05' }
    ],
    actionItems: [
      { id: '2', title: 'Update electronic signature protocols', priority: 'high', dueDate: '2024-01-25', area: '21 CFR Part 11', description: 'Implement FDA-compliant e-signature workflows' },
      { id: '3', title: 'Revise risk management framework', priority: 'high', dueDate: '2024-01-30', area: 'Risk Management', description: 'Update risk assessment procedures for AI tools' }
    ],
    riskFactors: ['Upcoming FDA inspection', 'Legacy system integration challenges']
  },
  {
    id: 'jpmorgan',
    name: 'JPMorgan Chase',
    overallStatus: 'critical',
    overallScore: 62,
    lastAudit: '2024-01-03',
    nextAudit: '2024-04-03',
    complianceAreas: [
      { name: 'Model Risk Management', status: 'critical', score: 58, details: 'AI model governance gaps', lastChecked: '2024-01-03' },
      { name: 'Data Privacy', status: 'warning', score: 71, details: 'GDPR compliance needs improvement', lastChecked: '2024-01-02' },
      { name: 'Audit Trail', status: 'critical', score: 54, details: 'Incomplete decision logging', lastChecked: '2024-01-01' },
      { name: 'Risk Controls', status: 'warning', score: 76, details: 'Control framework partially implemented', lastChecked: '2023-12-30' }
    ],
    actionItems: [
      { id: '4', title: 'Implement AI model governance', priority: 'high', dueDate: '2024-01-20', area: 'Model Risk Management', description: 'Establish comprehensive AI model lifecycle management' },
      { id: '5', title: 'Complete audit trail implementation', priority: 'high', dueDate: '2024-01-22', area: 'Audit Trail', description: 'Deploy complete decision tracking system' },
      { id: '6', title: 'GDPR compliance review', priority: 'medium', dueDate: '2024-02-15', area: 'Data Privacy', description: 'Conduct comprehensive data privacy assessment' }
    ],
    riskFactors: ['Regulatory enforcement actions', 'Complex multi-jurisdictional requirements', 'Legacy technology constraints']
  },
  {
    id: 'gsk',
    name: 'GlaxoSmithKline',
    overallStatus: 'compliant',
    overallScore: 91,
    lastAudit: '2024-01-12',
    nextAudit: '2024-04-12',
    complianceAreas: [
      { name: '21 CFR Part 11', status: 'compliant', score: 93, details: 'Excellent electronic records management', lastChecked: '2024-01-12' },
      { name: 'Data Integrity', status: 'compliant', score: 92, details: 'Robust data governance framework', lastChecked: '2024-01-11' },
      { name: 'Audit Trail', status: 'compliant', score: 89, details: 'Comprehensive audit logging', lastChecked: '2024-01-10' },
      { name: 'Risk Management', status: 'warning', score: 89, details: 'Minor improvements needed', lastChecked: '2024-01-09' }
    ],
    actionItems: [
      { id: '7', title: 'Risk framework optimization', priority: 'low', dueDate: '2024-03-01', area: 'Risk Management', description: 'Fine-tune risk assessment algorithms' }
    ],
    riskFactors: ['New therapeutic area expansion']
  }
];

export const useClientComplianceData = () => {
  const [data, setData] = useState<ClientCompliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setData(sampleComplianceData);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getStatusCounts = () => {
    return {
      compliant: data.filter(client => client.overallStatus === 'compliant').length,
      warning: data.filter(client => client.overallStatus === 'warning').length,
      critical: data.filter(client => client.overallStatus === 'critical').length,
      total: data.length
    };
  };

  const getAllActionItems = () => {
    return data.flatMap(client => 
      client.actionItems.map(item => ({
        ...item,
        clientName: client.name
      }))
    ).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  return {
    data,
    loading,
    statusCounts: getStatusCounts(),
    allActionItems: getAllActionItems(),
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setData(sampleComplianceData);
        setLoading(false);
      }, 500);
    }
  };
};