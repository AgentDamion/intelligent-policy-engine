const express = require('express');
const router = express.Router();

// Import all your agents
const { ConflictDetectionAgent } = require('../agents/conflict-detection-agent.js');
const { AuditAgent } = require('../agents/audit-agent.js');
const { PolicyAgent } = require('../agents/policy-agent.js');
const { NegotiationAgent } = require('../agents/negotiation-agent.js');
const { ContextAgent } = require('../agents/context-agent.js');

// In-memory storage for activities and overrides (replace with database later)
const agentActivities = [];
const overrides = [];

// NEW STORAGE ADDED FOR DASHBOARD
let policies = [];  // For storing created policies
let agencies = [
    { 
      id: '1', 
      name: 'Ogilvy Health', 
      compliance: 92,  // Changed from complianceRate
      violations: 0,
      lastAudit: '2 days ago',
      status: 'active'
    },
    { 
      id: '2', 
      name: 'McCann Health', 
      compliance: 88,  // Changed from complianceRate
      violations: 1,
      lastAudit: '1 week ago',
      status: 'warning'
    },
    { 
      id: '3', 
      name: 'Havas Health', 
      compliance: 95,  // Changed from complianceRate
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


// POLICY AGENT ENDPOINTS
router.post('/policy/analyze', async (req, res) => {
    try {
        const { document, requirements, policyType } = req.body;
        
        if (!document) {
            return res.status(400).json({ error: 'Document required for analysis' });
        }
        
        const agent = new PolicyAgent();
        const analysis = await agent.analyzeDocument(document, requirements);
        
        // Log the activity
        logAgentActivity('Policy Agent', 'Document Analysis', {
            policyType: policyType || 'general',
            complianceScore: analysis.complianceScore || 0,
            status: analysis.status || 'analyzed'
        });
        
        res.json({
            success: true,
            data: {
                status: analysis.status || 'analyzed',
                complianceScore: analysis.complianceScore || 0.75,
                findings: analysis.findings || [],
                missingElements: analysis.missingElements || [],
                explanation: analysis.explanation || 'Policy analysis completed'
            }
        });
        
    } catch (error) {
        console.error('Policy analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze policy',
            details: error.message 
        });
    }
});

// NEGOTIATION AGENT ENDPOINTS
router.post('/negotiation/suggest', async (req, res) => {
    try {
        const { currentTerms, targetOutcome, context } = req.body;
        
        if (!currentTerms || !targetOutcome) {
            return res.status(400).json({ 
                error: 'Current terms and target outcome required' 
            });
        }
        
        const agent = new NegotiationAgent();
        const suggestions = await agent.generateSuggestions(currentTerms, targetOutcome);
        
        // Log the activity
        logAgentActivity('Negotiation Agent', 'Generated Suggestions', {
            suggestionsCount: suggestions.suggestions?.length || 0,
            priority: suggestions.priority || 'medium'
        });
        
        res.json({
            success: true,
            data: {
                suggestions: suggestions.suggestions || [],
                strategy: suggestions.strategy || 'collaborative',
                confidence: suggestions.confidence || 0.8,
                explanation: suggestions.explanation || 'Negotiation strategies generated'
            }
        });
        
    } catch (error) {
        console.error('Negotiation suggestion error:', error);
        res.status(500).json({ 
            error: 'Failed to generate negotiation suggestions',
            details: error.message 
        });
    }
});

// CONTEXT AGENT ENDPOINTS
router.post('/context/analyze', async (req, res) => {
    try {
        const { content, contextType } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content required for context analysis' });
        }
        
        const agent = new ContextAgent();
        const contextAnalysis = await agent.analyzeContext(content, contextType);
        
        // Log the activity
        logAgentActivity('Context Agent', 'Context Analysis', {
            contextType: contextType || 'general',
            relevanceScore: contextAnalysis.relevanceScore || 0
        });
        
        res.json({
            success: true,
            data: {
                context: contextAnalysis.context || {},
                relevanceScore: contextAnalysis.relevanceScore || 0.7,
                relatedPolicies: contextAnalysis.relatedPolicies || [],
                explanation: contextAnalysis.explanation || 'Context analysis completed'
            }
        });
        
    } catch (error) {
        console.error('Context analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze context',
            details: error.message 
        });
    }
});

// HUMAN OVERRIDE ENDPOINT
router.post('/agent/override', async (req, res) => {
    try {
        const { 
            agentName, 
            originalDecision, 
            overrideReason, 
            newDecision,
            userId 
        } = req.body;
        
        if (!agentName || !originalDecision || !overrideReason) {
            return res.status(400).json({ 
                error: 'Agent name, original decision, and reason required' 
            });
        }
        
        const override = {
            id: Date.now(),
            agentName,
            originalDecision,
            newDecision,
            reason: overrideReason,
            overriddenBy: userId || 'user',
            timestamp: new Date()
        };
        
        overrides.push(override);
        
        // Log this as an activity
        logAgentActivity('Human Override', 'Decision Overridden', {
            agent: agentName,
            reason: overrideReason,
            originalDecision: originalDecision,
            newDecision: newDecision
        });
        
        res.json({
            success: true,
            override: override,
            message: 'Override recorded successfully'
        });
        
    } catch (error) {
        console.error('Override error:', error);
        res.status(500).json({ 
            error: 'Failed to record override',
            details: error.message 
        });
    }
});

// Get override history
router.get('/agent/overrides', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        overrides: overrides.slice(-limit).reverse(),
        total: overrides.length
    });
});

// DASHBOARD ENDPOINTS (NEW AND UPDATED)

// Get all policies (UPDATED - now returns real policies)
router.get('/policies', (req, res) => {
    res.json({
        success: true,
        policies: policies
    });
});

// CREATE new policy (NEW)
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

// GET all agencies (NEW)
router.get('/agencies', (req, res) => {
    res.json({ 
        success: true,
        agencies: agencies 
    });
});

// GET all submissions (NEW)
router.get('/submissions', (req, res) => {
    res.json({ 
        success: true,
        submissions: submissions 
    });
});

// GET policy inbox for agency (NEW)
router.get('/agency/:agencyId/policies/inbox', (req, res) => {
    // Return the latest policies as notifications
    const notifications = policies.slice(-3).map(policy => ({
        id: policy.id,
        type: 'new_policy',
        title: `New Policy: ${policy.title}`,
        message: policy.description,
        timestamp: policy.createdAt,
        read: false
    }));
    
    res.json({ 
        success: true,
        notifications: notifications 
    });
});

// GET enterprise stats (FIXED - only one version now)
router.get('/enterprise/stats', (req, res) => {
    const stats = {
        totalAgencies: agencies.length,
        activePolicies: policies.length,
        pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
        averageComplianceRate: Math.round(
            agencies.reduce((sum, a) => sum + a.compliance, 0) / agencies.length
        ),
        // Add more stats from agent activities
        totalAgentActivities: agentActivities.length,
        totalOverrides: overrides.length
    };
    
    res.json({ 
        success: true,
        stats: stats 
    });
});

// Get audit history (enhanced from placeholder)
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

// AUDIT LOGGING ENDPOINTS
router.post('/audit/start-session', async (req, res) => {
    try {
        const { userMessage, userId } = req.body;
        
        const agent = new AuditAgent();
        const sessionId = agent.startAuditSession(userMessage || 'API Request', userId);
        
        // Store agent instance for this session (in production, use Redis or session storage)
        global.auditSessions = global.auditSessions || {};
        global.auditSessions[sessionId] = agent;
        
        res.json({
            success: true,
            sessionId: sessionId,
            message: 'Audit session started'
        });
        
    } catch (error) {
        console.error('Audit session start error:', error);
        res.status(500).json({ 
            error: 'Failed to start audit session',
            details: error.message 
        });
    }
});

// Log any agent decision
router.post('/audit/log-decision', async (req, res) => {
    try {
        const { sessionId, agentType, decisionType, decision, reasoning, policies } = req.body;
        
        // Get the audit agent for this session
        const agent = global.auditSessions?.[sessionId];
        if (!agent) {
            return res.status(400).json({ error: 'Invalid session ID or session expired' });
        }
        
        const entryId = agent.logDecision(
            agentType,
            decisionType,
            decision,
            reasoning || 'Decision made based on configured policies',
            policies || []
        );
        
        // Also log to our activity tracker
        logAgentActivity(`${agentType} (Audited)`, decisionType, {
            sessionId: sessionId,
            entryId: entryId,
            decision: decision.status || 'processed'
        });
        
        res.json({
            success: true,
            entryId: entryId,
            message: 'Decision logged to audit trail'
        });
        
    } catch (error) {
        console.error('Audit logging error:', error);
        res.status(500).json({ 
            error: 'Failed to log audit decision',
            details: error.message 
        });
    }
});

// Complete audit session and get summary
router.post('/audit/complete-session', async (req, res) => {
    try {
        const { sessionId, finalDecision } = req.body;
        
        const agent = global.auditSessions?.[sessionId];
        if (!agent) {
            return res.status(400).json({ error: 'Invalid session ID or session expired' });
        }
        
        const session = agent.completeAuditSession(
            finalDecision || { status: 'completed' },
            Date.now() - new Date(agent.currentSession.start_time).getTime()
        );
        
        // Clean up session
        delete global.auditSessions[sessionId];
        
        res.json({
            success: true,
            session: session,
            summary: {
                totalDecisions: session.audit_entries.length,
                agentsUsed: session.agents_engaged,
                workflowPath: session.workflow_path,
                duration: session.session_duration_ms
            }
        });
        
    } catch (error) {
        console.error('Audit session complete error:', error);
        res.status(500).json({ 
            error: 'Failed to complete audit session',
            details: error.message 
        });
    }
});

// Search audit logs
router.get('/audit/search', async (req, res) => {
    try {
        const agent = new AuditAgent();
        
        // Build search criteria from query params
        const criteria = {};
        if (req.query.agent) criteria.agent = req.query.agent;
        if (req.query.status) criteria.status = req.query.status;
        if (req.query.risk_level) criteria.risk_level = req.query.risk_level;
        if (req.query.start_date) criteria.start_date = req.query.start_date;
        if (req.query.end_date) criteria.end_date = req.query.end_date;
        
        const results = agent.searchAuditLogs(criteria);
        
        res.json({
            success: true,
            count: results.length,
            results: results
        });
        
    } catch (error) {
        console.error('Audit search error:', error);
        res.status(500).json({ 
            error: 'Failed to search audit logs',
            details: error.message 
        });
    }
});

// Generate compliance report
router.get('/audit/compliance-report', async (req, res) => {
    try {
        const agent = new AuditAgent();
        const report = agent.generateComplianceReport(req.query.sessionId);
        
        res.json({
            success: true,
            report: report
        });
        
    } catch (error) {
        console.error('Compliance report error:', error);
        res.status(500).json({ 
            error: 'Failed to generate compliance report',
            details: error.message 
        });
    }
});

// Quick audit check endpoint (for compatibility)
router.post('/audit/check', async (req, res) => {
    try {
        const { submission, type = 'general' } = req.body;
        
        if (!submission) {
            return res.status(400).json({ error: 'Submission data required' });
        }
        
        // Start a quick audit session
        const agent = new AuditAgent();
        const sessionId = agent.startAuditSession(`Audit check: ${type}`, 'api-user');
        
        // Log the audit check as a decision
        agent.logDecision(
            'audit',
            'submission_review',
            {
                status: 'reviewed',
                type: type,
                content_length: submission.content?.length || 0
            },
            'Automated audit check performed on submission',
            ['submission_review_policy', 'automated_audit_policy']
        );
        
        // Complete the session
        const session = agent.completeAuditSession(
            { status: 'completed', result: 'pass' },
            50
        );
        
        // Log the activity
        logAgentActivity('Audit Agent', 'Submission Check', {
            type: type,
            status: 'reviewed',
            sessionId: sessionId
        });
        
        res.json({
            success: true,
            data: {
                status: 'reviewed',
                confidence: 0.85,
                issues: [],
                recommendations: ['Submission logged in audit trail'],
                explanation: 'Audit check completed and logged',
                auditSessionId: sessionId
            }
        });
        
    } catch (error) {
        console.error('Audit check error:', error);
        res.status(500).json({ 
            error: 'Failed to audit submission',
            details: error.message 
        });
    }
});

module.exports = router;