// AICOMPLYR Demo Data Generator
// Comprehensive demo data system for realistic pharma/agency scenarios

import { faker } from '@faker-js/faker';

// Helper function to generate realistic dates
const generateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate time-based metrics
const generateTimeSeriesData = (startDate, endDate, baseValue, variance = 0.1) => {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
    const value = baseValue + (Math.random() - 0.5) * variance * baseValue;
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100
    });
  }
  
  return data;
};

// Pharma Companies Data
export const pharmaCompanies = [
  {
    id: 'pfizer-marketing',
    name: 'Pfizer Marketing',
    type: 'pharma',
    industry: 'Pharmaceutical',
    employees: 78000,
    agencyPartners: 12,
    monthlyAISpend: 245000,
    complianceScore: 94,
    riskLevel: 'medium',
    headquarters: 'New York, NY',
    founded: 1849,
    annualRevenue: '81.3B',
    therapeuticAreas: ['Oncology', 'Cardiovascular', 'Vaccines', 'Rare Diseases'],
    complianceOfficer: {
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@pfizer.com',
      phone: '+1-212-733-2323',
      experience: '15 years'
    },
    aiPolicyVersion: '2.1',
    lastAudit: '2024-06-15',
    nextAudit: '2024-09-15'
  },
  {
    id: 'jj-consumer',
    name: 'Johnson & Johnson Consumer',
    type: 'pharma',
    industry: 'Consumer Health',
    employees: 52000,
    agencyPartners: 8,
    monthlyAISpend: 180000,
    complianceScore: 91,
    riskLevel: 'high',
    headquarters: 'New Brunswick, NJ',
    founded: 1886,
    annualRevenue: '95.1B',
    therapeuticAreas: ['Consumer Health', 'Medical Devices', 'Pharmaceuticals'],
    complianceOfficer: {
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@jnj.com',
      phone: '+1-732-524-0400',
      experience: '12 years'
    },
    aiPolicyVersion: '1.8',
    lastAudit: '2024-06-10',
    nextAudit: '2024-09-10'
  },
  {
    id: 'novartis-global',
    name: 'Novartis Global',
    type: 'pharma',
    industry: 'Pharmaceutical',
    employees: 108000,
    agencyPartners: 15,
    monthlyAISpend: 320000,
    complianceScore: 96,
    riskLevel: 'low',
    headquarters: 'Basel, Switzerland',
    founded: 1996,
    annualRevenue: '51.6B',
    therapeuticAreas: ['Oncology', 'Cardiovascular', 'Neuroscience', 'Immunology'],
    complianceOfficer: {
      name: 'Dr. Elena Petrova',
      email: 'elena.petrova@novartis.com',
      phone: '+41-61-324-1111',
      experience: '18 years'
    },
    aiPolicyVersion: '2.3',
    lastAudit: '2024-06-20',
    nextAudit: '2024-09-20'
  },
  {
    id: 'merck-msd',
    name: 'Merck & Co. (MSD)',
    type: 'pharma',
    industry: 'Pharmaceutical',
    employees: 69000,
    agencyPartners: 10,
    monthlyAISpend: 195000,
    complianceScore: 93,
    riskLevel: 'medium',
    headquarters: 'Kenilworth, NJ',
    founded: 1891,
    annualRevenue: '59.3B',
    therapeuticAreas: ['Oncology', 'Vaccines', 'Infectious Diseases', 'Cardiovascular'],
    complianceOfficer: {
      name: 'Jennifer Thompson',
      email: 'jennifer.thompson@merck.com',
      phone: '+1-908-740-4000',
      experience: '14 years'
    },
    aiPolicyVersion: '2.0',
    lastAudit: '2024-06-12',
    nextAudit: '2024-09-12'
  },
  {
    id: 'roche-pharma',
    name: 'Roche Pharmaceuticals',
    type: 'pharma',
    industry: 'Pharmaceutical',
    employees: 101000,
    agencyPartners: 14,
    monthlyAISpend: 280000,
    complianceScore: 95,
    riskLevel: 'low',
    headquarters: 'Basel, Switzerland',
    founded: 1896,
    annualRevenue: '66.3B',
    therapeuticAreas: ['Oncology', 'Neurology', 'Immunology', 'Infectious Diseases'],
    complianceOfficer: {
      name: 'Dr. Hans Mueller',
      email: 'hans.mueller@roche.com',
      phone: '+41-61-688-1111',
      experience: '16 years'
    },
    aiPolicyVersion: '2.2',
    lastAudit: '2024-06-18',
    nextAudit: '2024-09-18'
  }
];

// Agency Partner Ecosystems
export const agencyScenarios = [
  {
    id: 'ogilvy-health',
    name: 'Ogilvy Health',
    role: 'Full-Service Creative',
    specialization: 'Brand campaigns, social media, content creation',
    teamSize: 25,
    aiToolsUsed: ['Midjourney', 'ChatGPT', 'Runway', 'Adobe Firefly', 'DALL-E'],
    monthlySubmissions: 45,
    approvalRate: 89,
    avgApprovalTime: '2.3 days',
    riskIncidents: 1,
    complianceScore: 87,
    clientPartners: ['pfizer-marketing', 'jj-consumer'],
    specialties: ['Social Media Marketing', 'Brand Development', 'Content Creation'],
    teamMembers: [
      { name: 'Alex Johnson', role: 'Creative Director', experience: '8 years' },
      { name: 'Maria Garcia', role: 'Social Media Manager', experience: '5 years' },
      { name: 'David Kim', role: 'Content Strategist', experience: '6 years' }
    ],
    recentProjects: [
      { name: 'Pfizer Vaccine Campaign', status: 'completed', complianceScore: 92 },
      { name: 'J&J Product Launch', status: 'in-review', complianceScore: 88 }
    ]
  },
  {
    id: 'mccann-health',
    name: 'McCann Health',
    role: 'Medical Communications',
    specialization: 'Scientific content, medical education',
    teamSize: 18,
    aiToolsUsed: ['Claude', 'Grammarly', 'Synthesia', 'Jasper'],
    monthlySubmissions: 32,
    approvalRate: 95,
    avgApprovalTime: '1.8 days',
    riskIncidents: 0,
    complianceScore: 94,
    clientPartners: ['novartis-global', 'merck-msd'],
    specialties: ['Medical Writing', 'Scientific Content', 'Educational Materials'],
    teamMembers: [
      { name: 'Dr. Emily Watson', role: 'Medical Director', experience: '12 years' },
      { name: 'Robert Chen', role: 'Scientific Writer', experience: '7 years' },
      { name: 'Lisa Rodriguez', role: 'Content Manager', experience: '4 years' }
    ],
    recentProjects: [
      { name: 'Novartis Oncology Education', status: 'completed', complianceScore: 96 },
      { name: 'Merck Vaccine Materials', status: 'completed', complianceScore: 94 }
    ]
  },
  {
    id: 'razorfish-health',
    name: 'Razorfish Health',
    role: 'Digital Experience',
    specialization: 'Web development, digital campaigns, UX',
    teamSize: 12,
    aiToolsUsed: ['GitHub Copilot', 'Figma AI', 'ChatGPT', 'CodeWhisperer'],
    monthlySubmissions: 28,
    approvalRate: 92,
    avgApprovalTime: '2.1 days',
    riskIncidents: 0,
    complianceScore: 91,
    clientPartners: ['roche-pharma', 'pfizer-marketing'],
    specialties: ['Web Development', 'Digital Marketing', 'User Experience'],
    teamMembers: [
      { name: 'Sarah Williams', role: 'UX Director', experience: '9 years' },
      { name: 'Mike Patel', role: 'Frontend Developer', experience: '6 years' },
      { name: 'Anna Lee', role: 'Digital Strategist', experience: '5 years' }
    ],
    recentProjects: [
      { name: 'Roche Patient Portal', status: 'completed', complianceScore: 93 },
      { name: 'Pfizer Digital Campaign', status: 'in-review', complianceScore: 89 }
    ]
  },
  {
    id: 'havas-health',
    name: 'Havas Health',
    role: 'Integrated Communications',
    specialization: 'PR, media relations, stakeholder communications',
    teamSize: 20,
    aiToolsUsed: ['ChatGPT', 'Jasper', 'Copy.ai', 'Grammarly'],
    monthlySubmissions: 38,
    approvalRate: 88,
    avgApprovalTime: '2.5 days',
    riskIncidents: 2,
    complianceScore: 85,
    clientPartners: ['jj-consumer', 'merck-msd'],
    specialties: ['Public Relations', 'Media Relations', 'Stakeholder Communications'],
    teamMembers: [
      { name: 'James Wilson', role: 'PR Director', experience: '10 years' },
      { name: 'Rachel Green', role: 'Media Relations', experience: '7 years' },
      { name: 'Tom Brown', role: 'Communications Manager', experience: '5 years' }
    ],
    recentProjects: [
      { name: 'J&J Crisis Communication', status: 'completed', complianceScore: 82 },
      { name: 'Merck Product Launch PR', status: 'in-review', complianceScore: 87 }
    ]
  },
  {
    id: 'publicis-health',
    name: 'Publicis Health',
    role: 'Strategic Consulting',
    specialization: 'Market access, pricing, reimbursement',
    teamSize: 15,
    aiToolsUsed: ['ChatGPT', 'Claude', 'Perplexity', 'Bard'],
    monthlySubmissions: 22,
    approvalRate: 97,
    avgApprovalTime: '1.5 days',
    riskIncidents: 0,
    complianceScore: 96,
    clientPartners: ['novartis-global', 'roche-pharma'],
    specialties: ['Market Access', 'Pricing Strategy', 'Reimbursement'],
    teamMembers: [
      { name: 'Dr. Sarah Miller', role: 'Market Access Director', experience: '15 years' },
      { name: 'Kevin Zhang', role: 'Pricing Analyst', experience: '8 years' },
      { name: 'Amanda Foster', role: 'Reimbursement Specialist', experience: '6 years' }
    ],
    recentProjects: [
      { name: 'Novartis Market Access Strategy', status: 'completed', complianceScore: 98 },
      { name: 'Roche Pricing Analysis', status: 'completed', complianceScore: 95 }
    ]
  }
];

// Compliance Scenarios and Violations
export const complianceScenarios = [
  {
    id: 'social-media-violation-001',
    title: 'Social Media Medical Claim',
    description: 'AI-generated Instagram post contained unsubstantiated efficacy claim for Pfizer vaccine',
    severity: 'high',
    agency: 'Ogilvy Health',
    aiTool: 'ChatGPT',
    dateDetected: '2024-06-15',
    resolution: 'Post removed, policy updated, team retrained',
    preventionSuggestion: 'Medical claim detection in AI policy',
    status: 'resolved',
    impact: {
      reach: '15,000 followers',
      potentialViolation: 'FDA advertising regulations',
      costAvoided: '$50,000'
    },
    timeline: {
      detected: '2024-06-15T10:30:00Z',
      escalated: '2024-06-15T11:15:00Z',
      resolved: '2024-06-16T14:20:00Z'
    }
  },
  {
    id: 'image-copyright-002',
    title: 'Potential Copyright Infringement',
    description: 'AI-generated image similar to existing copyrighted medical illustration',
    severity: 'medium',
    agency: 'McCann Health',
    aiTool: 'Midjourney',
    dateDetected: '2024-06-08',
    resolution: 'Image replaced, source verification process implemented',
    preventionSuggestion: 'Copyright checking in image approval workflow',
    status: 'resolved',
    impact: {
      reach: 'Medical professionals',
      potentialViolation: 'Copyright law',
      costAvoided: '$25,000'
    },
    timeline: {
      detected: '2024-06-08T09:45:00Z',
      escalated: '2024-06-08T10:30:00Z',
      resolved: '2024-06-09T16:15:00Z'
    }
  },
  {
    id: 'data-privacy-003',
    title: 'Patient Data Privacy Concern',
    description: 'AI-generated content potentially contained identifiable patient information',
    severity: 'critical',
    agency: 'Razorfish Health',
    aiTool: 'ChatGPT',
    dateDetected: '2024-06-20',
    resolution: 'Content reviewed, HIPAA compliance training conducted',
    preventionSuggestion: 'Patient data detection in AI content review',
    status: 'resolved',
    impact: {
      reach: 'Healthcare providers',
      potentialViolation: 'HIPAA regulations',
      costAvoided: '$100,000'
    },
    timeline: {
      detected: '2024-06-20T13:20:00Z',
      escalated: '2024-06-20T13:45:00Z',
      resolved: '2024-06-21T11:30:00Z'
    }
  },
  {
    id: 'off-label-claim-004',
    title: 'Off-Label Indication Risk',
    description: 'AI-generated content suggested off-label use of medication',
    severity: 'high',
    agency: 'Havas Health',
    aiTool: 'Jasper',
    dateDetected: '2024-06-12',
    resolution: 'Content revised, approval workflow updated',
    preventionSuggestion: 'Off-label claim detection in AI policy',
    status: 'resolved',
    impact: {
      reach: 'Healthcare professionals',
      potentialViolation: 'FDA off-label promotion regulations',
      costAvoided: '$75,000'
    },
    timeline: {
      detected: '2024-06-12T08:15:00Z',
      escalated: '2024-06-12T08:45:00Z',
      resolved: '2024-06-13T15:20:00Z'
    }
  },
  {
    id: 'competitive-intel-005',
    title: 'Competitive Intelligence Risk',
    description: 'AI-generated content potentially revealed competitive information',
    severity: 'medium',
    agency: 'Publicis Health',
    aiTool: 'Claude',
    dateDetected: '2024-06-18',
    resolution: 'Content reviewed, competitive intelligence policy updated',
    preventionSuggestion: 'Competitive information detection in AI review',
    status: 'resolved',
    impact: {
      reach: 'Industry stakeholders',
      potentialViolation: 'Trade secret protection',
      costAvoided: '$30,000'
    },
    timeline: {
      detected: '2024-06-18T14:30:00Z',
      escalated: '2024-06-18T15:00:00Z',
      resolved: '2024-06-19T12:45:00Z'
    }
  }
];

// User Personas
export const userPersonas = [
  {
    id: 'compliance-officer-001',
    name: 'Dr. Sarah Chen',
    role: 'Chief Compliance Officer',
    company: 'Pfizer Marketing',
    email: 'sarah.chen@pfizer.com',
    permissions: ['admin', 'approve', 'audit', 'policy_management'],
    responsibilities: [
      'Oversee AI compliance across all agency partners',
      'Review and approve high-risk AI-generated content',
      'Conduct compliance audits and training',
      'Manage policy updates and enforcement'
    ],
    metrics: {
      approvalsThisMonth: 45,
      averageReviewTime: '1.2 hours',
      complianceScore: 94,
      riskIncidentsPrevented: 8
    }
  },
  {
    id: 'agency-admin-001',
    name: 'Alex Johnson',
    role: 'Creative Director',
    company: 'Ogilvy Health',
    email: 'alex.johnson@ogilvy.com',
    permissions: ['create', 'edit', 'submit', 'team_management'],
    responsibilities: [
      'Lead creative team in AI-powered content creation',
      'Ensure compliance with client AI policies',
      'Train team on AI tools and best practices',
      'Review submissions before client submission'
    ],
    metrics: {
      submissionsThisMonth: 23,
      approvalRate: 89,
      averageCreationTime: '3.5 hours',
      teamSize: 8
    }
  },
  {
    id: 'seat-user-001',
    name: 'Maria Garcia',
    role: 'Social Media Manager',
    company: 'Ogilvy Health',
    email: 'maria.garcia@ogilvy.com',
    permissions: ['create', 'edit', 'submit'],
    responsibilities: [
      'Create AI-powered social media content',
      'Ensure compliance with platform and client policies',
      'Collaborate with compliance team on approvals',
      'Track engagement and performance metrics'
    ],
    metrics: {
      postsCreatedThisMonth: 45,
      approvalRate: 87,
      averageEngagement: '2.3%',
      complianceScore: 85
    }
  },
  {
    id: 'enterprise-admin-001',
    name: 'Michael Rodriguez',
    role: 'Enterprise Administrator',
    company: 'Johnson & Johnson Consumer',
    email: 'michael.rodriguez@jnj.com',
    permissions: ['admin', 'user_management', 'policy_management', 'analytics'],
    responsibilities: [
      'Manage enterprise-wide AI compliance policies',
      'Oversee agency partner relationships',
      'Generate compliance reports and analytics',
      'Coordinate with legal and regulatory teams'
    ],
    metrics: {
      agenciesManaged: 8,
      totalUsers: 156,
      complianceScore: 91,
      monthlySpend: 180000
    }
  }
];

// Time-based ROI Metrics
export const generateROIMetrics = (company) => {
  const beforeData = {
    timeToApproval: '12-15 days',
    complianceScore: company.complianceScore - 15,
    adminTime: '35 hours/week',
    riskIncidents: '8-12 per month',
    costPerIncident: 25000,
    annualIncidents: 120
  };

  const afterData = {
    timeToApproval: '2-3 days',
    complianceScore: company.complianceScore,
    adminTime: '8 hours/week',
    riskIncidents: '0-2 per month',
    costPerIncident: 5000,
    annualIncidents: 12
  };

  const improvements = {
    timeToApproval: {
      before: beforeData.timeToApproval,
      after: afterData.timeToApproval,
      improvement: '80% faster',
      value: 80
    },
    complianceScore: {
      before: beforeData.complianceScore,
      after: afterData.complianceScore,
      improvement: '+15 points',
      value: 15
    },
    adminTime: {
      before: beforeData.adminTime,
      after: afterData.adminTime,
      improvement: '77% reduction',
      value: 77
    },
    riskIncidents: {
      before: beforeData.riskIncidents,
      after: afterData.riskIncidents,
      improvement: '85% reduction',
      value: 85
    }
  };

  const costSavings = {
    annual: '$127,000',
    breakdown: {
      adminTimeSavings: 54000, // 27 hours/week * 52 weeks * $40/hour
      incidentPrevention: 48000, // (120-12) incidents * $400 savings per incident
      fasterApprovals: 25000 // Opportunity cost savings
    },
    breakdownText: 'Admin time savings, faster approvals, incident prevention'
  };

  return {
    before: beforeData,
    after: afterData,
    improvements,
    costSavings
  };
};

// Time-series data for trends
export const generateDemoTimeSeriesData = () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-06-30');
  
  return {
    complianceTrends: pharmaCompanies.map(company => ({
      companyId: company.id,
      companyName: company.name,
      data: generateTimeSeriesData(startDate, endDate, company.complianceScore, 0.05)
    })),
    approvalTimes: agencyScenarios.map(agency => ({
      agencyId: agency.id,
      agencyName: agency.name,
      data: generateTimeSeriesData(startDate, endDate, parseFloat(agency.avgApprovalTime), 0.15)
    })),
    riskIncidents: pharmaCompanies.map(company => ({
      companyId: company.id,
      companyName: company.name,
      data: generateTimeSeriesData(startDate, endDate, 10, 0.3) // Starting with 10 incidents, reducing over time
    }))
  };
};

// Main demo data generator
export const createDemoData = () => {
  const timeSeriesData = generateDemoTimeSeriesData();
  
  return {
    pharmaCompanies,
    agencyScenarios,
    complianceScenarios,
    userPersonas,
    timeSeriesData,
    generateROIMetrics,
    
    // Additional demo data
    recentActivity: [
      {
        id: 'activity-001',
        type: 'policy_update',
        title: 'AI Policy Updated - Version 2.1',
        description: 'Enhanced medical claim detection and copyright checking',
        timestamp: new Date().toISOString(),
        company: 'Pfizer Marketing',
        impact: 'All agency partners notified'
      },
      {
        id: 'activity-002',
        type: 'compliance_alert',
        title: 'New Regulatory Guidelines',
        description: 'FDA updates on AI-generated medical content',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        company: 'All Companies',
        impact: 'Policy review required'
      },
      {
        id: 'activity-003',
        type: 'agency_onboarding',
        title: 'New Agency Partner Added',
        description: 'Publicis Health onboarded to AICOMPLYR',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        company: 'Novartis Global',
        impact: '15 new users added'
      }
    ],
    
    notifications: [
      {
        id: 'notif-001',
        type: 'approval_required',
        title: 'High-Risk Content Pending Approval',
        message: 'Social media campaign from Ogilvy Health requires your review',
        timestamp: new Date().toISOString(),
        priority: 'high',
        isRead: false
      },
      {
        id: 'notif-002',
        type: 'compliance_update',
        title: 'Compliance Score Improved',
        message: 'Your compliance score increased by 3 points this week',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        priority: 'medium',
        isRead: true
      },
      {
        id: 'notif-003',
        type: 'policy_update',
        title: 'New AI Policy Available',
        message: 'Updated policy for medical claim detection is now active',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        priority: 'medium',
        isRead: true
      }
    ],
    
    analytics: {
      totalSubmissions: 1247,
      averageApprovalTime: '2.1 days',
      complianceScore: 92,
      riskIncidents: 3,
      activeUsers: 156,
      agenciesManaged: 12,
      monthlySavings: 127000
    }
  };
}; 