// /api/mock.routes.js
const router = require('express').Router();

console.log('[MOCK API] Mock routes loaded - no database required');

// Health
router.get('/health', (req, res) => res.json({ ok: true, mode: 'mock', timestamp: new Date().toISOString() }));

// Auth
router.post('/auth/signin', (req, res) => {
  const { email, password, useMagicLink, remember } = req.body || {};
  
  console.log(`[MOCK AUTH] Sign in attempt: ${email}, useMagicLink: ${useMagicLink}`);
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  return res.json({
    userId: 'u_mock_123',
    email,
    token: 'mock.jwt.token.12345',
    mfaRequired: !useMagicLink,     // require MFA if not using magic link
    roles: ['admin'],
    orgId: 'org_mock_456'
  });
});

// Session check
router.get('/auth/session', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  return res.json({
    userId: 'u_mock_123',
    email: 'admin@aicomplyr.io',
    token: token,
    mfaRequired: false,
    roles: ['admin'],
    orgId: 'org_mock_456'
  });
});

// Logout
router.post('/auth/logout', (req, res) => {
  console.log('[MOCK AUTH] User logged out');
  res.clearCookie('auth_token');
  return res.json({ success: true });
});

// Org creation
router.post('/org/create', (req, res) => {
  const { orgName, orgType, region, emailDomain, enableSSO, ssoProvider, initialRoles } = req.body || {};
  
  console.log(`[MOCK ORG] Creating organization: ${orgName}, type: ${orgType}`);
  
  if (!orgName) {
    return res.status(400).json({ error: 'Organization name is required' });
  }
  
  return res.json({
    orgId: 'org_mock_' + Date.now(),
    orgName,
    orgType,
    region,
    emailDomain,
    sso: { enabled: !!enableSSO, provider: ssoProvider || null },
    initialRoles,
    next: 'mfa',
    message: 'Organization created successfully'
  });
});

// Join org (access request)
router.post('/org/request-access', (req, res) => {
  const { email, inviteCode } = req.body || {};
  
  console.log(`[MOCK ORG] Access request from: ${email}, invite: ${inviteCode}`);
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  return res.json({ 
    success: true, 
    status: 'pending',
    message: 'Access request submitted successfully'
  });
});

// SSO stubs
router.get('/oauth/start/:provider', (req, res) => {
  console.log(`[MOCK SSO] OAuth start for: ${req.params.provider}`);
  return res.json({ redirected: true, provider: req.params.provider, url: `/auth?sso=${req.params.provider}&status=mock` });
});

router.post('/oauth/callback/:provider', (req, res) => {
  console.log(`[MOCK SSO] OAuth callback for: ${req.params.provider}`);
  return res.json({ success: false, error: `OAuth for ${req.params.provider} not implemented (mock mode)` });
});

router.get('/saml/start', (req, res) => {
  console.log('[MOCK SSO] SAML start');
  return res.json({ redirected: true, provider: 'okta', url: '/auth?sso=saml&status=mock' });
});

router.post('/saml/callback', (req, res) => {
  console.log('[MOCK SSO] SAML callback');
  return res.json({ success: false, error: 'SAML SSO not implemented (mock mode)' });
});

// Analytics
router.post('/analytics/track', (req, res) => {
  const { name, properties } = req.body || {};
  console.log(`[MOCK ANALYTICS] Event: ${name}`, properties);
  return res.json({ success: true });
});

// =============================================
// ENTERPRISE GOVERNANCE DASHBOARD ENDPOINTS
// =============================================

// Enterprise overview stats
router.get('/enterprise/overview', (req, res) => {
  console.log('[MOCK ENTERPRISE] Overview requested');
  return res.json({
    compliancePct: 0.87,
    partners: 24,
    tools: 156,
    openRisks: 3,
    timeWindow: '7d'
  });
});

// Risk heat map data
router.get('/risk/heatmap', (req, res) => {
  const { window = '7d' } = req.query;
  console.log(`[MOCK RISK] Heat map requested for window: ${window}`);
  
  const partners = ['Ogilvy Health', 'McCann Health', 'Havas Health', 'Razorfish Health', 'VMLY&R Health'];
  const categories = ['Content Gen', 'Data Analysis', 'Client Comms', 'Creative Tools', 'Research'];
  
  // Generate mock heat map data
  const matrix = [];
  partners.forEach(partner => {
    categories.forEach(category => {
      const risks = ['low', 'medium', 'high'];
      const risk = risks[Math.floor(Math.random() * risks.length)];
      matrix.push({
        partner,
        category,
        risk,
        score: Math.floor(Math.random() * 100)
      });
    });
  });
  
  return res.json({ partners, categories, matrix });
});

// Meta-Loop intelligence
router.get('/intel/metaloop/latest', (req, res) => {
  console.log('[MOCK INTEL] Meta-Loop latest requested');
  
  const phases = ['observe', 'document', 'analyze', 'recommend'];
  const currentPhase = phases[Math.floor(Math.random() * phases.length)];
  
  const recommendations = [
    {
      id: 'rec_001',
      title: 'Implement additional safeguards for creative AI tools',
      confidence: 0.94,
      rationale: 'Pattern analysis indicates 23% higher compliance when creative tools include human review checkpoints.'
    },
    {
      id: 'rec_002', 
      title: 'Update data handling protocols for McCann Health',
      confidence: 0.87,
      rationale: 'Recent audit findings suggest strengthened data governance could reduce risk exposure by 31%.'
    },
    {
      id: 'rec_003',
      title: 'Standardize approval workflows across Ogilvy Health teams',
      confidence: 0.91,
      rationale: 'Workflow inconsistencies detected. Standardization could improve throughput by 40% while maintaining compliance.'
    }
  ];
  
  const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
  
  return res.json({
    phase: currentPhase,
    recommendation: currentPhase === 'recommend' ? rec : undefined
  });
});

// Route recommendation to review
router.post('/intel/metaloop/route-to-review', (req, res) => {
  const { recommendationId } = req.body;
  console.log(`[MOCK INTEL] Routing recommendation ${recommendationId} to review`);
  
  return res.json({ 
    success: true,
    message: 'Recommendation routed to human review queue'
  });
});

// Approvals queue
router.get('/approvals', (req, res) => {
  const { partner, category } = req.query;
  console.log(`[MOCK APPROVALS] Queue requested - partner: ${partner}, category: ${category}`);
  
  const mockApprovals = [
    {
      id: 'app_001',
      item: 'GPT-4 integration for campaign copy generation',
      source: 'Ogilvy Health',
      risk: 'medium',
      status: 'needs_human',
      age: '2h ago'
    },
    {
      id: 'app_002',
      item: 'Automated sentiment analysis for social monitoring',
      source: 'McCann Health',
      risk: 'low',
      status: 'approved',
      age: '1d ago'
    },
    {
      id: 'app_003',
      item: 'AI-powered patient journey mapping tool',
      source: 'Havas Health',
      risk: 'high',
      status: 'needs_human',
      age: '30m ago'
    },
    {
      id: 'app_004',
      item: 'Claude 3.5 for regulatory document analysis',
      source: 'Razorfish Health',
      risk: 'medium',
      status: 'pending',
      age: '4h ago'
    },
    {
      id: 'app_005',
      item: 'Custom LLM for medical literature summarization',
      source: 'VMLY&R Health',
      risk: 'high',
      status: 'needs_human',
      age: '1h ago'
    }
  ];
  
  // Filter by partner/category if provided
  let filtered = mockApprovals;
  if (partner && partner !== 'all') {
    filtered = filtered.filter(a => a.source.toLowerCase().includes(partner.toLowerCase()));
  }
  
  return res.json(filtered);
});

// Bulk approval actions
router.post('/approvals/bulk', (req, res) => {
  const { action, ids } = req.body;
  console.log(`[MOCK APPROVALS] Bulk ${action} for ${ids?.length || 0} items`);
  
  return res.json({
    success: true,
    message: `Successfully ${action}ed ${ids?.length || 0} items`
  });
});

// Activity timeline
router.get('/audit/timeline', (req, res) => {
  const { window = '7d' } = req.query;
  console.log(`[MOCK AUDIT] Timeline requested for window: ${window}`);
  
  const mockEvents = [
    {
      id: 'evt_001',
      actor: 'Emma Wilson',
      label: 'Approved AI tool deployment for Ogilvy Health campaign',
      ts: '2h ago',
      tags: ['approval', 'deployment'],
      icon: 'check'
    },
    {
      id: 'evt_002',
      actor: 'System',
      label: 'Risk assessment completed for McCann Health tools',
      ts: '4h ago',
      tags: ['risk', 'automated'],
      icon: 'shield'
    },
    {
      id: 'evt_003',
      actor: 'David Lee',
      label: 'Manual review requested for high-risk AI implementation',
      ts: '6h ago',
      tags: ['review', 'high-risk'],
      icon: 'alert'
    },
    {
      id: 'evt_004',
      actor: 'Sarah Johnson',
      label: 'Policy update deployed across Havas Health teams',
      ts: '1d ago',
      tags: ['policy', 'deployment'],
      icon: 'document'
    },
    {
      id: 'evt_005',
      actor: 'Meta-Loop',
      label: 'Pattern detected: Creative AI tools require additional oversight',
      ts: '1d ago',
      tags: ['intelligence', 'pattern'],
      icon: 'brain'
    },
    {
      id: 'evt_006',
      actor: 'Mike Chen',
      label: 'Compliance audit initiated for Razorfish Health',
      ts: '2d ago',
      tags: ['audit', 'compliance'],
      icon: 'clipboard'
    }
  ];
  
  return res.json(mockEvents);
});

// Partner health metrics
router.get('/partners/health', (req, res) => {
  const { window = '7d' } = req.query;
  console.log(`[MOCK PARTNERS] Health metrics requested for window: ${window}`);
  
  const mockHealth = [
    {
      partner: 'Ogilvy Health',
      compliancePct: 0.94,
      openItems: 2,
      series: [88, 91, 89, 94, 92, 96, 94] // 7-day trend
    },
    {
      partner: 'McCann Health',
      compliancePct: 0.87,
      openItems: 5,
      series: [82, 85, 88, 87, 89, 86, 87]
    },
    {
      partner: 'Havas Health',
      compliancePct: 0.91,
      openItems: 3,
      series: [89, 90, 92, 88, 91, 93, 91]
    },
    {
      partner: 'Razorfish Health',
      compliancePct: 0.83,
      openItems: 7,
      series: [78, 81, 85, 83, 84, 82, 83]
    },
    {
      partner: 'VMLY&R Health',
      compliancePct: 0.89,
      openItems: 4,
      series: [86, 88, 87, 89, 90, 88, 89]
    }
  ];
  
  return res.json(mockHealth);
});

// Debug endpoint for development
router.get('/debug/status', (req, res) => {
  return res.json({
    mode: 'mock',
    timestamp: new Date().toISOString(),
    endpoints: [
      // Authentication
      'POST /api/auth/signin',
      'GET /api/auth/session', 
      'POST /api/auth/logout',
      'POST /api/org/create',
      'POST /api/org/request-access',
      'GET /api/oauth/start/:provider',
      'GET /api/saml/start',
      'POST /api/analytics/track',
      // Enterprise Dashboard
      'GET /api/enterprise/overview',
      'GET /api/risk/heatmap',
      'GET /api/intel/metaloop/latest',
      'POST /api/intel/metaloop/route-to-review',
      'GET /api/approvals',
      'POST /api/approvals/bulk',
      'GET /api/audit/timeline',
      'GET /api/partners/health'
    ]
  });
});

// ---------- Tools Submission API ----------
const toolsRouter = require('./tools.mock.routes');
router.use('/tools', toolsRouter);

module.exports = router;
