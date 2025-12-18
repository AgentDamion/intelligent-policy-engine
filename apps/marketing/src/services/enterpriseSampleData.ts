import type { Agency, Policy, Submission } from '@/types/enterprise';

export const getSampleAgencies = (enterpriseId: string): Agency[] => [
  {
    id: 1,
    name: 'Ogilvy Health',
    compliance: 92,
    violations: 0,
    lastAudit: '2 days ago',
    status: 'active',
    enterpriseId
  },
  {
    id: 2,
    name: 'TBWA Worldwide',
    compliance: 88,
    violations: 1,
    lastAudit: '1 week ago',
    status: 'warning',
    enterpriseId
  },
  {
    id: 3,
    name: 'Publicis Health',
    compliance: 96,
    violations: 0,
    lastAudit: '3 days ago',
    status: 'active',
    enterpriseId
  }
];

export const getSamplePolicies = (enterpriseId: string): Policy[] => [
  {
    id: 1,
    title: 'AI Content Generation Guidelines',
    description: 'Guidelines for using AI tools in content creation',
    requirements: ['Human oversight required', 'Client disclosure mandatory', 'Content review process'],
    aiTools: ['ChatGPT', 'Claude', 'Midjourney'],
    status: 'active',
    createdAt: '2024-06-15',
    updatedAt: '2024-06-20',
    enterpriseId
  },
  {
    id: 2,
    title: 'Data Privacy in AI Processing',
    description: 'Ensuring client data privacy when using AI tools',
    requirements: ['No PII in prompts', 'Data anonymization required', 'Local processing preferred'],
    aiTools: ['All AI tools'],
    status: 'active',
    createdAt: '2024-06-20',
    updatedAt: '2024-06-25',
    enterpriseId
  },
  {
    id: 3,
    title: 'Healthcare Marketing Compliance',
    description: 'HIPAA-compliant AI usage in healthcare marketing',
    requirements: ['Medical review required', 'No patient data in AI prompts', 'FDA compliance check'],
    aiTools: ['ChatGPT', 'Claude'],
    status: 'active',
    createdAt: '2024-06-10',
    updatedAt: '2024-06-15',
    enterpriseId
  }
];

export const getSampleSubmissions = (): Submission[] => [
  {
    id: 1,
    agencyId: 1,
    agencyName: 'Ogilvy Health',
    type: 'Marketing Campaign',
    aiTools: ['ChatGPT', 'Midjourney'],
    status: 'pending',
    riskScore: 0.3,
    submittedAt: '2024-07-01',
    content: {
      title: 'Diabetes Awareness Campaign',
      description: 'AI-generated social media content for diabetes awareness',
      policies: [1, 3]
    }
  },
  {
    id: 2,
    agencyId: 2,
    agencyName: 'TBWA Worldwide',
    type: 'Social Media Content',
    aiTools: ['Claude'],
    status: 'pending',
    riskScore: 0.1,
    submittedAt: '2024-07-02',
    content: {
      title: 'Lifestyle Brand Promotion',
      description: 'AI-assisted copy for lifestyle brand social media',
      policies: [1, 2]
    }
  }
];