// api/overrides.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const { checkJwt, requireOrganizationAccess, requirePermission } = require('./auth/auth0-middleware');

// GET /api/overrides/reasons
// Get all available override reasons
router.get('/reasons', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const query = `
      SELECT 
        reason_code,
        reason_name,
        description,
        category,
        requires_justification,
        requires_review
      FROM override_reasons
      ORDER BY category, reason_name
    `;

    const result = await pool.query(query);
    
    // Group by category
    const reasonsByCategory = result.rows.reduce((acc, reason) => {
      if (!acc[reason.category]) {
        acc[reason.category] = [];
      }
      acc[reason.category].push(reason);
      return acc;
    }, {});

    res.json({
      success: true,
      reasons: reasonsByCategory
    });

  } catch (error) {
    console.error('Error fetching override reasons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch override reasons'
    });
  }
});

// POST /api/overrides/request
// Request a human override for a decision
router.post('/request', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { 
      decisionId, 
      reason, 
      justification, 
      priority = 'normal',
      assignedReviewer = null 
    } = req.body;
    
    const userId = req.user.sub;

    // Validate required fields
    if (!decisionId || !reason || !justification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: decisionId, reason, justification'
      });
    }

    // Check if override already exists
    const existingOverride = await pool.query(
      'SELECT override_requested FROM audit_entries WHERE entry_id = $1',
      [decisionId]
    );

    if (existingOverride.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    if (existingOverride.rows[0].override_requested) {
      return res.status(409).json({
        success: false,
        error: 'Override already requested for this decision'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update audit entry with override request
      const updateQuery = `
        UPDATE audit_entries 
        SET 
          override_requested = TRUE,
          override_reason = $1,
          override_justification = $2,
          override_status = 'pending',
          override_requested_by = $3,
          override_requested_at = NOW()
        WHERE entry_id = $4
      `;

      await client.query(updateQuery, [reason, justification, userId, decisionId]);

      // Create workflow if reviewer is assigned
      if (assignedReviewer) {
        const workflowQuery = `
          INSERT INTO override_workflows (
            entry_id, workflow_type, current_step, status, assigned_reviewer, priority
          ) VALUES ($1, 'standard', 'review', 'active', $2, $3)
        `;
        await client.query(workflowQuery, [decisionId, assignedReviewer, priority]);
      }

      // Log the override request
      const logQuery = `
        SELECT log_override_activity($1, 'request_override', $2, $3)
      `;
      await client.query(logQuery, [
        decisionId, 
        userId, 
        JSON.stringify({ reason, justification, priority, assignedReviewer })
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Override request submitted successfully',
        overrideId: decisionId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error requesting override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request override'
    });
  }
});

// GET /api/overrides/pending
// Get pending override requests
router.get('/pending', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        ae.entry_id,
        ae.agent,
        ae.decision_type,
        ae.status as original_status,
        ae.override_reason,
        ae.override_justification,
        ae.override_status,
        ae.override_requested_at,
        u1.email as requested_by_email,
        u2.email as reviewed_by_email,
        ae.override_review_notes,
        EXTRACT(EPOCH FROM (NOW() - ae.override_requested_at))/3600 as hours_pending
      FROM audit_entries ae
      LEFT JOIN users u1 ON ae.override_requested_by = u1.id
      LEFT JOIN users u2 ON ae.override_reviewed_by = u2.id
      WHERE ae.override_requested = TRUE 
      AND ae.override_status = $1
      ORDER BY ae.override_requested_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [status, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_entries 
      WHERE override_requested = TRUE AND override_status = $1
    `;
    const countResult = await pool.query(countQuery, [status]);

    res.json({
      success: true,
      overrides: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending overrides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending overrides'
    });
  }
});

// POST /api/overrides/:decisionId/review
// Review and approve/reject an override request
router.post('/:decisionId/review', checkJwt, requireOrganizationAccess, requirePermission('review_overrides'), async (req, res) => {
  try {
    const { decisionId } = req.params;
    const { action, notes, newDecision = null } = req.body;
    const reviewerId = req.user.sub;

    // Validate action
    if (!['approved', 'rejected', 'cancelled'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be approved, rejected, or cancelled'
      });
    }

    // Check if override exists and is pending
    const overrideQuery = `
      SELECT override_status, override_requested 
      FROM audit_entries 
      WHERE entry_id = $1
    `;
    const overrideResult = await pool.query(overrideQuery, [decisionId]);

    if (overrideResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    if (!overrideResult.rows[0].override_requested) {
      return res.status(400).json({
        success: false,
        error: 'No override requested for this decision'
      });
    }

    if (overrideResult.rows[0].override_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Override is not in pending status'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update override status
      const updateQuery = `
        UPDATE audit_entries 
        SET 
          override_status = $1,
          override_reviewed_by = $2,
          override_review_notes = $3,
          override_resolved_at = NOW()
        WHERE entry_id = $4
      `;
      await client.query(updateQuery, [action, reviewerId, notes, decisionId]);

      // If approved and new decision provided, update the decision
      if (action === 'approved' && newDecision) {
        const decisionUpdateQuery = `
          UPDATE audit_entries 
          SET 
            status = $1,
            decision = $2,
            reasoning = $3
          WHERE entry_id = $4
        `;
        await client.query(decisionUpdateQuery, [
          newDecision.status,
          JSON.stringify(newDecision.decision),
          newDecision.reasoning,
          decisionId
        ]);
      }

      // Update workflow status
      const workflowQuery = `
        UPDATE override_workflows 
        SET 
          status = 'completed',
          current_step = 'resolved',
          updated_at = NOW()
        WHERE entry_id = $1
      `;
      await client.query(workflowQuery, [decisionId]);

      // Log the review action
      const logQuery = `
        SELECT log_override_activity($1, 'review_override', $2, $3)
      `;
      await client.query(logQuery, [
        decisionId,
        reviewerId,
        JSON.stringify({ action, notes, newDecision })
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Override ${action} successfully`,
        decisionId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error reviewing override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review override'
    });
  }
});

// GET /api/overrides/:decisionId/history
// Get override history for a decision
router.get('/:decisionId/history', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;

    const query = `
      SELECT 
        oal.action_type,
        oal.action_details,
        oal.timestamp,
        u.email as action_by_email
      FROM override_audit_log oal
      LEFT JOIN users u ON oal.action_by = u.id
      WHERE oal.entry_id = $1
      ORDER BY oal.timestamp DESC
    `;

    const result = await pool.query(query, [decisionId]);

    res.json({
      success: true,
      history: result.rows
    });

  } catch (error) {
    console.error('Error fetching override history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch override history'
    });
  }
});

// GET /api/overrides/dashboard
// Get override dashboard statistics
router.get('/dashboard', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { organizationId } = req.user;

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_overrides,
        COUNT(CASE WHEN override_status = 'pending' THEN 1 END) as pending_overrides,
        COUNT(CASE WHEN override_status = 'approved' THEN 1 END) as approved_overrides,
        COUNT(CASE WHEN override_status = 'rejected' THEN 1 END) as rejected_overrides,
        AVG(EXTRACT(EPOCH FROM (override_resolved_at - override_requested_at))/3600) as avg_resolution_hours
      FROM audit_entries 
      WHERE override_requested = TRUE
    `;

    const statsResult = await pool.query(statsQuery);

    // Get recent overrides
    const recentQuery = `
      SELECT 
        entry_id,
        agent,
        decision_type,
        override_reason,
        override_status,
        override_requested_at,
        u.email as requested_by_email
      FROM audit_entries ae
      LEFT JOIN users u ON ae.override_requested_by = u.id
      WHERE ae.override_requested = TRUE
      ORDER BY ae.override_requested_at DESC
      LIMIT 10
    `;

    const recentResult = await pool.query(recentQuery);

    // Get override reasons breakdown
    const reasonsQuery = `
      SELECT 
        override_reason,
        COUNT(*) as count
      FROM audit_entries 
      WHERE override_requested = TRUE
      GROUP BY override_reason
      ORDER BY count DESC
    `;

    const reasonsResult = await pool.query(reasonsQuery);

    res.json({
      success: true,
      dashboard: {
        statistics: statsResult.rows[0],
        recentOverrides: recentResult.rows,
        reasonsBreakdown: reasonsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching override dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch override dashboard'
    });
  }
});

// POST /api/overrides/:decisionId/cancel
// Cancel an override request
router.post('/:decisionId/cancel', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const { reason } = req.body;
    const userId = req.user.sub;

    // Check if override exists and is pending
    const overrideQuery = `
      SELECT override_status, override_requested 
      FROM audit_entries 
      WHERE entry_id = $1
    `;
    const overrideResult = await pool.query(overrideQuery, [decisionId]);

    if (overrideResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    if (!overrideResult.rows[0].override_requested) {
      return res.status(400).json({
        success: false,
        error: 'No override requested for this decision'
      });
    }

    if (overrideResult.rows[0].override_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Override is not in pending status'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Cancel the override
      const updateQuery = `
        UPDATE audit_entries 
        SET 
          override_status = 'cancelled',
          override_reviewed_by = $1,
          override_review_notes = $2,
          override_resolved_at = NOW()
        WHERE entry_id = $3
      `;
      await client.query(updateQuery, [userId, reason, decisionId]);

      // Log the cancellation
      const logQuery = `
        SELECT log_override_activity($1, 'cancel_override', $2, $3)
      `;
      await client.query(logQuery, [
        decisionId,
        userId,
        JSON.stringify({ reason })
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Override cancelled successfully',
        decisionId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error cancelling override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel override'
    });
  }
});

module.exports = router; 