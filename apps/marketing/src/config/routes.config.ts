// Centralized Route Configuration for Phase 2 Optimization
import { RouteObject } from 'react-router-dom';
import { routes } from '@/lib/routes';

// Public Routes (Landing pages, marketing, etc.)
export const publicRoutes = [
  { 
    path: routes.home, 
    category: 'landing',
    title: 'Home'
  },
  { 
    path: routes.platform, 
    category: 'product',
    title: 'Platform'
  },
  { 
    path: routes.industries.pharmaceutical, 
    category: 'industry',
    title: 'Pharmaceutical'
  },
  { 
    path: routes.industries.marketingServices, 
    category: 'industry',
    title: 'Marketing Services'
  },
  { 
    path: routes.proofCenter, 
    category: 'product',
    title: 'Proof Center'
  },
  { 
    path: routes.pricing, 
    category: 'sales',
    title: 'Pricing'
  },
  { 
    path: routes.contact, 
    category: 'sales',
    title: 'Contact'
  },
  { 
    path: routes.about, 
    category: 'company',
    title: 'About'
  }
];

// Enterprise Dashboard Routes
export const enterpriseRoutes = [
  {
    path: routes.enterprise.dashboard,
    category: 'overview',
    title: 'Dashboard',
    description: 'Main enterprise dashboard'
  },
  {
    path: routes.enterprise.analytics,
    category: 'overview', 
    title: 'Analytics',
    description: 'Business intelligence and metrics'
  },
  {
    path: routes.enterprise.policies,
    category: 'governance',
    title: 'Policies',
    description: 'Policy management and enforcement'
  },
  {
    path: routes.enterprise.workflows,
    category: 'governance',
    title: 'Workflows',
    description: 'Automated governance workflows'
  },
  {
    path: routes.enterprise.auditTrail,
    category: 'governance',
    title: 'Audit Trail',
    description: 'Compliance audit and history'
  },
  {
    path: routes.enterprise.partners,
    category: 'ecosystem',
    title: 'Partners',
    description: 'Partner management and relationships'
  },
  {
    path: routes.enterprise.toolIntelligence,
    category: 'ecosystem',
    title: 'Tool Intelligence',
    description: 'AI tool analysis and insights'
  },
  {
    path: routes.enterprise.marketplaceDashboard,
    category: 'ecosystem',
    title: 'Marketplace',
    description: 'Tool marketplace and procurement'
  },
  {
    path: routes.enterprise.submissions,
    category: 'operations',
    title: 'Submissions',
    description: 'Review and approval submissions'
  },
  {
    path: routes.enterprise.decisions,
    category: 'operations',
    title: 'Decisions',
    description: 'Decision tracking and audit'
  }
];

// Agency/Partner Routes
export const agencyRoutes = [
  {
    path: routes.agency.dashboard,
    category: 'overview',
    title: 'Dashboard',
    description: 'Agency compliance dashboard'
  },
  {
    path: routes.agency.performance,
    category: 'overview',
    title: 'Performance',
    description: 'Performance metrics and trends'
  },
  {
    path: routes.agency.requirements,
    category: 'compliance',
    title: 'Requirements',
    description: 'Compliance requirements tracking'
  },
  {
    path: routes.agency.compliance,
    category: 'compliance',
    title: 'Compliance Status',
    description: 'Current compliance status overview'
  },
  {
    path: routes.agency.aiReadiness,
    category: 'compliance',
    title: 'AI Readiness',
    description: 'AI deployment readiness assessment'
  },
  {
    path: routes.agency.projectSetup,
    category: 'tools',
    title: 'Project Setup',
    description: 'Setup new AI projects'
  },
  {
    path: routes.agency.aiToolTracking,
    category: 'tools',
    title: 'AI Tool Tracking',
    description: 'Track AI tool deployment and usage'
  },
  {
    path: routes.agency.myTools,
    category: 'tools',
    title: 'My Tools',
    description: 'Manage your AI tools portfolio'
  },
  {
    path: routes.agency.integrations,
    category: 'tools',
    title: 'Integrations',
    description: 'Third-party integrations'
  },
  {
    path: routes.agency.submissions,
    category: 'workflow',
    title: 'Submissions',
    description: 'Submission tracking and status'
  },
  {
    path: routes.agency.reviews,
    category: 'workflow',
    title: 'Reviews',
    description: 'Review requests and feedback'
  },
  {
    path: routes.agency.conflicts,
    category: 'workflow',
    title: 'Conflicts',
    description: 'Conflict detection and resolution'
  }
];

// Vendor Routes
export const vendorRoutes = [
  {
    path: routes.vendor.dashboard,
    category: 'vendor',
    title: 'Vendor Dashboard',
    description: 'Vendor portal overview and analytics'
  },
  {
    path: routes.vendor.tools,
    category: 'vendor', 
    title: 'My Tools',
    description: 'Manage submitted AI tools'
  },
  {
    path: routes.vendor.submissions,
    category: 'vendor',
    title: 'Submissions',
    description: 'Track tool submission status'
  },
  {
    path: routes.vendor.promotions,
    category: 'vendor',
    title: 'Promotions',
    description: 'Manage promotional campaigns'
  },
  {
    path: routes.vendor.analytics,
    category: 'vendor',
    title: 'Analytics',
    description: 'Tool performance and revenue analytics'
  },
  {
    path: routes.vendor.settings,
    category: 'vendor',
    title: 'Settings',
    description: 'Vendor account and preferences'
  }
];

// Demo and Development Routes
export const demoRoutes = [
  {
    path: routes.lighthouse,
    category: 'demo',
    title: 'Lighthouse Demo',
    description: 'Interactive platform demonstration'
  },
  {
    path: routes.demo,
    category: 'demo',
    title: 'Platform Demo',
    description: 'Core platform functionality demo'
  },
  {
    path: routes.tierDemo,
    category: 'demo',
    title: 'Tier Demo',
    description: 'Tiered access demonstration'
  },
  {
    path: routes.documentProcessingDemo,
    category: 'demo',
    title: 'Document Processing',
    description: 'Document processing capabilities'
  },
  {
    path: routes.demoHub,
    category: 'demo',
    title: 'Demo Hub',
    description: 'Central demo navigation'
  }
];

// Utility Routes
export const utilityRoutes = [
  {
    path: routes.notifications,
    category: 'utility',
    title: 'Notifications',
    description: 'System notifications and alerts'
  },
  {
    path: routes.search,
    category: 'utility',
    title: 'Search',
    description: 'Global search functionality'
  },
  {
    path: routes.settings,
    category: 'utility',
    title: 'Settings',
    description: 'Application settings and preferences'
  }
];

// Route Categories for Navigation Organization
export const routeCategories = {
  // Public site categories
  landing: { title: 'Landing Pages', description: 'Marketing and conversion pages' },
  product: { title: 'Product Pages', description: 'Product information and demos' },
  industry: { title: 'Industry Solutions', description: 'Industry-specific content' },
  sales: { title: 'Sales & Contact', description: 'Sales and contact information' },
  company: { title: 'Company Info', description: 'About us and company details' },
  
  // App categories
  overview: { title: 'Overview', description: 'Dashboards and high-level metrics' },
  governance: { title: 'Governance', description: 'Policies, workflows, and compliance' },
  ecosystem: { title: 'Ecosystem', description: 'Partners, tools, and marketplace' },
  operations: { title: 'Operations', description: 'Day-to-day operational tasks' },
  compliance: { title: 'Compliance', description: 'Compliance tracking and assessment' },
  tools: { title: 'Tools & Integration', description: 'AI tools and system integrations' },
  workflow: { title: 'Workflow', description: 'Submission and review workflows' },
  vendor: { title: 'Vendor Portal', description: 'AI tool vendor management' },
  demo: { title: 'Demos', description: 'Interactive demonstrations' },
  utility: { title: 'Utilities', description: 'Settings, search, and notifications' }
};

// Helper functions for route organization
export const getRoutesByCategory = (category: keyof typeof routeCategories) => {
  const allRoutes = [
    ...publicRoutes,
    ...enterpriseRoutes,
    ...vendorRoutes,
    ...agencyRoutes,
    ...demoRoutes,
    ...utilityRoutes
  ];
  
  return allRoutes.filter(route => route.category === category);
};

export const getRoutesByMode = (mode: 'enterprise' | 'partner' | 'vendor' | 'admin') => {
  if (mode === 'vendor') return []; // Vendors have separate routing
  if (mode === 'admin') return []; // Admin has separate internal routing
  return mode === 'enterprise' ? enterpriseRoutes : agencyRoutes;
};

export const getAllManagedRoutes = () => {
  return [
    ...publicRoutes,
    ...enterpriseRoutes, 
    ...agencyRoutes,
    ...vendorRoutes,
    ...demoRoutes,
    ...utilityRoutes
  ];
};