// Route Registry - Single source of truth for all application routes
export const routes = {
  // Public routes
  home: '/',
  platform: '/platform',
  marketplacePublic: '/marketplace-public',
  
  // Marketplace Application routes
  marketplace: {
    home: '/marketplace',
    tools: '/marketplace/tools',
    categories: '/marketplace/categories',
    requests: '/marketplace/requests',
    admin: '/marketplace/admin',
  },

  // Vendor routes
  vendor: {
    dashboard: '/vendor/dashboard',
    tools: '/vendor/tools',
    toolSubmission: '/vendor/tools/new',
    submissions: '/vendor/submissions',
    promotions: '/vendor/promotions',
    analytics: '/vendor/analytics',
    settings: '/vendor/settings',
  },
  backendTest: '/backend-test',
  proofCenter: '/proof-center',
  aiAccelerationScore: '/ai-acceleration-score',
  pricing: '/pricing',
  contact: '/contact',
  about: '/about',
  industries: {
    pharmaceutical: '/industries/pharmaceutical',
    marketingServices: '/industries/marketing-services',
  },
  premium: '/premium',
  legacy: '/legacy',
  alternate: '/alternate',
  policySettings: '/policy-settings',
  auth: '/auth',

  // Shared utilities
  notifications: '/notifications',
  search: '/search',
  settings: '/settings',

  // Governance routes
  governance: {
    inbox: '/governance/inbox',
    policies: '/governance/policies',
    audits: '/governance/audits',
    tools: '/governance/tools',
    analytics: '/governance/analytics',
  },

  // Agency routes
  agency: {
    dashboard: '/agency/dashboard',
    performance: '/agency/performance',
    requirements: '/agency/requirements',
    compliance: '/agency/compliance-status',
    aiReadiness: '/agency/ai-readiness',
    myTools: '/agency/my-tools',
    integrations: '/agency/integrations',
    projectSetup: '/agency/project-setup',
    aiToolTracking: '/agency/ai-tool-tracking',
    submissions: '/agency/submissions',
    submission: (id: string) => `/agency/submissions/${id}`,
    reviews: '/agency/reviews',
    conflicts: '/agency/conflicts',
    policyRequests: '/agency/policy-requests',
    policyRequestResponses: '/agency/policy-request-responses',
    policyRequestResponse: (id: string) => `/agency/policy-request-response/${id}`,
    policyRequestResponseNew: '/agency/policy-request-response/new',
    knowledgeBase: '/agency/knowledge-base',
    admin: {
      team: '/agency/admin/team',
      clients: '/agency/admin/clients',
      projects: '/agency/admin/projects',
      settings: '/agency/admin/settings',
    },
  },

  // Submission flow
  invite: (token: string) => `/invite/${token}`,
  submissionWizard: '/submission',
  submissionConfirmation: '/submission-confirmation',

  // Demo and testing
  lighthouse: '/lighthouse',
  demo: '/demo',
  tierDemo: '/tier-demo',
  documentProcessingDemo: '/document-processing-demo',
  demoHub: '/demos',
  testPolicySubmission: '/test-policy-submission',

  // Development utilities
  dev: {
    routeSchema: '/dev/route-schema',
    linkHealth: '/dev/link-health',
  },

  // Customer Portal
  portal: {
    dashboard: '/portal/dashboard',
    billing: '/portal/billing',
    analytics: '/portal/analytics',
    account: '/portal/account'
  },

  // Internal Business Operations (aicomply.io team)
  internal: {
    dashboard: '/internal/dashboard',
    sales: '/internal/sales',
    marketing: '/internal/marketing',
    finance: '/internal/finance',
    legal: '/internal/legal',
    hr: '/internal/hr',
    partners: '/internal/partners',
    enterprises: '/internal/enterprises',
    tools: '/internal/tools',
    audits: '/internal/audits',
    system: '/internal/system',
    apiKeys: '/internal/api-keys',
    security: '/internal/security',
    settings: '/internal/settings'
  },

  // Enterprise Admin (Customer tenant admin)
  enterprise: {
    dashboard: '/enterprise/dashboard',
    analytics: '/enterprise/analytics',
    policies: '/enterprise/policies',
    policyStudio: (id?: string) => id ? `/enterprise/policies/${id}` : '/enterprise/policies/new',
    policyHierarchy: '/enterprise/policy-hierarchy',
    workflows: '/enterprise/workflows',
    workflowRuns: '/enterprise/workflows/runs',
    auditTrail: '/enterprise/audit-trail',
    partners: '/enterprise/partners',
    partnerProfile: (id: string) => `/enterprise/partners/${id}`,
    marketplaceDashboard: '/enterprise/marketplace-dashboard',
    toolDetails: (id: string) => `/enterprise/marketplace/tools/${id}`,
    toolIntelligence: '/enterprise/tool-intelligence',
    submissions: '/enterprise/submissions',
    submission: (id: string) => `/enterprise/submissions/${id}`,
    decisions: '/enterprise/decisions',
    decision: (id: string) => `/enterprise/decisions/${id}`,
    policyLibrary: '/enterprise/policy-library',
    platformIntegrations: '/enterprise/platform-integrations',
    importPolicy: '/enterprise/import-policy',
    sandbox: '/enterprise/sandbox',
    sandboxRun: (id: string) => `/enterprise/sandbox/run/${id}`,
    admin: {
      users: '/enterprise/admin/users',
      roles: '/enterprise/admin/roles', 
      settings: '/enterprise/admin/settings',
      compliance: '/enterprise/admin/compliance',
      billing: '/enterprise/admin/billing',
    },
  },

  // Public Website
  public: {
    industries: '/industries',
    resources: '/resources',
    trustCenter: '/trust-center',
    compliance: '/compliance-calculator',
    whitePapers: '/white-papers'
  },
  
  investors: '/investors',
  
  // Agentic Governance UI (Premium)
  agentic: {
    base: '/agentic',
    weave: '/agentic?tab=weave',
    spine: '/agentic?tab=spine',
    constellation: '/agentic?tab=constellation',
    workbench: '/agentic?tab=workbench',
  },
} as const;

// Helper functions for navigation
export const getRoutesByMode = (mode: 'enterprise' | 'partner' | 'vendor' | 'admin') => {
  if (mode === 'enterprise') {
    return {
      dashboard: routes.enterprise.dashboard,
      analytics: routes.enterprise.analytics,
      policies: routes.enterprise.policies,
      workflows: routes.enterprise.workflows,
      auditTrail: routes.enterprise.auditTrail,
      partners: routes.enterprise.partners,
      marketplaceDashboard: routes.enterprise.marketplaceDashboard,
      toolIntelligence: routes.enterprise.toolIntelligence,
      submissions: routes.enterprise.submissions,
      decisions: routes.enterprise.decisions,
    };
  } else {
    return {
      dashboard: routes.agency.dashboard,
      performance: routes.agency.performance,
      requirements: routes.agency.requirements,
      compliance: routes.agency.compliance,
      aiReadiness: routes.agency.aiReadiness,
      myTools: routes.agency.myTools,
      integrations: routes.agency.integrations,
      projectSetup: routes.agency.projectSetup,
      aiToolTracking: routes.agency.aiToolTracking,
      submissions: routes.agency.submissions,
      reviews: routes.agency.reviews,
      conflicts: routes.agency.conflicts,
    };
  }
};