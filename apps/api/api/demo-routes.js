// File: api/demo-routes.js

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for demo sessions (in production, use database)
const demoSessions = new Map();
const demoAnalytics = {
  sessions: [],
  featureUsage: {},
  roiCalculations: [],
  conversions: []
};

// POST /api/demo/start-session
router.post('/start-session', (req, res) => {
  try {
    const { scenarioId, prospectData } = req.body;
    const sessionId = `demo-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    const session = {
      sessionId,
      scenarioId,
      prospectData: prospectData || {},
      startTime: new Date().toISOString(),
      timeSpent: 0,
      featuresExplored: [],
      calculatedROI: null,
      conversionIntent: 'unknown',
      status: 'active'
    };

    demoSessions.set(sessionId, session);
    demoAnalytics.sessions.push({
      sessionId,
      scenarioId,
      startTime: session.startTime,
      prospectData: session.prospectData
    });

    console.log(`Demo session started: ${sessionId} for scenario: ${scenarioId}`);

    res.json({
      success: true,
      sessionId,
      message: 'Demo session started successfully'
    });
  } catch (error) {
    console.error('Error starting demo session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start demo session'
    });
  }
});

// PUT /api/demo/track-feature
router.put('/track-feature', (req, res) => {
  try {
    const { sessionId, feature, timeSpent } = req.body;
    
    const session = demoSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Demo session not found'
      });
    }

    // Update session
    session.featuresExplored.push(feature);
    session.timeSpent = timeSpent;
    session.lastActivity = new Date().toISOString();

    // Track feature usage
    if (!demoAnalytics.featureUsage[feature]) {
      demoAnalytics.featureUsage[feature] = 0;
    }
    demoAnalytics.featureUsage[feature]++;

    // Calculate conversion intent
    const highValueFeatures = ['seat-management', 'policy-builder', 'compliance-dashboard', 'roi-calculator'];
    const exploredHighValue = session.featuresExplored.filter(f => highValueFeatures.includes(f)).length;
    
    if (timeSpent > 600000 && exploredHighValue >= 2) {
      session.conversionIntent = 'high';
    } else if (timeSpent > 300000 && exploredHighValue >= 1) {
      session.conversionIntent = 'medium';
    } else {
      session.conversionIntent = 'low';
    }

    console.log(`Feature tracked: ${feature} for session: ${sessionId}`);

    res.json({
      success: true,
      conversionIntent: session.conversionIntent,
      featuresExplored: session.featuresExplored,
      message: 'Feature tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track feature'
    });
  }
});

// POST /api/demo/calculate-roi
router.post('/calculate-roi', (req, res) => {
  try {
    const { sessionId, roiData } = req.body;
    
    const session = demoSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Demo session not found'
      });
    }

    // Store ROI calculation
    session.calculatedROI = roiData;
    session.roiCalculatedAt = new Date().toISOString();

    // Track ROI analytics
    demoAnalytics.roiCalculations.push({
      sessionId,
      roiData,
      timestamp: new Date().toISOString()
    });

    // Update conversion intent based on ROI
    if (roiData.roiPercentage > 200) {
      session.conversionIntent = 'high';
    } else if (roiData.roiPercentage > 100) {
      session.conversionIntent = 'medium';
    }

    console.log(`ROI calculated for session: ${sessionId} - ${roiData.roiPercentage}%`);

    res.json({
      success: true,
      conversionIntent: session.conversionIntent,
      roiData: session.calculatedROI,
      message: 'ROI calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate ROI'
    });
  }
});

// POST /api/demo/complete-session
router.post('/complete-session', (req, res) => {
  try {
    const { sessionId, finalData } = req.body;
    
    const session = demoSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Demo session not found'
      });
    }

    // Complete session
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.finalData = finalData;

    // Track completion analytics
    demoAnalytics.conversions.push({
      sessionId,
      scenarioId: session.scenarioId,
      timeSpent: session.timeSpent,
      featuresExplored: session.featuresExplored,
      conversionIntent: session.conversionIntent,
      calculatedROI: session.calculatedROI,
      completedAt: session.completedAt
    });

    console.log(`Demo session completed: ${sessionId} with ${session.conversionIntent} intent`);

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        scenarioId: session.scenarioId,
        timeSpent: session.timeSpent,
        featuresExplored: session.featuresExplored,
        conversionIntent: session.conversionIntent,
        calculatedROI: session.calculatedROI
      },
      message: 'Demo session completed successfully'
    });
  } catch (error) {
    console.error('Error completing demo session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete demo session'
    });
  }
});

// GET /api/demo/analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = {
      totalSessions: demoAnalytics.sessions.length,
      activeSessions: Array.from(demoSessions.values()).filter(s => s.status === 'active').length,
      completedSessions: demoAnalytics.conversions.length,
      featureUsage: demoAnalytics.featureUsage,
      conversionRates: {
        high: demoAnalytics.conversions.filter(c => c.conversionIntent === 'high').length,
        medium: demoAnalytics.conversions.filter(c => c.conversionIntent === 'medium').length,
        low: demoAnalytics.conversions.filter(c => c.conversionIntent === 'low').length
      },
      averageTimeSpent: demoAnalytics.conversions.length > 0 
        ? demoAnalytics.conversions.reduce((sum, c) => sum + c.timeSpent, 0) / demoAnalytics.conversions.length
        : 0,
      averageROI: demoAnalytics.roiCalculations.length > 0
        ? demoAnalytics.roiCalculations.reduce((sum, r) => sum + r.roiData.roiPercentage, 0) / demoAnalytics.roiCalculations.length
        : 0
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// GET /api/demo/session/:sessionId
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = demoSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Demo session not found'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

module.exports = router; 