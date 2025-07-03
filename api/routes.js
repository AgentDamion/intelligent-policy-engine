const express = require('express');
const router = express.Router();

// Import the conflict detection agent
const { ConflictDetectionAgent } = require('../agents/conflict-detection-agent.js');

// Basic health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Policy engine is running',
        timestamp: new Date()
    });
});

// NEW: Conflict detection endpoint
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
        
        res.json({
            success: true,
            data: conflictReport
        });
        
    } catch (error) {
        console.error('Conflict analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze policy conflicts',
            details: error.message 
        });
    }
});

// Placeholder endpoints
router.get('/policies', (req, res) => {
    res.json({ 
        message: 'Policies endpoint - coming soon',
        policies: []
    });
});

router.get('/audit', (req, res) => {
    res.json({ 
        message: 'Audit endpoint - coming soon',
        audits: []
    });
});

// Agency endpoints
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

module.exports = router;