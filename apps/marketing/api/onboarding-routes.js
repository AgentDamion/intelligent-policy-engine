// File: api/onboarding-routes.js

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for onboarding sessions (in production, use database)
const onboardingSessions = new Map();
const onboardingAnalytics = {
  sessions: [],
  completions: [],
  demoHandoffs: []
};

// POST /api/onboarding/start-with-context
router.post('/start-with-context', (req, res) => {
  try {
    const { demoContext, prefilledData, roiContext, signupData, recommendedPath } = req.body;
    const onboardingId = `onboarding-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    const onboardingSession = {
      onboardingId,
      demoContext,
      prefilledData,
      roiContext,
      signupData,
      recommendedPath,
      startTime: new Date().toISOString(),
      status: 'active',
      steps: [],
      currentStep: 0
    };

    // Determine onboarding mode based on demo context
    if (recommendedPath === 'express-setup') {
      onboardingSession.mode = 'express-setup';
      onboardingSession.estimatedTime = '5 minutes';
    } else if (demoContext) {
      onboardingSession.mode = 'demo-handoff';
      onboardingSession.estimatedTime = '10 minutes';
    } else {
      onboardingSession.mode = 'standard';
      onboardingSession.estimatedTime = '15 minutes';
    }

    onboardingSessions.set(onboardingId, onboardingSession);
    onboardingAnalytics.sessions.push({
      onboardingId,
      mode: onboardingSession.mode,
      hasDemoContext: !!demoContext,
      startTime: onboardingSession.startTime
    });

    // Track demo handoff if applicable
    if (demoContext) {
      onboardingAnalytics.demoHandoffs.push({
        onboardingId,
        demoSessionId: demoContext.sessionId,
        conversionIntent: demoContext.conversionIntent,
        timeSpent: demoContext.timeSpent,
        featuresExplored: demoContext.featuresExplored,
        roiContext: !!roiContext
      });
    }

    console.log(`Onboarding started: ${onboardingId} with mode: ${onboardingSession.mode}`);

    res.json({
      success: true,
      onboardingId,
      mode: onboardingSession.mode,
      estimatedTime: onboardingSession.estimatedTime,
      message: 'Onboarding session started successfully'
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start onboarding'
    });
  }
});

// PUT /api/onboarding/update-step
router.put('/update-step', (req, res) => {
  try {
    const { onboardingId, stepId, stepData, completed } = req.body;
    
    const session = onboardingSessions.get(onboardingId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding session not found'
      });
    }

    // Update step
    const step = {
      stepId,
      stepData,
      completed,
      completedAt: completed ? new Date().toISOString() : null
    };

    session.steps.push(step);
    session.currentStep = session.steps.length;

    console.log(`Step updated: ${stepId} for onboarding: ${onboardingId}`);

    res.json({
      success: true,
      currentStep: session.currentStep,
      message: 'Step updated successfully'
    });
  } catch (error) {
    console.error('Error updating step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update step'
    });
  }
});

// POST /api/onboarding/complete
router.post('/complete', (req, res) => {
  try {
    const { onboardingId, finalData } = req.body;
    
    const session = onboardingSessions.get(onboardingId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding session not found'
      });
    }

    // Complete onboarding
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.finalData = finalData;
    session.totalTime = new Date(session.completedAt) - new Date(session.startTime);

    // Track completion analytics
    onboardingAnalytics.completions.push({
      onboardingId,
      mode: session.mode,
      hasDemoContext: !!session.demoContext,
      totalTime: session.totalTime,
      stepsCompleted: session.steps.length,
      completedAt: session.completedAt
    });

    console.log(`Onboarding completed: ${onboardingId} in ${session.totalTime}ms`);

    res.json({
      success: true,
      onboardingId,
      mode: session.mode,
      totalTime: session.totalTime,
      stepsCompleted: session.steps.length,
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
});

// GET /api/onboarding/analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = {
      totalSessions: onboardingAnalytics.sessions.length,
      completedSessions: onboardingAnalytics.completions.length,
      demoHandoffs: onboardingAnalytics.demoHandoffs.length,
      completionRate: onboardingAnalytics.sessions.length > 0 
        ? (onboardingAnalytics.completions.length / onboardingAnalytics.sessions.length) * 100
        : 0,
      averageTime: onboardingAnalytics.completions.length > 0
        ? onboardingAnalytics.completions.reduce((sum, c) => sum + c.totalTime, 0) / onboardingAnalytics.completions.length
        : 0,
      modeDistribution: {
        'express-setup': onboardingAnalytics.completions.filter(c => c.mode === 'express-setup').length,
        'demo-handoff': onboardingAnalytics.completions.filter(c => c.mode === 'demo-handoff').length,
        'standard': onboardingAnalytics.completions.filter(c => c.mode === 'standard').length
      },
      demoHandoffSuccess: onboardingAnalytics.demoHandoffs.length > 0
        ? (onboardingAnalytics.completions.filter(c => c.hasDemoContext).length / onboardingAnalytics.demoHandoffs.length) * 100
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

// GET /api/onboarding/session/:onboardingId
router.get('/session/:onboardingId', (req, res) => {
  try {
    const { onboardingId } = req.params;
    const session = onboardingSessions.get(onboardingId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding session not found'
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

// GET /api/onboarding/context/:onboardingId
router.get('/context/:onboardingId', (req, res) => {
  try {
    const { onboardingId } = req.params;
    const session = onboardingSessions.get(onboardingId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding session not found'
      });
    }

    // Return context for onboarding flow
    const context = {
      demoContext: session.demoContext,
      prefilledData: session.prefilledData,
      roiContext: session.roiContext,
      signupData: session.signupData,
      mode: session.mode,
      recommendedPath: session.recommendedPath
    };

    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get context'
    });
  }
});

module.exports = router; 