// api/decisions.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const { checkJwt, requireOrganizationAccess } = require('./auth/auth0-middleware');

// GET /api/decisions/explain/:decisionId
// Fetch decision rationale and explanation data
router.get('/explain/:decisionId', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const organizationId = req.user.organizationId;

    // Validate decision ID format
    if (!decisionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decisionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid decision ID format'
      });
    }

    // Fetch decision details from audit_entries table
    const decisionQuery = `
      SELECT 
        ae.entry_id,
        ae.agent,
        ae.decision_type,
        ae.decision,
        ae.reasoning,
        ae.confidence_score,
        ae.compliance_score,
        ae.risk_level,
        ae.risk_score,
        ae.risk_factors,
        ae.confidence_factors,
        ae.before_state,
        ae.after_state,
        ae.status,
        ae.processing_time_ms,
        ae.timestamp,
        ae.metadata,
        as.session_id,
        as.final_decision
      FROM audit_entries ae
      JOIN audit_sessions as ON ae.session_id = as.session_id
      WHERE ae.entry_id = $1 
      AND as.organization_id = $2
    `;

    const decisionResult = await pool.query(decisionQuery, [decisionId, organizationId]);

    if (decisionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found or access denied'
      });
    }

    const decision = decisionResult.rows[0];

    // Fetch policy references for this decision
    const policyQuery = `
      SELECT 
        apr.policy_id,
        apr.policy_name,
        apr.policy_version,
        apr.policy_section,
        apr.relevance,
        apr.impact,
        apr.description
      FROM audit_policy_references apr
      WHERE apr.entry_id = $1
      ORDER BY apr.relevance DESC
    `;

    const policyResult = await pool.query(policyQuery, [decisionId]);

    // Fetch alternative outcomes from metadata or calculate based on risk factors
    const alternativeOutcomes = generateAlternativeOutcomes(decision);

    // Build the explanation response
    const explanation = {
      decision_id: decision.entry_id,
      decision_type: decision.decision_type,
      agent: decision.agent,
      timestamp: decision.timestamp,
      policies_evaluated: policyResult.rows.map(policy => ({
        policy_name: policy.policy_name,
        policy_version: policy.policy_version,
        policy_section: policy.policy_section,
        weight: Math.round(policy.relevance * 100),
        status: policy.impact === 'positive' ? 'passed' : 
                policy.impact === 'negative' ? 'failed' : 'neutral',
        rule_triggered: policy.description || 'policy_evaluation',
        relevance_score: policy.relevance
      })),
      key_factors: extractKeyFactors(decision),
      final_calculation: {
        risk_score: Math.round((decision.risk_score || 0) * 100),
        outcome: decision.status,
        confidence: decision.confidence_score,
        compliance_score: decision.compliance_score,
        processing_time_ms: decision.processing_time_ms
      },
      alternative_outcomes: alternativeOutcomes,
      reasoning: decision.reasoning,
      before_state: decision.before_state,
      after_state: decision.after_state,
      metadata: decision.metadata
    };

    res.json({
      success: true,
      explanation
    });

  } catch (error) {
    console.error('Error fetching decision explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision explanation'
    });
  }
});

// GET /api/decisions/:decisionId/policies
// Get detailed policy evaluation for a decision
router.get('/:decisionId/policies', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const organizationId = req.user.organizationId;

    // Fetch detailed policy evaluation
    const policyQuery = `
      SELECT 
        apr.policy_id,
        apr.policy_name,
        apr.policy_version,
        apr.policy_section,
        apr.relevance,
        apr.impact,
        apr.description,
        p.rules,
        p.risk_profiles
      FROM audit_policy_references apr
      LEFT JOIN policies p ON apr.policy_id = p.id
      WHERE apr.entry_id = $1
      ORDER BY apr.relevance DESC
    `;

    const policyResult = await pool.query(policyQuery, [decisionId]);

    const policies = policyResult.rows.map(policy => ({
      policy_id: policy.policy_id,
      policy_name: policy.policy_name,
      policy_version: policy.policy_version,
      policy_section: policy.policy_section,
      relevance_score: policy.relevance,
      impact: policy.impact,
      description: policy.description,
      rules: policy.rules,
      risk_profiles: policy.risk_profiles
    }));

    res.json({
      success: true,
      policies
    });

  } catch (error) {
    console.error('Error fetching decision policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision policies'
    });
  }
});

// GET /api/decisions/:decisionId/confidence
// Get confidence breakdown for a decision
router.get('/:decisionId/confidence', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const organizationId = req.user.organizationId;

    // Fetch confidence factors
    const confidenceQuery = `
      SELECT 
        confidence_score,
        confidence_factors,
        uncertainty_level,
        risk_factors
      FROM audit_entries
      WHERE entry_id = $1
    `;

    const confidenceResult = await pool.query(confidenceQuery, [decisionId]);

    if (confidenceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    const confidence = confidenceResult.rows[0];

    const confidenceBreakdown = {
      overall_confidence: confidence.confidence_score,
      uncertainty_level: confidence.uncertainty_level,
      confidence_factors: confidence.confidence_factors || [],
      risk_factors: confidence.risk_factors || [],
      confidence_level: getConfidenceLevel(confidence.confidence_score),
      recommendations: generateConfidenceRecommendations(confidence)
    };

    res.json({
      success: true,
      confidence: confidenceBreakdown
    });

  } catch (error) {
    console.error('Error fetching decision confidence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision confidence'
    });
  }
});

// Helper functions

function extractKeyFactors(decision) {
  const factors = [];
  
  // Extract factors from risk_factors
  if (decision.risk_factors && Array.isArray(decision.risk_factors)) {
    decision.risk_factors.forEach(factor => {
      factors.push({
        factor: factor.name || 'risk_factor',
        impact: factor.impact || 0,
        description: factor.description || 'Risk factor identified'
      });
    });
  }

  // Extract factors from confidence_factors
  if (decision.confidence_factors && Array.isArray(decision.confidence_factors)) {
    decision.confidence_factors.forEach(factor => {
      factors.push({
        factor: factor.name || 'confidence_factor',
        impact: factor.impact || 0,
        description: factor.description || 'Confidence factor identified'
      });
    });
  }

  // Add default factors based on decision data
  if (decision.risk_level) {
    factors.push({
      factor: 'risk_level',
      impact: decision.risk_level === 'high' ? -20 : 
              decision.risk_level === 'medium' ? -10 : 0,
      description: `Risk level: ${decision.risk_level}`
    });
  }

  if (decision.compliance_score) {
    factors.push({
      factor: 'compliance_score',
      impact: decision.compliance_score >= 0.9 ? 15 : 
              decision.compliance_score >= 0.8 ? 5 : -10,
      description: `Compliance score: ${Math.round(decision.compliance_score * 100)}%`
    });
  }

  return factors;
}

function generateAlternativeOutcomes(decision) {
  const alternatives = [];
  
  // Generate alternative outcomes based on risk factors and confidence
  if (decision.risk_score > 0.7) {
    alternatives.push({
      outcome: 'rejected',
      probability: 0.3,
      reason: 'High risk factors identified',
      impact: 'Content would be rejected due to compliance concerns'
    });
  }

  if (decision.confidence_score < 0.8) {
    alternatives.push({
      outcome: 'human_review',
      probability: 0.4,
      reason: 'Low confidence score',
      impact: 'Decision would require human review'
    });
  }

  if (decision.compliance_score < 0.9) {
    alternatives.push({
      outcome: 'conditional_approval',
      probability: 0.25,
      reason: 'Moderate compliance score',
      impact: 'Approval with additional monitoring requirements'
    });
  }

  // Add the actual outcome
  alternatives.push({
    outcome: decision.status,
    probability: 1.0,
    reason: 'Actual decision outcome',
    impact: 'Current decision result',
    is_actual: true
  });

  return alternatives;
}

function getConfidenceLevel(confidenceScore) {
  if (confidenceScore >= 0.9) return 'high';
  if (confidenceScore >= 0.7) return 'medium';
  return 'low';
}

function generateConfidenceRecommendations(confidence) {
  const recommendations = [];

  if (confidence.confidence_score < 0.8) {
    recommendations.push({
      type: 'warning',
      message: 'Consider human review for low confidence decision',
      action: 'escalate_to_human'
    });
  }

  if (confidence.uncertainty_level > 0.3) {
    recommendations.push({
      type: 'info',
      message: 'High uncertainty detected - additional context may help',
      action: 'gather_more_context'
    });
  }

  if (confidence.risk_factors && confidence.risk_factors.length > 2) {
    recommendations.push({
      type: 'warning',
      message: 'Multiple risk factors identified - consider policy review',
      action: 'review_policies'
    });
  }

  return recommendations;
}

module.exports = router; 