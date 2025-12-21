export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  industry: 'all' | 'pharmaceutical' | 'financial' | 'healthcare';
  audience: 'agency' | 'enterprise';
  riskLevel: 'high' | 'medium' | 'low' | 'foundation';
  phases: number;
  aiHotspots: number;
  criticalItems: number;
  featured: boolean;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'hcp-campaign',
    title: 'HCP Campaign Development',
    description: 'Full lifecycle from client brief to market deployment for healthcare professional campaigns',
    industry: 'pharmaceutical',
    audience: 'agency',
    riskLevel: 'high',
    phases: 6,
    aiHotspots: 12,
    criticalItems: 2,
    featured: true
  },
  {
    id: 'patient-education',
    title: 'Patient Education Materials',
    description: 'DTC content development with simplified MLR pathway',
    industry: 'pharmaceutical',
    audience: 'agency',
    riskLevel: 'medium',
    phases: 5,
    aiHotspots: 10,
    criticalItems: 1,
    featured: true
  },
  {
    id: 'agency-oversight',
    title: 'Agency Oversight Framework',
    description: 'Monitor partner AI usage across your agency roster',
    industry: 'all',
    audience: 'enterprise',
    riskLevel: 'foundation',
    phases: 4,
    aiHotspots: 6,
    criticalItems: 0,
    featured: true
  },
  {
    id: 'clinical-trial-comms',
    title: 'Clinical Trial Communications',
    description: 'Patient recruitment and site communications with regulatory compliance',
    industry: 'pharmaceutical',
    audience: 'agency',
    riskLevel: 'high',
    phases: 7,
    aiHotspots: 15,
    criticalItems: 3,
    featured: false
  },
  {
    id: 'medical-affairs',
    title: 'Medical Affairs Content',
    description: 'Scientific publications and KOL engagement materials',
    industry: 'pharmaceutical',
    audience: 'agency',
    riskLevel: 'high',
    phases: 5,
    aiHotspots: 8,
    criticalItems: 2,
    featured: false
  },
  {
    id: 'brand-launch',
    title: 'New Brand Launch',
    description: 'Full-scale brand introduction with multi-channel activation',
    industry: 'pharmaceutical',
    audience: 'agency',
    riskLevel: 'high',
    phases: 8,
    aiHotspots: 20,
    criticalItems: 4,
    featured: false
  }
];

export const industries = [
  { id: 'all', label: 'All Industries', available: true },
  { id: 'pharmaceutical', label: 'Pharmaceutical', available: true, icon: '💊' },
  { id: 'financial', label: 'Financial Services', available: false, icon: '🏦' },
  { id: 'healthcare', label: 'Healthcare', available: false, icon: '❤️' }
];

export default workflowTemplates;



