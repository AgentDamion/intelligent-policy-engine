export interface WhitePaper {
  id: string;
  title: string;
  description: string;
  category: 'compliance' | 'roi' | 'risk-management' | 'best-practices' | 'frameworks';
  industry: 'pharmaceutical' | 'marketing-services' | 'financial' | 'healthcare' | 'all';
  author: string;
  publishDate: string;
  coverImage: string;
  keyTakeaways: string[];
  featured?: boolean;
}

export interface WhitePaperTrilogy {
  id: string;
  number: 1 | 2 | 3;
  badge: string;
  badgeColor: 'navy' | 'teal' | 'amber';
  title: string;
  subtitle: string;
  prevents: string;
  frameworks: string[];
  downloads: number;
  testimonial: string;
  testimonialAuthor: string;
  pageCount: number;
  pdfPath: string;
}

export const whitePapers: WhitePaper[] = [
  {
    id: 'fda-compliance-challenge',
    title: 'The $50B FDA Compliance Challenge: How AI is Changing Drug Development',
    description: 'Comprehensive analysis of FDA regulatory requirements for AI systems in pharmaceutical development. Learn how leading companies are navigating 21 CFR Part 11 compliance while accelerating AI adoption.',
    category: 'compliance',
    industry: 'pharmaceutical',
    author: 'aicomply.io Research Team',
    publishDate: '2025-01',
    coverImage: '/placeholder.svg',
    featured: true,
    keyTakeaways: [
      'FDA regulatory landscape for AI in drug development',
      'Step-by-step 21 CFR Part 11 compliance framework',
      'Case studies from top 10 pharma companies',
      'ROI analysis: compliance vs. innovation speed'
    ]
  },
  {
    id: 'ai-governance-framework',
    title: 'AI Governance Framework for Pharmaceutical Companies',
    description: 'A complete playbook for implementing AI governance across your organization. Includes policy templates, risk assessment matrices, and audit trail requirements.',
    category: 'frameworks',
    industry: 'pharmaceutical',
    author: 'aicomply.io Compliance Team',
    publishDate: '2025-01',
    coverImage: '/placeholder.svg',
    featured: true,
    keyTakeaways: [
      'Ready-to-implement governance framework',
      '15+ policy templates for immediate use',
      'Risk assessment methodology',
      'Vendor evaluation checklist'
    ]
  },
  {
    id: '21-cfr-part-11-guide',
    title: '21 CFR Part 11 Compliance: A Complete Guide for AI Systems',
    description: 'Deep dive into FDA\'s electronic records and electronic signatures regulation. Learn how to ensure your AI tools meet all requirements for data integrity, audit trails, and validation.',
    category: 'compliance',
    industry: 'pharmaceutical',
    author: 'Dr. Sarah Chen, Former FDA Reviewer',
    publishDate: '2024-12',
    coverImage: '/placeholder.svg',
    keyTakeaways: [
      'Complete 21 CFR Part 11 requirements breakdown',
      'AI-specific compliance considerations',
      'Validation and testing protocols',
      'Common audit findings and how to avoid them'
    ]
  },
  {
    id: 'agency-ai-risk-management',
    title: 'Marketing Agency AI Risk Management: The Complete Playbook',
    description: 'How leading marketing agencies are managing AI tool risk across multiple client brands. Includes multi-client policy harmonization strategies and client communication templates.',
    category: 'risk-management',
    industry: 'marketing-services',
    author: 'aicomply.io Agency Practice',
    publishDate: '2025-01',
    coverImage: '/placeholder.svg',
    featured: true,
    keyTakeaways: [
      'Multi-client AI governance strategies',
      'Client policy harmonization framework',
      'Risk scoring for creative AI tools',
      'RFP response templates'
    ]
  },
  {
    id: 'roi-calculator-compliance',
    title: 'ROI Calculator: The True Cost of Non-Compliance in Pharma AI',
    description: 'Financial impact analysis of AI compliance gaps. Includes interactive calculator, industry benchmarks, and cost-benefit analysis of governance platforms.',
    category: 'roi',
    industry: 'pharmaceutical',
    author: 'aicomply.io Analytics Team',
    publishDate: '2024-12',
    coverImage: '/placeholder.svg',
    keyTakeaways: [
      'Cost of regulatory delays ($2.8B avg)',
      'Hidden costs of manual governance processes',
      'Platform ROI calculation methodology',
      'Industry benchmark data'
    ]
  },
  {
    id: 'partner-ai-governance',
    title: 'Partner AI Governance: Managing Third-Party Risk',
    description: 'How to evaluate and manage AI tools from external vendors, agencies, and partners. Includes vendor assessment templates and contract language.',
    category: 'risk-management',
    industry: 'all',
    author: 'aicomply.io Legal & Compliance',
    publishDate: '2024-11',
    coverImage: '/placeholder.svg',
    keyTakeaways: [
      'Vendor AI risk assessment framework',
      'Contract clauses for AI tool governance',
      'Ongoing monitoring strategies',
      'Remediation playbooks'
    ]
  },
  {
    id: 'eu-ai-act-pharma',
    title: 'EU AI Act Impact on Pharmaceutical Companies',
    description: 'What the EU AI Act means for pharma companies developing or deploying AI. Compliance timeline, high-risk system requirements, and implementation roadmap.',
    category: 'compliance',
    industry: 'pharmaceutical',
    author: 'aicomply.io EU Compliance Team',
    publishDate: '2024-12',
    coverImage: '/placeholder.svg',
    keyTakeaways: [
      'EU AI Act requirements for pharma',
      'High-risk AI system classification',
      'Implementation timeline and deadlines',
      'Harmonization with FDA requirements'
    ]
  },
  {
    id: 'approval-velocity-optimization',
    title: 'Approval Velocity Optimization: From 47 Days to 4 Days',
    description: 'Real-world case studies of organizations that 10x\'d their AI tool approval speed. Learn the exact workflows, policies, and platform capabilities that enabled this transformation.',
    category: 'best-practices',
    industry: 'all',
    author: 'aicomply.io Customer Success',
    publishDate: '2025-01',
    coverImage: '/placeholder.svg',
    featured: true,
    keyTakeaways: [
      'Before/after workflow analysis',
      'Bottleneck identification framework',
      'Automation opportunities mapping',
      'Change management strategies'
    ]
  }
];

// Helper functions for filtering
export const getWhitePapersByIndustry = (industry: WhitePaper['industry']) => {
  return whitePapers.filter(wp => wp.industry === industry || wp.industry === 'all');
};

export const getWhitePapersByCategory = (category: WhitePaper['category']) => {
  return whitePapers.filter(wp => wp.category === category);
};

export const getFeaturedWhitePapers = () => {
  return whitePapers.filter(wp => wp.featured);
};

export const trilogyPapers: WhitePaperTrilogy[] = [
  {
    id: 'executable-policy',
    number: 1,
    badge: 'FOUNDATION',
    badgeColor: 'navy',
    title: 'White Paper #1: Executable Policy',
    subtitle: 'Where AI Governance Actually Happens',
    prevents: 'Policy without enforcement',
    frameworks: [
      '5-Layer Policy Stack',
      'Three-Stage Enforcement (Pre/In/Post)',
      '90-Day Implementation Roadmap'
    ],
    downloads: 2847,
    testimonial: 'Finally, governance that doesn\'t kill velocity.',
    testimonialAuthor: 'VP Compliance, Top 10 Pharma',
    pageCount: 26,
    pdfPath: '/white-papers/executable-policy.pdf'
  },
  {
    id: 'ai-supply-chain',
    number: 2,
    badge: 'VISIBILITY',
    badgeColor: 'teal',
    title: 'White Paper #2: AI Supply Chain Visibility',
    subtitle: 'Beyond the Model',
    prevents: 'Third-party blindness',
    frameworks: [
      'Multi-Client Policy Harmonization',
      'Third-Party Risk Cascade',
      'Meta-Loop Orchestration'
    ],
    downloads: 1923,
    testimonial: 'The multi-client framework we needed.',
    testimonialAuthor: 'COO, Pharma Marketing Agency',
    pageCount: 24,
    pdfPath: '/white-papers/ai-supply-chain-visibility.pdf'
  },
  {
    id: 'proof-layer',
    number: 3,
    badge: 'PROOF',
    badgeColor: 'amber',
    title: 'White Paper #3: The Proof Layer',
    subtitle: 'From Compliance to Confidence',
    prevents: 'Audit nightmare',
    frameworks: [
      'Minimum Viable Proof Bundle (MVPB)',
      'Evidence Portability Model',
      'Meta-Loop Learning Acceleration'
    ],
    downloads: 1456,
    testimonial: 'Audit log = new currency of credibility.',
    testimonialAuthor: 'Head of MLR, Global Pharma',
    pageCount: 12,
    pdfPath: '/white-papers/the-proof-layer.pdf'
  }
];
