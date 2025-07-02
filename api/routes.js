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

module.exports = router;