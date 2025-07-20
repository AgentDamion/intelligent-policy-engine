const express = require('express');
const router = express.Router();

// Import all your agents
const { ConflictDetectionAgent } = require('../agents/conflict-detection-agent.js');
const { AuditAgent } = require('../agents/audit-agent.js');
const { PolicyAgent } = require('../agents/policy-agent.js');
const { NegotiationAgent } = require('../agents/negotiation-agent.js');
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
        const result = await workflowEngine.executeWorkflow('policy-check', contextOutput, { organizationId, userId });
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

// Get all policies
router.get('/policies', (req, res) => {
    res.json({
        success: true,
        policies: policies
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
    const result = await workflowEngine.runWorkflow('real-time-assist', { content, liveMode: true }, context);
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

module.exports = router;