const express = require('express');
const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Policy engine is running',
        timestamp: new Date()
    });
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