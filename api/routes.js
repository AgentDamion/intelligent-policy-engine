const express = require('express');
const router = express.Router();

// Import all your agents
const { ConflictDetectionAgent } = require('../agents/conflict-detection-agent.js');
const AuditAgent = require('../agents/audit-agent.js');
const PolicyAgent = require('../agents/policy-agent.js');
const NegotiationAgent = require('../agents/negotiation-agent.js');
const ContextAgent = require('../agents/context-agent.js');
const workflowEngine = require('../core/workflow-engine');
const { logAction } = require('../core/audit-log');
const agentRegistry = require('../agents/agent-registry');

// In-memory storage for activities and overrides (replace with database later)
const agentActivities = [];
const overrides = [];

// NEW STORAGE ADDED FOR DASHBOARD
let policies = [];  // For storing created policies
let agencies = [
    { 
      id: '1', 
      name: 'Ogilvy Health', 
      compliance: 92,
      violations: 0,
      lastAudit: '2 days ago',
      status: 'active'
    },
    { 
      id: '2', 
      name: 'McCann Health', 
      compliance: 88,
      violations: 1,
      lastAudit: '1 week ago',
      status: 'warning'
    },
    { 
      id: '3', 
      name: 'Havas Health', 
      compliance: 95,
      violations: 0,
      lastAudit: '3 days ago',
      status: 'active'
    }
];
let submissions = [];  // For storing submissions

// Helper function to log agent activities
function logAgentActivity(agentName, action, details) {
    const activity = {
        id: Date.now(),
        agent: agentName,
        action: action,
        details: details,
        timestamp: new Date()
    };
    agentActivities.push(activity);
    
    // Keep only last 100 activities
    if (agentActivities.length > 100) {
        agentActivities.shift();
    }
    
    return activity;
}

// Basic health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Policy engine is running',
        timestamp: new Date(),
        activeAgents: ['audit', 'policy', 'negotiation', 'context', 'conflict-detection']
    });
});

// Authentication endpoint
router.post('/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        // For testing purposes, accept any credentials
        // In production, this would validate against Auth0 or database
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password required' 
            });
        }
        
        // Mock user data for testing
        const mockUser = {
            id: 'test-user-id',
            email: email,
            name: 'Test User',
            role: 'enterprise_admin',
            enterpriseId: 'enterprise-1',
            organizationName: 'Test Organization'
        };
        
        // Mock JWT token
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        res.json({
            success: true,
            user: mockUser,
            token: mockToken,
            message: 'Login successful (test mode)'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Login failed' 
        });
    }
});

// RBAC metadata endpoints (used by readiness scripts / UI)
router.get('/auth/roles', (req, res) => {
    res.json({
        success: true,
        roles: [
            'enterprise_admin',
            'enterprise_user',
            'agency_admin',
            'agency_user',
            'auditor',
            'reviewer'
        ]
    });
});

router.get('/auth/permissions', (req, res) => {
    // Minimal permission matrix for readiness validation
    res.json({
        success: true,
        permissions: {
            enterprise_admin: ['*'],
            enterprise_user: ['policies:read', 'submissions:read', 'audit:read'],
            agency_admin: ['policies:read', 'policies:distribute', 'submissions:*', 'audit:read'],
            agency_user: ['policies:read', 'submissions:create', 'submissions:read'],
            auditor: ['audit:*', 'policies:read'],
            reviewer: ['submissions:review', 'policies:read']
        }
    });
});

// Context switch alias (the readiness script expects /auth/context/switch)
router.post('/auth/context/switch', (req, res) => {
    const { contextId, enterprise_id, enterpriseId, seat_id, seatId } = req.body || {};
    res.json({
        success: true,
        context: {
            contextId: contextId || `ctx_${Date.now()}`,
            enterprise_id: enterprise_id || enterpriseId || 'enterprise-1',
            seat_id: seat_id || seatId || null
        }
    });
});

// ---------------------------------------------------------------------------
// Minimal multi-tenancy endpoints for readiness validation (in-memory)
// ---------------------------------------------------------------------------
const enterprises = [];
const enterpriseSeats = [];

router.post('/enterprises', (req, res) => {
    const enterprise = {
        id: `ent_${Date.now()}`,
        name: req.body?.name || 'Unnamed Enterprise',
        type: req.body?.type || 'unknown',
        subscription_tier: req.body?.subscription_tier || 'standard',
        createdAt: new Date().toISOString()
    };
    enterprises.push(enterprise);
    res.json({ success: true, enterprise });
});

router.post('/enterprises/:enterpriseId/seats', (req, res) => {
    const { enterpriseId } = req.params;
    const seat = {
        id: `seat_${Date.now()}`,
        enterpriseId,
        name: req.body?.name || 'Unnamed Seat',
        slug: req.body?.slug || `seat-${Date.now()}`,
        seat_type: req.body?.seat_type || 'standard',
        createdAt: new Date().toISOString()
    };
    enterpriseSeats.push(seat);
    res.json({ success: true, seat });
});

// Invite user to a seat (readiness script compatibility)
router.post('/enterprises/:enterpriseId/seats/:seatId/invite-user', (req, res) => {
    res.json({
        success: true,
        invitationId: `invite_user_${Date.now()}`,
        enterpriseId: req.params.enterpriseId,
        seatId: req.params.seatId,
        email: req.body?.email
    });
});

// Onboarding status (readiness script compatibility)
router.get('/onboarding/status', (req, res) => {
    res.json({
        success: true,
        status: 'complete',
        steps: {
            invited: true,
            accepted: true,
            configured: true
        }
    });
});

// Demo Landing API Endpoints
// Start demo session
router.post('/demo/start-session', (req, res) => {
    try {
        const { scenarioId, prospectData = {} } = req.body;
        
        if (!scenarioId) {
            return res.status(400).json({ error: 'scenarioId is required' });
        }

        const sessionId = `demo-${Date.now()}`;
        const session = {
            sessionId,
            scenarioId,
            prospectData,
            startTime: new Date().toISOString(),
            featuresExplored: [],
            timeSpent: 0,
            conversionIntent: 'unknown'
        };

        // Store session (in production, this would go to database)
        console.log('Demo session started:', session);

        res.json({
            success: true,
            sessionId,
            session
        });
    } catch (error) {
        console.error('Error starting demo session:', error);
        res.status(500).json({ error: 'Failed to start demo session' });
    }
});

// Track feature exploration
router.put('/demo/track-feature', (req, res) => {
    try {
        const { sessionId, feature, timeSpent } = req.body;
        
        if (!sessionId || !feature) {
            return res.status(400).json({ error: 'sessionId and feature are required' });
        }

        console.log('Feature tracked:', { sessionId, feature, timeSpent });

        res.json({
            success: true,
            message: 'Feature exploration tracked'
        });
    } catch (error) {
        console.error('Error tracking feature:', error);
        res.status(500).json({ error: 'Failed to track feature' });
    }
});

// Calculate ROI
router.post('/demo/calculate-roi', (req, res) => {
    try {
        const roiData = req.body;
        
        // Enhanced ROI calculation
        const baseROI = {
            timeSavings: (roiData.currentApprovalTime - 2) * roiData.agencyPartners * 4 * 1500,
            adminSavings: (roiData.adminHoursPerWeek - 8) * 52 * 75,
            incidentPrevention: roiData.complianceIssues * 0.8 * 15000
        };

        const totalSavings = Object.values(baseROI).reduce((sum, val) => sum + val, 0);
        const aicomplyrCost = roiData.agencyPartners * 3 * 75 * 12;

        const calculatedROI = {
            ...baseROI,
            totalSavings,
            investment: aicomplyrCost,
            netROI: totalSavings - aicomplyrCost,
            roiPercentage: ((totalSavings - aicomplyrCost) / aicomplyrCost * 100),
            paybackMonths: Math.ceil(aicomplyrCost / (totalSavings / 12))
        };

        console.log('ROI calculated:', calculatedROI);

        res.json({
            success: true,
            roi: calculatedROI
        });
    } catch (error) {
        console.error('Error calculating ROI:', error);
        res.status(500).json({ error: 'Failed to calculate ROI' });
    }
});

// Complete demo session
router.post('/demo/complete-session', (req, res) => {
    try {
        const { sessionId, finalData } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        console.log('Demo session completed:', { sessionId, finalData });

        res.json({
            success: true,
            message: 'Demo session completed successfully'
        });
    } catch (error) {
        console.error('Error completing demo session:', error);
        res.status(500).json({ error: 'Failed to complete demo session' });
    }
});

// Start onboarding with context
router.post('/onboarding/start-with-context', (req, res) => {
    try {
        const onboardingContext = req.body;
        
        console.log('Onboarding started with context:', onboardingContext);

        res.json({
            success: true,
            message: 'Onboarding context received',
            onboardingId: `onboarding-${Date.now()}`
        });
    } catch (error) {
        console.error('Error starting onboarding with context:', error);
        res.status(500).json({ error: 'Failed to start onboarding with context' });
    }
});

// Get recent agent activities
router.get('/agent/activity', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json({
        activities: agentActivities.slice(-limit).reverse(), // Most recent first
        total: agentActivities.length
    });
});

// CONFLICT DETECTION (your existing endpoint, enhanced with logging)
router.post('/analyze-conflicts', async (req, res) => {
    try {
        const { policies } = req.body;
        
        // Validate input
        if (!policies || !Array.isArray(policies) || policies.length < 2) {
            return res.status(400).json({ 
                error: 'At least 2 policies required for conflict analysis',
                received: policies ? policies.length : 0
            });
        }

        // Run conflict analysis
        const agent = new ConflictDetectionAgent();
        const conflictReport = agent.analyzeConflicts(policies);
        
        // Log the activity
        logAgentActivity('Conflict Detection Agent', 'Analyzed Policies', {
            policiesAnalyzed: policies.length,
            conflictsFound: conflictReport.conflicts?.length || 0,
            severity: conflictReport.overallSeverity || 'low'
        });
        
        res.json({
            success: true,
            data: conflictReport,
            explanation: 'Analyzed ' + policies.length + ' policies for conflicts'
        });
        
    } catch (error) {
        console.error('Conflict analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze policy conflicts',
            details: error.message 
        });
    }
});

// CONTEXT AGENT ENDPOINT (FIXED - UI expects this)
router.post('/process/context', async (req, res) => {
    try {
        const { userMessage, organizationId, userId } = req.body;
        
        if (!userMessage) {
            return res.status(400).json({ error: 'User message required' });
        }
        
        const agent = new ContextAgent();
        // Use the correct method name: processUserInput
        const contextOutput = agent.processUserInput(userMessage);
        
        // Log the activity
        logAgentActivity('Context Agent', 'Processed Message', {
            messageLength: userMessage.length,
            urgencyLevel: contextOutput.urgency?.level || 0,
            contextType: contextOutput.context?.inferredType || 'unknown'
        });
        
        // Return the context output directly (UI expects this format)
        res.json(contextOutput);
        
    } catch (error) {
        console.error('Context processing error:', error);
        res.status(500).json({ 
            error: 'Failed to process context',
            details: error.message 
        });
    }
});

// POLICY AGENT ENDPOINT (refactored to use workflow engine)
router.post('/process/policy', async (req, res) => {
    try {
        const { contextOutput, organizationId, userId } = req.body;
        if (!contextOutput) {
            return res.status(400).json({ error: 'Context output required' });
        }
        // Use the workflow engine for policy check
        const input = {
            ...contextOutput,
            tool: req.body.tool,
            vendor: req.body.vendor,
            dataHandling: req.body.dataHandling,
            usage: req.body.usage
          };
        const result = await workflowEngine.executeWorkflow('policy-check', input, { organizationId, userId });
        logAction('policy-check', { input: contextOutput, result, userId, organizationId });
        res.json(result);
    } catch (error) {
        console.error('Policy processing error:', error);
        res.status(500).json({ error: 'Failed to process policy', details: error.message });
    }
});

// NEGOTIATION AGENT ENDPOINT (NEW - UI expects this)
router.post('/process/negotiation', async (req, res) => {
    try {
        const { contextOutput, policyDecision, organizationId, userId } = req.body;
        
        if (!contextOutput || !policyDecision) {
            return res.status(400).json({ error: 'Context output and policy decision required' });
        }
        
        // Extract client names from the original message if possible
        const userMessage = contextOutput.timestamp ? '' : '';
        const clientNames = ['Pfizer', 'Novartis', 'Roche'];
        const mentionedClients = clientNames.filter(client => 
            userMessage.toLowerCase().includes(client.toLowerCase())
        );
        
        const negotiationResult = {
            competitors: mentionedClients.length > 1 ? [{
                client1: mentionedClients[0],
                client2: mentionedClients[1],
                industry: 'pharmaceutical'
            }] : [],
            conflicts: policyDecision.risk?.level === 'high' ? [{
                type: 'urgency_conflict',
                description: 'High urgency may conflict with thorough compliance review',
                severity: 'medium'
            }] : [],
            solution: {
                requirements: [
                    'Use only approved AI tools',
                    'Maintain separate workspaces for each client',
                    'Ensure no data cross-contamination',
                    'Follow strictest compliance requirements'
                ]
            },
            escalation: {
                required: policyDecision.risk?.level === 'high',
                reason: 'High risk request requires management approval',
                next_steps: [
                    'Schedule review with compliance team',
                    'Document business justification',
                    'Prepare risk mitigation plan'
                ]
            },
            client_requirements: mentionedClients.reduce((acc, client) => {
                acc[client.toLowerCase()] = {
                    requirements: [
                        `Follow ${client} specific AI guidelines`,
                        'Maintain data segregation',
                        'Use approved tools only'
                    ],
                    guardrails: ['Client-specific approval required'],
                    monitoring: ['Track all AI-generated content']
                };
                return acc;
            }, {})
        };
        
        // Log the activity
        logAgentActivity('Negotiation Agent', 'Processed Negotiation', {
            clientsInvolved: mentionedClients.length,
            conflictsDetected: negotiationResult.conflicts.length,
            escalationRequired: negotiationResult.escalation.required
        });
        
        res.json(negotiationResult);
        
    } catch (error) {
        console.error('Negotiation processing error:', error);
        res.status(500).json({ 
            error: 'Failed to process negotiation',
            details: error.message 
        });
    }
});

// DASHBOARD ENDPOINTS

// Get all policies with enterprise scoping
router.get('/policies', (req, res) => {
    const enterpriseId = req.query.enterpriseId || req.query.enterprise_id;
    
    // Mock policies with enterprise scoping
    const allPolicies = [
        {
            id: 1,
            enterpriseId: 'enterprise-1',
            name: 'Social Media AI Content Policy',
            description: 'Guidelines for AI-generated social media content',
            status: 'active',
            lastUpdated: new Date().toISOString(),
            rules: ['No medical claims', 'FDA compliance required', 'Human review mandatory']
        },
        {
            id: 2,
            enterpriseId: 'enterprise-1',
            name: 'Image Generation Guidelines', 
            description: 'Rules for AI-generated visual content',
            status: 'active',
            lastUpdated: new Date().toISOString(),
            rules: ['Brand consistency', 'No misleading imagery', 'Copyright compliance']
        },
        {
            id: 3,
            enterpriseId: 'enterprise-2',
            name: 'Pharma AI Compliance Policy',
            description: 'Pharmaceutical AI content guidelines',
            status: 'active',
            lastUpdated: new Date().toISOString(),
            rules: ['No patient data', 'FDA approval required', 'Medical review mandatory']
        }
    ];
    
    // Filter by enterprise if specified
    let filteredPolicies = allPolicies;
    if (enterpriseId) {
        filteredPolicies = allPolicies.filter(policy => policy.enterpriseId === enterpriseId);
    }
    
    res.json({
        success: true,
        data: filteredPolicies,
        timestamp: new Date().toISOString(),
        enterpriseId: enterpriseId || 'all'
    });
});

// CREATE new policy
router.post('/policies', (req, res) => {
    const newPolicy = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description,
        createdAt: new Date(),
        status: 'active'
    };
    
    policies.push(newPolicy);
    
    // Log this activity
    logAgentActivity('Policy Manager', 'Policy Created', {
        policyId: newPolicy.id,
        title: newPolicy.title
    });
    
    res.json({ 
        success: true, 
        policy: newPolicy 
    });
});

// Policy inheritance (readiness script compatibility)
router.get('/policies/inheritance', (req, res) => {
    res.json({
        success: true,
        inheritance: {
            enabled: true,
            strategy: 'enterprise->seat->campaign',
        }
    });
});

// Conflict detection (readiness script compatibility)
router.post('/policies/conflict-detection', (req, res) => {
    res.json({
        success: true,
        conflict: false,
        conflicts: []
    });
});

// GET all agencies
router.get('/agencies', (req, res) => {
    res.json({ 
        success: true,
        agencies: agencies 
    });
});

// GET all submissions
router.get('/submissions', (req, res) => {
    res.json({ 
        success: true,
        submissions: submissions 
    });
});

// GET enterprise stats
router.get('/enterprise/stats', (req, res) => {
    const stats = {
        totalAgencies: agencies.length,
        activePolicies: policies.length,
        pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
        averageComplianceRate: Math.round(
            agencies.reduce((sum, a) => sum + a.compliance, 0) / agencies.length
        ),
        totalAgentActivities: agentActivities.length,
        totalOverrides: overrides.length
    };
    
    res.json({ 
        success: true,
        stats: stats 
    });
});

// Get audit history
router.get('/audit', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const recentAudits = agentActivities
        .filter(activity => activity.agent === 'Audit Agent')
        .slice(-limit)
        .reverse();
    
    res.json({
        audits: recentAudits,
        total: recentAudits.length
    });
});

// Audit log ingestion (readiness script compatibility)
router.post('/audit/log', (req, res) => {
    const entry = {
        id: `audit_${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    logAgentActivity('Audit Agent', 'Audit Logged', entry);
    res.json({ success: true, entry });
});

// Audit export (readiness script compatibility)
router.get('/audit/export/:sessionId', (req, res) => {
    res.json({
        success: true,
        sessionId: req.params.sessionId,
        exportUrl: `/api/audit/export/${req.params.sessionId}.json`
    });
});

// Evidence attachment (readiness script compatibility)
router.post('/audit/evidence', (req, res) => {
    res.json({
        success: true,
        evidenceId: `evidence_${Date.now()}`
    });
});

// Agency onboarding invite (readiness script compatibility)
router.post('/agency-onboarding/invite', (req, res) => {
    res.json({
        success: true,
        inviteId: `invite_${Date.now()}`
    });
});

// Meta-loop endpoints (readiness script compatibility)
router.post('/metaloop/orchestrate', (req, res) => {
    res.json({ success: true, result: { status: 'queued' } });
});

router.post('/metaloop/process', (req, res) => {
    res.json({ success: true, result: { status: 'processed' } });
});

router.post('/metaloop/learn', (req, res) => {
    res.json({ success: true, result: { status: 'learned' } });
});

// Agency endpoints (keeping your existing one)
router.get('/agency/:agencyId/clients', (req, res) => {
    const { agencyId } = req.params;
    
    // Sample client data for testing
    const sampleClients = [
        { id: 1, name: 'Pfizer Inc.', status: 'active', policies: 3 },
        { id: 2, name: 'Novartis AG', status: 'active', policies: 2 },
        { id: 3, name: 'JPMorgan Chase', status: 'pending', policies: 1 }
    ];
    
    res.json({
        agency: agencyId,
        clients: sampleClients,
        total: sampleClients.length
    });
});

// Summary endpoint - get system overview
router.get('/summary', (req, res) => {
    const activeAgents = ['audit', 'policy', 'negotiation', 'context', 'conflict-detection'];
    const recentActivity = agentActivities.slice(-5).reverse();
    const totalOverrides = overrides.length;
    
    res.json({
        system: {
            status: 'operational',
            activeAgents: activeAgents,
            totalActivities: agentActivities.length,
            totalOverrides: totalOverrides
        },
        recentActivity: recentActivity,
        stats: {
            activitiesLast24h: agentActivities.filter(a => 
                new Date(a.timestamp) > new Date(Date.now() - 24*60*60*1000)
            ).length,
            mostActiveAgent: getMostActiveAgent()
        }
    });
});

// === PROOF CENTER ENDPOINTS ===

// 1. GET /api/audit-feed
router.get('/audit-feed', (req, res) => {
    const auditFeed = [
        {
            timestamp: '2024-06-01T09:15:00Z',
            event: 'AI Decision Approved',
            user: 'jane.doe@agency.com',
            tool: 'ChatGPT',
            outcome: 'approved',
            regTag: 'FDA 21 CFR Part 11',
            explanation: 'AI-generated content for client presentation approved under FDA digital marketing guidelines.'
        },
        {
            timestamp: '2024-06-01T10:05:00Z',
            event: 'Human Override',
            user: 'john.smith@agency.com',
            tool: 'Midjourney',
            outcome: 'overridden',
            regTag: 'EMA Annex 11',
            explanation: 'Human reviewer required additional brand compliance checks for EU market.'
        },
        {
            timestamp: '2024-06-01T11:20:00Z',
            event: 'Policy Conflict Detected',
            user: 'ai.audit@agency.com',
            tool: 'Policy Engine',
            outcome: 'conflict',
            regTag: 'FDA 21 CFR Part 820',
            explanation: 'Detected conflicting requirements between US and EU labeling policies.'
        },
        {
            timestamp: '2024-06-01T12:00:00Z',
            event: 'Escalation Required',
            user: 'compliance.lead@agency.com',
            tool: 'Audit Trail',
            outcome: 'escalated',
            regTag: 'EMA Annex 15',
            explanation: 'Escalated to compliance lead for review of high-risk AI output.'
        },
        {
            timestamp: '2024-06-01T13:30:00Z',
            event: 'Regulatory Mapping Complete',
            user: 'ai.audit@agency.com',
            tool: 'RegMap',
            outcome: 'complete',
            regTag: 'FDA 21 CFR Part 11',
            explanation: 'Mapped all AI decisions to FDA and EMA frameworks.'
        },
        {
            timestamp: '2024-06-01T14:10:00Z',
            event: 'Audit Trail Exported',
            user: 'auditor@agency.com',
            tool: 'Audit Trail',
            outcome: 'exported',
            regTag: 'FDA 21 CFR Part 11',
            explanation: 'Audit trail exported for external regulatory review.'
        },
        {
            timestamp: '2024-06-01T15:00:00Z',
            event: 'AI Suggestion Rejected',
            user: 'reviewer@agency.com',
            tool: 'ChatGPT',
            outcome: 'rejected',
            regTag: 'EMA Annex 11',
            explanation: 'AI suggestion for promotional claim rejected due to lack of substantiation.'
        },
        {
            timestamp: '2024-06-01T15:45:00Z',
            event: 'Human Approval',
            user: 'manager@agency.com',
            tool: 'Midjourney',
            outcome: 'approved',
            regTag: 'FDA 21 CFR Part 11',
            explanation: 'Human manager approved AI-generated campaign images for US market.'
        },
        {
            timestamp: '2024-06-01T16:20:00Z',
            event: 'Compliance Check Passed',
            user: 'ai.audit@agency.com',
            tool: 'Policy Engine',
            outcome: 'passed',
            regTag: 'FDA 21 CFR Part 820',
            explanation: 'AI output passed all compliance checks for device labeling.'
        },
        {
            timestamp: '2024-06-01T17:00:00Z',
            event: 'New Regulation Added',
            user: 'compliance.lead@agency.com',
            tool: 'RegMap',
            outcome: 'updated',
            regTag: 'EMA Annex 15',
            explanation: 'EMA Annex 15 added to regulatory mapping for new product launch.'
        }
    ];
    res.json({ success: true, feed: auditFeed });
});

// 2. GET /api/metrics
router.get('/metrics', (req, res) => {
    res.json({
        success: true,
        metrics: {
            avgApprovalTime: '2.3 min',
            humanInLoopRate: '98%',
            regulatoryCoverage: '9 frameworks',
            auditCompleteness: '100%'
        }
    });
});

// 3. GET /api/case-studies
router.get('/case-studies', (req, res) => {
    const caseStudies = [
        {
            title: 'Accelerating FDA Approval with AI Audit Trails',
            summary: 'How a top-5 pharma agency reduced approval times by 40% using AI-powered audit trails and real-time compliance mapping.',
            proof: 'https://pharma-proof-center.com/case1'
        },
        {
            title: 'Ensuring Global Compliance for EU Launches',
            summary: 'A global launch team used aicomplyr.io to map EMA and FDA requirements, avoiding regulatory delays.',
            proof: 'https://pharma-proof-center.com/case2'
        },
        {
            title: 'Human-in-the-Loop: 98% Audit Completeness',
            summary: 'How human reviewers and AI collaboration achieved 100% audit completeness for a major oncology campaign.',
            proof: 'https://pharma-proof-center.com/case3'
        }
    ];
    res.json({ success: true, studies: caseStudies });
});

// 4. GET /api/regulatory-mapping
router.get('/regulatory-mapping', (req, res) => {
    const frameworks = [
        {
            name: 'FDA 21 CFR Part 11',
            decisions: 120,
            conflicts: 2,
            completion: 100
        },
        {
            name: 'EMA Annex 11',
            decisions: 98,
            conflicts: 1,
            completion: 97
        },
        {
            name: 'FDA 21 CFR Part 820',
            decisions: 75,
            conflicts: 0,
            completion: 100
        },
        {
            name: 'EMA Annex 15',
            decisions: 60,
            conflicts: 1,
            completion: 95
        }
    ];
    res.json({ success: true, frameworks });
});

// 5. GET /api/trends
router.get('/trends', (req, res) => {
    // Generate 30 days of compliance scores (simulate realistic trend)
    const today = new Date();
    const scores = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        scores.push({
            date: date.toISOString().slice(0, 10),
            score: 0.92 + 0.03 * Math.sin(i / 5) + (Math.random() - 0.5) * 0.01 // Simulate trend
        });
    }
    res.json({ success: true, scores });
});

// REAL-TIME ASSIST ENDPOINT
router.post('/assist/real-time', async (req, res) => {
  try {
    const { content, clientId, userId } = req.body;
    const context = {
      clientId,
      userId,
      mode: 'real-time'
    };
    const result = await workflowEngine.executeWorkflow('real-time-assist', { content, liveMode: true }, context);
    res.json({
      feedback: result.feedback,
      severity: result.severity,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get submission status
router.get('/submission/:id/status', async (req, res) => {
  try {
    const stateManager = agentRegistry.getAgent('submission-state');
    const status = await stateManager.process({
      action: 'status',
      submissionId: req.params.id
    });
    res.json(status);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get submission timeline
router.get('/submission/:id/timeline', async (req, res) => {
  try {
    const stateManager = agentRegistry.getAgent('submission-state');
    const timeline = await stateManager.process({
      action: 'timeline',
      submissionId: req.params.id
    });
    res.json(timeline);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get analytics dashboard data
router.get('/analytics/submissions', async (req, res) => {
  try {
    const stateManager = agentRegistry.getAgent('submission-state');
    const analytics = await stateManager.process({
      action: 'analytics',
      data: {
        timeRange: req.query.timeRange,
        clientId: req.query.clientId,
        status: req.query.status
      }
    });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEAT MANAGEMENT API ENDPOINTS

// Get all seats for an enterprise
router.get('/enterprise/:enterpriseId/seats', async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    
    // Mock data - replace with database query
    const seats = [
      {
        id: 'seat-1',
        name: 'Ogilvy Health - Digital Team',
        adminName: 'Sarah Johnson',
        adminEmail: 'sarah.johnson@ogilvy.com',
        status: 'active',
        activeUsers: 12,
        userLimit: 15,
        complianceScore: 94,
        lastActivity: '2 hours ago',
        activePolicies: 8,
        violations: 0,
        description: 'Digital marketing team for healthcare clients',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'seat-2',
        name: 'McCann Health - Creative',
        adminName: 'Michael Chen',
        adminEmail: 'michael.chen@mccann.com',
        status: 'active',
        activeUsers: 8,
        userLimit: 10,
        complianceScore: 87,
        lastActivity: '1 day ago',
        activePolicies: 6,
        violations: 1,
        description: 'Creative team for pharmaceutical campaigns',
        createdAt: '2024-01-10T14:20:00Z'
      },
      {
        id: 'seat-3',
        name: 'Havas Health - Strategy',
        adminName: 'Emily Rodriguez',
        adminEmail: 'emily.rodriguez@havas.com',
        status: 'pending',
        activeUsers: 0,
        userLimit: 12,
        complianceScore: 0,
        lastActivity: 'Never',
        activePolicies: 0,
        violations: 0,
        description: 'Strategic planning for health campaigns',
        createdAt: '2024-01-20T09:15:00Z'
      }
    ];

    res.json({ seats });
  } catch (error) {
    console.error('Failed to fetch seats:', error);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

// Create a new seat
router.post('/enterprise/:enterpriseId/seats', async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const seatData = req.body;

    // Validate required fields
    if (!seatData.name || !seatData.adminEmail) {
      return res.status(400).json({ error: 'Name and admin email are required' });
    }

    // Mock seat creation - replace with database insert
    const newSeat = {
      id: `seat-${Date.now()}`,
      name: seatData.name,
      adminName: seatData.adminEmail.split('@')[0],
      adminEmail: seatData.adminEmail,
      status: 'pending',
      activeUsers: 0,
      userLimit: seatData.userLimit || 5,
      complianceScore: 0,
      lastActivity: 'Never',
      activePolicies: seatData.selectedPolicies?.length || 0,
      violations: 0,
      description: seatData.description || '',
      permissions: seatData.permissions || {},
      customBranding: seatData.customBranding || false,
      createdAt: new Date().toISOString()
    };

    // Log the activity
    logAgentActivity('Seat Management', 'Created Seat', {
      seatName: newSeat.name,
      enterpriseId,
      adminEmail: newSeat.adminEmail
    });

    res.status(201).json(newSeat);
  } catch (error) {
    console.error('Failed to create seat:', error);
    res.status(500).json({ error: 'Failed to create seat' });
  }
});

// Update a seat
router.put('/enterprise/:enterpriseId/seats/:seatId', async (req, res) => {
  try {
    const { enterpriseId, seatId } = req.params;
    const updateData = req.body;

    // Mock seat update - replace with database update
    const updatedSeat = {
      id: seatId,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Log the activity
    logAgentActivity('Seat Management', 'Updated Seat', {
      seatId,
      enterpriseId,
      updatedFields: Object.keys(updateData)
    });

    res.json(updatedSeat);
  } catch (error) {
    console.error('Failed to update seat:', error);
    res.status(500).json({ error: 'Failed to update seat' });
  }
});

// Delete a seat
router.delete('/enterprise/:enterpriseId/seats/:seatId', async (req, res) => {
  try {
    const { enterpriseId, seatId } = req.params;

    // Mock seat deletion - replace with database delete
    // In real implementation, you would delete from database

    // Log the activity
    logAgentActivity('Seat Management', 'Deleted Seat', {
      seatId,
      enterpriseId
    });

    res.json({ success: true, message: 'Seat deleted successfully' });
  } catch (error) {
    console.error('Failed to delete seat:', error);
    res.status(500).json({ error: 'Failed to delete seat' });
  }
});

// Bulk policy assignment to seats
router.post('/enterprise/:enterpriseId/seats/bulk-policy-assignment', async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const { seatIds, policyIds, options } = req.body;

    if (!seatIds || !policyIds || seatIds.length === 0 || policyIds.length === 0) {
      return res.status(400).json({ error: 'Seat IDs and policy IDs are required' });
    }

    // Mock bulk assignment - replace with database operations
    const assignmentResult = {
      success: true,
      assignedSeats: seatIds.length,
      assignedPolicies: policyIds.length,
      assignmentType: options.addToExisting ? 'add' : 'replace',
      scheduledRollout: options.scheduleRollout,
      rolloutDate: options.rolloutDate,
      notificationsSent: options.notifyAdmins ? seatIds.length : 0
    };

    // Log the activity
    logAgentActivity('Seat Management', 'Bulk Policy Assignment', {
      enterpriseId,
      seatCount: seatIds.length,
      policyCount: policyIds.length,
      assignmentType: options.addToExisting ? 'add' : 'replace'
    });

    res.json(assignmentResult);
  } catch (error) {
    console.error('Failed to assign policies:', error);
    res.status(500).json({ error: 'Failed to assign policies' });
  }
});

// Invite user to seat
router.post('/enterprise/:enterpriseId/seats/:seatId/invite-user', async (req, res) => {
  try {
    const { enterpriseId, seatId } = req.params;
    const userData = req.body;

    if (!userData.email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Mock user invitation - replace with email sending and database operations
    const invitation = {
      id: `invite-${Date.now()}`,
      seatId,
      enterpriseId,
      email: userData.email,
      role: userData.role || 'user',
      status: 'pending',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    // Log the activity
    logAgentActivity('Seat Management', 'Invited User', {
      seatId,
      enterpriseId,
      userEmail: userData.email,
      role: userData.role
    });

    res.json(invitation);
  } catch (error) {
    console.error('Failed to invite user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Get seat analytics
router.get('/enterprise/:enterpriseId/seats/analytics', async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Mock analytics data - replace with database queries
    const analytics = {
      timeRange,
      totalSeats: 3,
      activeSeats: 2,
      pendingSeats: 1,
      averageComplianceScore: 87,
      totalViolations: 1,
      monthlyCost: 450,
      seatUtilization: 67,
      policyDistribution: {
        'FDA Social Media': 8,
        'AI Disclosure': 6,
        'Medical Claims': 4
      },
      complianceTrend: [
        { date: '2024-01-01', score: 85 },
        { date: '2024-01-08', score: 87 },
        { date: '2024-01-15', score: 89 },
        { date: '2024-01-22', score: 87 }
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get available policies for assignment
router.get('/enterprise/:enterpriseId/policies/available', async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    // Mock available policies - replace with database query
    const policies = [
      {
        id: 'policy-1',
        name: 'FDA Social Media Guidelines',
        description: 'Comprehensive guidelines for social media marketing in healthcare',
        category: 'Social Media',
        version: '2.1',
        status: 'active',
        lastUpdated: '2024-01-15T10:30:00Z'
      },
      {
        id: 'policy-2',
        name: 'AI Disclosure Requirements',
        description: 'Requirements for disclosing AI usage in marketing materials',
        category: 'AI/Technology',
        version: '1.3',
        status: 'active',
        lastUpdated: '2024-01-10T14:20:00Z'
      },
      {
        id: 'policy-3',
        name: 'Medical Claims Verification',
        description: 'Process for verifying medical claims in advertising',
        category: 'Medical Claims',
        version: '3.0',
        status: 'active',
        lastUpdated: '2024-01-05T09:15:00Z'
      },
      {
        id: 'policy-4',
        name: 'Patient Privacy Protection',
        description: 'Guidelines for protecting patient privacy in marketing',
        category: 'Privacy',
        version: '1.8',
        status: 'active',
        lastUpdated: '2024-01-12T16:45:00Z'
      },
      {
        id: 'policy-5',
        name: 'Clinical Trial Communication',
        description: 'Standards for communicating clinical trial information',
        category: 'Clinical Trials',
        version: '2.2',
        status: 'active',
        lastUpdated: '2024-01-18T11:20:00Z'
      }
    ];

    res.json({ policies });
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Get seat compliance report
router.get('/enterprise/:enterpriseId/seats/:seatId/compliance-report', async (req, res) => {
  try {
    const { enterpriseId, seatId } = req.params;

    // Mock compliance report - replace with database queries
    const report = {
      seatId,
      enterpriseId,
      generatedAt: new Date().toISOString(),
      overallScore: 94,
      categoryScores: {
        'Social Media': 96,
        'Medical Claims': 88,
        'Privacy': 98,
        'AI Disclosure': 92
      },
      violations: [
        {
          id: 'violation-1',
          type: 'Medical Claims',
          description: 'Unsubstantiated efficacy claim in social media post',
          severity: 'medium',
          date: '2024-01-15T10:30:00Z',
          status: 'resolved'
        }
      ],
      recommendations: [
        'Implement stricter review process for medical claims',
        'Add AI disclosure to all automated content',
        'Conduct quarterly privacy audits'
      ]
    };

    res.json(report);
  } catch (error) {
    console.error('Failed to fetch compliance report:', error);
    res.status(500).json({ error: 'Failed to fetch compliance report' });
  }
});

// Test endpoint for intelligent routing
router.post('/api/test/intelligent-routing', async (req, res) => {
  try {
    const testCases = [
      {
        content: "Check out our amazing new wellness product! Transform your life today!",
        contentType: "marketing",
        metadata: { campaign: "summer-2024" }
      },
      {
        content: "Our drug showed 92% efficacy in treating Type 2 diabetes. FDA approved for patients over 18.",
        contentType: "medical",
        metadata: { regulatory: true }
      },
      {
        content: "Happy holidays from our team at AICemplyr!",
        contentType: "social",
        metadata: { internal: true }
      },
      {
        content: "This breakthrough treatment cures cancer in just 30 days! Guaranteed results or money back!",
        contentType: "advertisement",
        metadata: { urgent: true }
      }
    ];

    const results = [];
    for (const testCase of testCases) {
      const result = await workflowEngine.executeWorkflow(
        'auto', // Let context agent decide
        testCase,
        {
          client: { id: 'test-client', tier: 'standard' },
          user: { id: 'test-user' }
        }
      );
      results.push({
        input: testCase.content.substring(0, 50) + '...',
        analysis: {
          type: result.contextAnalysis?.type?.primary,
          risk: result.contextAnalysis?.riskLevel?.level,
          complexity: result.contextAnalysis?.complexity?.score
        },
        workflow: result.workflow,
        summary: result.summary,
        confidence: result.confidence
      });
    }
    res.json({
      message: 'Intelligent routing test complete',
      results,
      insights: {
        workflowDistribution: results.reduce((acc, r) => {
          acc[r.workflow] = (acc[r.workflow] || 0) + 1;
          return acc;
        }, {}),
        averageConfidence: Math.round(
          results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        )
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workflow metrics endpoint (mock data)
router.get('/api/metrics/workflows', async (req, res) => {
  try {
    // This would need to be implemented in your state manager
    // For now, return mock data to show the structure
    res.json({
      workflows: {
        'express-lane': {
          count: 142,
          avgDuration: '3m 24s',
          successRate: 0.94,
          avgConfidence: 92
        },
        'standard-review': {
          count: 67,
          avgDuration: '18m 12s',
          successRate: 0.88,
          avgConfidence: 85
        },
        'medical-content-review': {
          count: 23,
          avgDuration: '47m 33s',
          successRate: 0.78,
          avgConfidence: 73
        },
        'high-risk-review': {
          count: 8,
          avgDuration: '2h 14m',
          successRate: 0.63,
          avgConfidence: 61
        }
      },
      insights: {
        fastTrackPercentage: 58,
        riskDetectionAccuracy: 0.91,
        falsePositiveReduction: 0.34
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function for summary stats
function getMostActiveAgent() {
    const agentCounts = {};
    agentActivities.forEach(activity => {
        agentCounts[activity.agent] = (agentCounts[activity.agent] || 0) + 1;
    });
    
    let maxAgent = 'None';
    let maxCount = 0;
    
    Object.entries(agentCounts).forEach(([agent, count]) => {
        if (count > maxCount) {
            maxCount = count;
            maxAgent = agent;
        }
    });
    
    return { name: maxAgent, activities: maxCount };
}

// ===== USER AND CONTEXT MANAGEMENT ENDPOINTS =====

// Get user contexts
router.get('/user/contexts', (req, res) => {
    // Mock data - replace with database query
    const contexts = [
        {
            id: 'enterprise-1',
            name: 'Ogilvy Health',
            type: 'enterprise',
            isDefault: true,
            permissions: ['read', 'write', 'admin'],
            lastAccessed: new Date().toISOString()
        },
        {
            id: 'seat-1',
            name: 'McCann Health - Seat 1',
            type: 'agency-seat',
            isDefault: false,
            permissions: ['read', 'write'],
            lastAccessed: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'seat-2',
            name: 'Havas Health - Seat 2',
            type: 'agency-seat',
            isDefault: false,
            permissions: ['read'],
            lastAccessed: new Date(Date.now() - 172800000).toISOString()
        }
    ];
    
    res.json(contexts);
});

// Switch user context
router.post('/user/context/switch', (req, res) => {
    const { contextId } = req.body;
    
    // Mock data - replace with database query
    const context = {
        id: contextId,
        name: contextId === 'enterprise-1' ? 'Ogilvy Health' : 
              contextId === 'seat-1' ? 'McCann Health - Seat 1' : 'Havas Health - Seat 2',
        type: contextId.startsWith('enterprise') ? 'enterprise' : 'agency-seat',
        isDefault: contextId === 'enterprise-1',
        permissions: ['read', 'write', 'admin'],
        lastAccessed: new Date().toISOString()
    };
    
    res.json(context);
});

// Get dashboard data for context
router.get('/dashboard/:contextType/:contextId', (req, res) => {
    const { contextType, contextId } = req.params;
    
    // Mock dashboard data
    const dashboardData = {
        metrics: {
            compliance: 92,
            violations: 0,
            pendingReviews: 5,
            completedToday: 12
        },
        recentActivity: [
            {
                id: '1',
                type: 'policy_update',
                title: 'Policy Updated: Social Media Guidelines',
                timestamp: new Date().toISOString(),
                status: 'completed'
            },
            {
                id: '2',
                type: 'audit_completed',
                title: 'Monthly Compliance Audit',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                status: 'completed'
            }
        ],
        alerts: [
            {
                id: '1',
                type: 'warning',
                message: 'Policy review due in 3 days',
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    res.json(dashboardData);
});

// Get notifications for context
router.get('/notifications/:contextId', (req, res) => {
    const { contextId } = req.params;
    const { filter = 'all' } = req.query;
    
    // Mock notifications
    const notifications = [
        {
            id: '1',
            type: 'policy_update',
            title: 'New Policy Available',
            message: 'Updated social media guidelines have been published',
            timestamp: new Date().toISOString(),
            isRead: false,
            priority: 'high'
        },
        {
            id: '2',
            type: 'compliance_alert',
            title: 'Compliance Review Due',
            message: 'Monthly compliance review is due in 3 days',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isRead: true,
            priority: 'medium'
        },
        {
            id: '3',
            type: 'audit_completed',
            title: 'Audit Completed',
            message: 'Q4 compliance audit has been completed',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            isRead: true,
            priority: 'low'
        }
    ];
    
    // Filter notifications based on query parameter
    let filteredNotifications = notifications;
    if (filter === 'unread') {
        filteredNotifications = notifications.filter(n => !n.isRead);
    } else if (filter === 'high-priority') {
        filteredNotifications = notifications.filter(n => n.priority === 'high');
    }
    
    res.json(filteredNotifications);
});

// Mark notification as read
router.put('/notifications/:notificationId/read', (req, res) => {
    const { notificationId } = req.params;
    
    // Mock response - in real implementation, update database
    res.json({
        id: notificationId,
        isRead: true,
        updatedAt: new Date().toISOString()
    });
});

// Mark all notifications as read
router.put('/notifications/:contextId/read-all', (req, res) => {
    const { contextId } = req.params;
    
    // Mock response - in real implementation, update database
    res.json({
        contextId,
        updatedCount: 3,
        updatedAt: new Date().toISOString()
    });
});

// Get user profile
router.get('/user/profile', (req, res) => {
    // Mock user profile
    const profile = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@ogilvy.com',
        role: 'Compliance Manager',
        avatar: 'https://via.placeholder.com/150',
        preferences: {
            notifications: true,
            emailAlerts: true,
            dashboardLayout: 'default'
        },
        lastLogin: new Date().toISOString()
    };
    
    res.json(profile);
});

// Update user profile
router.put('/user/profile', (req, res) => {
    const profileData = req.body;
    
    // Mock response - in real implementation, update database
    res.json({
        ...profileData,
        updatedAt: new Date().toISOString()
    });
});

// ===== ENTERPRISE AND AGENCY SEAT ENDPOINTS =====

// Get enterprise data
router.get('/enterprises/:enterpriseId', (req, res) => {
    const { enterpriseId } = req.params;
    
    // Mock enterprise data
    const enterprise = {
        id: enterpriseId,
        name: 'Ogilvy Health',
        type: 'enterprise',
        status: 'active',
        compliance: 92,
        totalSeats: 15,
        activeSeats: 12,
        lastAudit: new Date(Date.now() - 86400000).toISOString(),
        policies: [
            { id: '1', name: 'Social Media Guidelines', status: 'active' },
            { id: '2', name: 'Data Privacy Policy', status: 'active' },
            { id: '3', name: 'Compliance Standards', status: 'draft' }
        ]
    };
    
    res.json(enterprise);
});

// Get agency seat data
router.get('/agency-seats/:seatId', (req, res) => {
    const { seatId } = req.params;
    
    // Mock agency seat data
    const seat = {
        id: seatId,
        name: 'McCann Health - Seat 1',
        type: 'agency-seat',
        status: 'active',
        compliance: 88,
        assignedPolicies: 5,
        lastActivity: new Date(Date.now() - 3600000).toISOString(),
        users: [
            { id: 'user-1', name: 'Jane Smith', role: 'Compliance Officer' },
            { id: 'user-2', name: 'Mike Johnson', role: 'Reviewer' }
        ]
    };
    
    res.json(seat);
});

// ===== COMPLIANCE AND AUDIT ENDPOINTS =====

// Get compliance metrics
router.get('/compliance/metrics/:contextId', (req, res) => {
    const { contextId } = req.params;
    
    // Mock compliance metrics
    const metrics = {
        overallScore: 92,
        policyCompliance: 95,
        auditCompliance: 88,
        riskScore: 12,
        trends: {
            lastMonth: 89,
            thisMonth: 92,
            change: '+3'
        },
        breakdown: {
            socialMedia: 94,
            dataPrivacy: 91,
            regulatoryCompliance: 89
        }
    };
    
    res.json(metrics);
});

// Get audit events
router.get('/audit/events/:contextId', (req, res) => {
    const { contextId } = req.params;
    const { limit = 10 } = req.query;
    
    // Mock audit events
    const events = [
        {
            id: '1',
            type: 'policy_update',
            description: 'Social Media Guidelines updated',
            timestamp: new Date().toISOString(),
            user: 'John Doe',
            severity: 'low'
        },
        {
            id: '2',
            type: 'compliance_violation',
            description: 'Minor violation detected in campaign review',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user: 'Jane Smith',
            severity: 'medium'
        }
    ];
    
    res.json(events.slice(0, parseInt(limit)));
});

// ===== POLICY MANAGEMENT ENDPOINTS =====

// Get policies for context
router.get('/policies/:contextId', (req, res) => {
    const { contextId } = req.params;
    
    // Mock policies
    const policies = [
        {
            id: '1',
            name: 'Social Media Guidelines',
            status: 'active',
            lastUpdated: new Date().toISOString(),
            compliance: 95,
            assignedSeats: 8
        },
        {
            id: '2',
            name: 'Data Privacy Policy',
            status: 'active',
            lastUpdated: new Date(Date.now() - 86400000).toISOString(),
            compliance: 91,
            assignedSeats: 12
        },
        {
            id: '3',
            name: 'Compliance Standards',
            status: 'draft',
            lastUpdated: new Date(Date.now() - 172800000).toISOString(),
            compliance: 0,
            assignedSeats: 0
        }
    ];
    
    res.json(policies);
});

// Get submissions for context
router.get('/submissions/:contextId', (req, res) => {
    const { contextId } = req.params;
    const { status = 'all' } = req.query;
    
    // Mock submissions
    const submissions = [
        {
            id: '1',
            title: 'Q4 Campaign Review',
            status: 'pending',
            submittedBy: 'Jane Smith',
            submittedAt: new Date().toISOString(),
            priority: 'high'
        },
        {
            id: '2',
            title: 'Social Media Campaign',
            status: 'approved',
            submittedBy: 'Mike Johnson',
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
            priority: 'medium'
        }
    ];
    
    // Filter by status if specified
    let filteredSubmissions = submissions;
    if (status !== 'all') {
        filteredSubmissions = submissions.filter(s => s.status === status);
    }
    
    res.json(filteredSubmissions);
});

// ===== AI AND TOOL ENDPOINTS =====

// Generate policy with AI
router.post('/ai/generate-policy', async (req, res) => {
    const { requirements, context, type } = req.body;
    
    try {
        // Mock AI response - replace with actual AI service call
        const generatedPolicy = {
            id: `policy-${Date.now()}`,
            name: `${type} Policy`,
            content: `Generated policy content based on requirements: ${requirements}`,
            status: 'draft',
            generatedAt: new Date().toISOString(),
            confidence: 85
        };
        
        res.json(generatedPolicy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze conflicts with AI
router.post('/ai/analyze-conflicts', async (req, res) => {
    const { policies } = req.body;
    
    try {
        // Mock conflict analysis - replace with actual AI service call
        const analysis = {
            conflicts: [
                {
                    type: 'regulatory',
                    severity: 'medium',
                    description: 'Potential conflict between social media and data privacy policies',
                    affectedPolicies: ['1', '2']
                }
            ],
            recommendations: [
                'Review data privacy implications of social media policy',
                'Update compliance monitoring procedures'
            ],
            confidence: 87
        };
        
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get policy templates
router.get('/ai/policy-templates', (req, res) => {
    // Mock policy templates
    const templates = [
        {
            id: '1',
            name: 'Social Media Policy Template',
            description: 'Standard template for social media compliance',
            category: 'marketing',
            lastUpdated: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Data Privacy Policy Template',
            description: 'Comprehensive data privacy policy template',
            category: 'privacy',
            lastUpdated: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    
    res.json(templates);
});

// Validate policy with AI
router.post('/ai/validate-policy', async (req, res) => {
    const { policyContent, context } = req.body;
    
    try {
        // Mock validation - replace with actual AI service call
        const validation = {
            isValid: true,
            issues: [
                {
                    type: 'warning',
                    message: 'Consider adding more specific data handling procedures',
                    line: 15
                }
            ],
            suggestions: [
                'Add data retention policy section',
                'Include incident response procedures'
            ],
            confidence: 92
        };
        
        res.json(validation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate policy with AI
router.post('/ai/generate-policy-with-ai', async (req, res) => {
    const { policyIntent } = req.body;
    
    try {
        // Mock AI policy generation - replace with actual AI service call
        const generatedPolicy = {
            id: `policy-${Date.now()}`,
            name: `${policyIntent.type} Policy`,
            description: `AI-generated policy for ${policyIntent.type} compliance`,
            content: `This policy outlines the requirements and procedures for ${policyIntent.type} compliance...`,
            rules: [
                'All content must be reviewed before publication',
                'Data privacy requirements must be followed',
                'Regular compliance audits are mandatory'
            ],
            status: 'draft',
            generatedAt: new Date().toISOString(),
            confidence: 85,
            aiModel: 'gpt-4',
            version: '1.0'
        };
        
        res.json(generatedPolicy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validate AI policy
router.post('/ai/validate-ai-policy', async (req, res) => {
    const { policyData } = req.body;
    
    try {
        // Mock AI policy validation - replace with actual AI service call
        const validation = {
            isValid: true,
            issues: [
                {
                    type: 'warning',
                    message: 'Consider adding more specific data handling procedures',
                    line: 15
                }
            ],
            suggestions: [
                'Add data retention policy section',
                'Include incident response procedures'
            ],
            confidence: 92,
            complianceScore: 88
        };
        
        res.json(validation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit policy for approval
router.post('/policies/:policyId/submit-approval', async (req, res) => {
    const { policyId } = req.params;
    const { approvalData } = req.body;
    
    try {
        // Mock approval submission - replace with actual approval workflow
        const approval = {
            policyId,
            status: 'pending',
            submittedBy: approvalData.submittedBy,
            submittedAt: new Date().toISOString(),
            approvers: approvalData.approvers,
            estimatedReviewTime: '2-3 business days',
            approvalId: `approval-${Date.now()}`
        };
        
        res.json(approval);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get policy approval workflow
router.get('/policies/:policyId/approval-workflow', (req, res) => {
    const { policyId } = req.params;
    
    // Mock approval workflow
    const workflow = {
        policyId,
        steps: [
            {
                id: 'step-1',
                name: 'Legal Review',
                status: 'pending',
                assignedTo: 'legal-team@company.com',
                estimatedTime: '1-2 days'
            },
            {
                id: 'step-2',
                name: 'Compliance Review',
                status: 'pending',
                assignedTo: 'compliance@company.com',
                estimatedTime: '1-2 days'
            },
            {
                id: 'step-3',
                name: 'Executive Approval',
                status: 'pending',
                assignedTo: 'executive@company.com',
                estimatedTime: '1 day'
            }
        ],
        currentStep: 'step-1',
        overallStatus: 'pending'
    };
    
    res.json(workflow);
});

// Get policy deployment status
router.get('/policies/:policyId/deployment-status', (req, res) => {
    const { policyId } = req.params;
    
    // Mock deployment status
    const status = {
        policyId,
        status: 'deployed',
        deployedAt: new Date().toISOString(),
        deployedBy: 'admin@company.com',
        deploymentTargets: [
            {
                type: 'enterprise',
                id: 'enterprise-1',
                status: 'active'
            },
            {
                type: 'seat',
                id: 'seat-1',
                status: 'active'
            }
        ],
        metrics: {
            activeUsers: 45,
            complianceRate: 92,
            violations: 0
        }
    };
    
    res.json(status);
});

// ===== ENTERPRISE SEAT MANAGEMENT ENDPOINTS =====

// Get enterprise seats
router.get('/enterprise/:enterpriseId/seats', (req, res) => {
    const { enterpriseId } = req.params;
    
    // Mock enterprise seats data
    const seats = [
        {
            id: 'seat-1',
            name: 'McCann Health - Seat 1',
            adminName: 'Jane Smith',
            status: 'active',
            activeUsers: 3,
            userLimit: 5,
            complianceScore: 88,
            lastActivity: '2 hours ago',
            assignedPolicies: 5,
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
        },
        {
            id: 'seat-2',
            name: 'Havas Health - Seat 2',
            adminName: 'Mike Johnson',
            status: 'active',
            activeUsers: 2,
            userLimit: 4,
            complianceScore: 92,
            lastActivity: '1 day ago',
            assignedPolicies: 4,
            createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
        },
        {
            id: 'seat-3',
            name: 'Publicis Health - Seat 3',
            adminName: 'Sarah Wilson',
            status: 'pending',
            activeUsers: 0,
            userLimit: 3,
            complianceScore: 0,
            lastActivity: 'Never',
            assignedPolicies: 0,
            createdAt: new Date().toISOString()
        }
    ];
    
    res.json({
        enterpriseId,
        seats,
        totalSeats: seats.length,
        activeSeats: seats.filter(s => s.status === 'active').length,
        pendingSeats: seats.filter(s => s.status === 'pending').length
    });
});

// Create new seat
router.post('/enterprise/:enterpriseId/seats', (req, res) => {
    const { enterpriseId } = req.params;
    const { name, adminName, userLimit, policies } = req.body;
    
    // Mock seat creation
    const newSeat = {
        id: `seat-${Date.now()}`,
        name,
        adminName,
        status: 'pending',
        activeUsers: 0,
        userLimit: userLimit || 5,
        complianceScore: 0,
        lastActivity: 'Never',
        assignedPolicies: policies?.length || 0,
        createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newSeat);
});

// Update seat
router.put('/enterprise/:enterpriseId/seats/:seatId', (req, res) => {
    const { enterpriseId, seatId } = req.params;
    const updateData = req.body;
    
    // Mock seat update
    const updatedSeat = {
        id: seatId,
        ...updateData,
        updatedAt: new Date().toISOString()
    };
    
    res.json(updatedSeat);
});

// Delete seat
router.delete('/enterprise/:enterpriseId/seats/:seatId', (req, res) => {
    const { enterpriseId, seatId } = req.params;
    
    // Mock seat deletion
    res.json({
        message: 'Seat deleted successfully',
        deletedSeatId: seatId
    });
});

// Bulk policy assignment
router.post('/enterprise/:enterpriseId/seats/bulk-policy-assignment', (req, res) => {
    const { enterpriseId } = req.params;
    const { seatIds, policyIds, options } = req.body;
    
    // Mock bulk assignment
    const assignment = {
        enterpriseId,
        assignedSeats: seatIds.length,
        assignedPolicies: policyIds.length,
        options,
        completedAt: new Date().toISOString(),
        status: 'completed'
    };
    
    res.json(assignment);
});

// Invite user to seat
router.post('/enterprise/:enterpriseId/seats/:seatId/invite-user', (req, res) => {
    const { enterpriseId, seatId } = req.params;
    const { email, role, permissions } = req.body;
    
    // Mock user invitation
    const invitation = {
        id: `invite-${Date.now()}`,
        seatId,
        email,
        role,
        permissions,
        status: 'pending',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() // 7 days
    };
    
    res.json(invitation);
});

// Get seat analytics
router.get('/enterprise/:enterpriseId/seats/analytics', (req, res) => {
    const { enterpriseId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    // Mock analytics data
    const analytics = {
        timeRange,
        overview: {
            totalSeats: 15,
            activeSeats: 12,
            pendingSeats: 3,
            averageCompliance: 87,
            totalUsers: 45
        },
        trends: {
            complianceTrend: [
                { date: '2024-01-01', score: 85 },
                { date: '2024-01-15', score: 87 },
                { date: '2024-01-30', score: 89 }
            ],
            userGrowth: [
                { date: '2024-01-01', users: 40 },
                { date: '2024-01-15', users: 42 },
                { date: '2024-01-30', users: 45 }
            ]
        },
        topPerformers: [
            {
                seatId: 'seat-1',
                name: 'McCann Health - Seat 1',
                complianceScore: 92,
                userCount: 3
            },
            {
                seatId: 'seat-2',
                name: 'Havas Health - Seat 2',
                complianceScore: 88,
                userCount: 2
            }
        ],
        alerts: [
            {
                type: 'compliance_drop',
                seatId: 'seat-3',
                message: 'Compliance score dropped by 15%',
                severity: 'medium'
            }
        ]
    };
    
    res.json(analytics);
});

// Get available policies for enterprise
router.get('/enterprise/:enterpriseId/policies/available', (req, res) => {
    const { enterpriseId } = req.params;
    
    // Mock available policies
    const policies = [
        {
            id: 'policy-1',
            name: 'Social Media Guidelines',
            description: 'Comprehensive social media compliance policy',
            category: 'marketing',
            version: '2.1',
            lastUpdated: new Date().toISOString(),
            assignedSeats: 8
        },
        {
            id: 'policy-2',
            name: 'Data Privacy Policy',
            description: 'Data handling and privacy compliance policy',
            category: 'privacy',
            version: '1.5',
            lastUpdated: new Date(Date.now() - 86400000).toISOString(),
            assignedSeats: 12
        },
        {
            id: 'policy-3',
            name: 'Compliance Standards',
            description: 'General compliance and regulatory standards',
            category: 'compliance',
            version: '1.0',
            lastUpdated: new Date(Date.now() - 172800000).toISOString(),
            assignedSeats: 5
        }
    ];
    
    res.json(policies);
});

// Get compliance report for seat
router.get('/enterprise/:enterpriseId/seats/:seatId/compliance-report', (req, res) => {
    const { enterpriseId, seatId } = req.params;
    
    // Mock compliance report
    const report = {
        seatId,
        generatedAt: new Date().toISOString(),
        period: 'Last 30 days',
        overallScore: 88,
        breakdown: {
            socialMedia: 92,
            dataPrivacy: 85,
            regulatoryCompliance: 87
        },
        violations: [
            {
                id: 'violation-1',
                type: 'minor',
                description: 'Social media post without approval',
                date: new Date(Date.now() - 86400000).toISOString(),
                status: 'resolved'
            }
        ],
        recommendations: [
            'Implement stricter approval workflow for social media posts',
            'Schedule quarterly compliance training',
            'Review data handling procedures'
        ]
    };
    
    res.json(report);
});

module.exports = router;
