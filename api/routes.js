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

// AUDIT AGENT ENDPOINTS
router.post('/audit/check', async (req, res) => {
    try {
        const { submission, type = 'general' } = req.body;
        
        if (!submission) {
            return res.status(400).json({ error: 'Submission data required' });
        }
        
        const agent = new AuditAgent();
        const auditResult = await agent.checkSubmission(submission, type);
        
        // Log the activity
        logAgentActivity('Audit Agent', 'Submission Check', {
            type: type,
            status: auditResult.status || 'completed',
            issuesFound: auditResult.issues?.length || 0
        });
        
        res.json({
            success: true,
            data: {
                status: auditResult.status || 'reviewed',
                confidence: auditResult.confidence || 0.85,
                issues: auditResult.issues || [],
                recommendations: auditResult.recommendations || [],
                explanation: auditResult.explanation || 'Audit completed successfully'
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

// EXISTING ENDPOINTS (Enhanced)

// Get all policies (enhanced from placeholder)
router.get('/policies', (req, res) => {
    const clientId = req.headers['x-client-id'] || req.query.clientId;
    
    // Sample policies for testing
    const samplePolicies = [
        { 
            id: 1, 
            name: 'GDPR Compliance Policy', 
            status: 'active', 
            lastUpdated: new Date('2024-01-15') 
        },
        { 
            id: 2, 
            name: 'AI Usage Guidelines', 
            status: 'active', 
            lastUpdated: new Date('2024-01-20') 
        },
        { 
            id: 3, 
            name: 'Data Retention Policy', 
            status: 'draft', 
            lastUpdated: new Date('2024-01-25') 
        }
    ];
    
    res.json({
        clientId: clientId,
        policies: samplePolicies,
        total: samplePolicies.length
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

module.exports = router;