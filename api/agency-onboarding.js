// api/agency-onboarding.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const { checkJwt, requireOrganizationAccess, requirePermission } = require('./auth/auth0-middleware');
const crypto = require('crypto');

// ===== ENTERPRISE ENDPOINTS =====

// POST /api/agency-onboarding/invite
// Enterprise invites an agency to join
router.post('/invite', checkJwt, requireOrganizationAccess, requirePermission('agency:invite'), async (req, res) => {
  try {
    const { agencyEmail, agencyName } = req.body;
    const enterpriseOrgId = req.user.organizationId;
    const invitedBy = req.user.sub;

    // Validate required fields
    if (!agencyEmail || !agencyName) {
      return res.status(400).json({
        success: false,
        error: 'Agency email and name are required'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await pool.query(
      'SELECT id FROM agency_invitations WHERE enterprise_org_id = $1 AND agency_email = $2 AND status = $3',
      [enterpriseOrgId, agencyEmail, 'pending']
    );

    if (existingInvitation.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Invitation already sent to this agency'
      });
    }

    // Create invitation
    const invitationResult = await pool.query(`
      INSERT INTO agency_invitations (
        enterprise_org_id, agency_email, agency_name, invited_by
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [enterpriseOrgId, agencyEmail, agencyName, invitedBy]);

    const invitation = invitationResult.rows[0];

    // Log the action
    await pool.query(`
      SELECT log_agency_action($1, $2, $3, $4, $5)
    `, [
      null, // agency_org_id (not yet created)
      enterpriseOrgId,
      'send_invitation',
      invitedBy,
      JSON.stringify({ agencyEmail, agencyName, invitationId: invitation.id })
    ]);

    res.json({
      success: true,
      message: 'Agency invitation sent successfully',
      invitation: {
        id: invitation.id,
        agencyEmail: invitation.agency_email,
        agencyName: invitation.agency_name,
        status: invitation.status,
        expiresAt: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Error sending agency invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send agency invitation'
    });
  }
});

// GET /api/agency-onboarding/invitations
// Get all agency invitations for enterprise
router.get('/invitations', checkJwt, requireOrganizationAccess, requirePermission('agency:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const enterpriseOrgId = req.user.organizationId;

    let query = `
      SELECT 
        ai.*,
        u.email as invited_by_email,
        aer.relationship_status,
        aer.compliance_score
      FROM agency_invitations ai
      LEFT JOIN users u ON ai.invited_by = u.id
      LEFT JOIN agency_enterprise_relationships aer ON ai.enterprise_org_id = aer.enterprise_org_id 
        AND ai.agency_email = (SELECT email FROM users WHERE organization_id = aer.agency_org_id LIMIT 1)
      WHERE ai.enterprise_org_id = $1
    `;

    const params = [enterpriseOrgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ai.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY ai.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM agency_invitations 
      WHERE enterprise_org_id = $1
    `;
    const countParams = [enterpriseOrgId];

    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      invitations: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching agency invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agency invitations'
    });
  }
});

// POST /api/agency-onboarding/:invitationId/resend
// Resend agency invitation
router.post('/:invitationId/resend', checkJwt, requireOrganizationAccess, requirePermission('agency:invite'), async (req, res) => {
  try {
    const { invitationId } = req.params;
    const enterpriseOrgId = req.user.organizationId;

    // Update invitation with new expiry
    const updateResult = await pool.query(`
      UPDATE agency_invitations 
      SET 
        expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
      WHERE id = $1 AND enterprise_org_id = $2 AND status = 'pending'
      RETURNING *
    `, [invitationId, enterpriseOrgId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or already accepted'
      });
    }

    const invitation = updateResult.rows[0];

    // Log the action
    await pool.query(`
      SELECT log_agency_action($1, $2, $3, $4, $5)
    `, [
      null,
      enterpriseOrgId,
      'resend_invitation',
      req.user.sub,
      JSON.stringify({ invitationId, agencyEmail: invitation.agency_email })
    ]);

    res.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: {
        id: invitation.id,
        agencyEmail: invitation.agency_email,
        agencyName: invitation.agency_name,
        status: invitation.status,
        expiresAt: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation'
    });
  }
});

// ===== AGENCY ENDPOINTS =====

// GET /api/agency-onboarding/accept/:token
// Agency accepts invitation using token
router.get('/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation by token
    const invitationResult = await pool.query(`
      SELECT * FROM agency_invitations 
      WHERE invitation_token = $1 AND status = 'pending' AND expires_at > NOW()
    `, [token]);

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation token'
      });
    }

    const invitation = invitationResult.rows[0];

    res.json({
      success: true,
      invitation: {
        id: invitation.id,
        agencyEmail: invitation.agency_email,
        agencyName: invitation.agency_name,
        enterpriseOrgId: invitation.enterprise_org_id,
        expiresAt: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Error validating invitation token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate invitation'
    });
  }
});

// POST /api/agency-onboarding/register
// Agency completes registration
router.post('/register', async (req, res) => {
  try {
    const { 
      invitationToken, 
      agencyName, 
      agencyEmail, 
      password,
      contactPerson,
      phone,
      website,
      specialties 
    } = req.body;

    // Validate invitation
    const invitationResult = await pool.query(`
      SELECT * FROM agency_invitations 
      WHERE invitation_token = $1 AND status = 'pending' AND expires_at > NOW()
    `, [invitationToken]);

    if (invitationResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invitation token'
      });
    }

    const invitation = invitationResult.rows[0];

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create agency organization
      const orgResult = await client.query(`
        INSERT INTO organizations (name, type, settings)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [
        agencyName,
        'agency',
        JSON.stringify({
          contactPerson,
          phone,
          website,
          specialties: specialties || [],
          onboardingCompleted: false
        })
      ]);

      const agencyOrg = orgResult.rows[0];

      // Create agency user
      const userResult = await client.query(`
        INSERT INTO users (email, organization_id, role)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [agencyEmail, agencyOrg.id, 'agency_admin']);

      const agencyUser = userResult.rows[0];

      // Create agency-enterprise relationship
      await client.query(`
        INSERT INTO agency_enterprise_relationships (
          agency_org_id, enterprise_org_id, relationship_status
        ) VALUES ($1, $2, $3)
      `, [agencyOrg.id, invitation.enterprise_org_id, 'pending']);

      // Update invitation status
      await client.query(`
        UPDATE agency_invitations 
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = $1
      `, [invitation.id]);

      // Initialize onboarding progress
      const stepsResult = await client.query('SELECT * FROM agency_onboarding_steps ORDER BY step_order');
      for (const step of stepsResult.rows) {
        await client.query(`
          INSERT INTO agency_onboarding_progress (
            agency_org_id, enterprise_org_id, step_id, status
          ) VALUES ($1, $2, $3, $4)
        `, [
          agencyOrg.id,
          invitation.enterprise_org_id,
          step.id,
          step.step_order === 1 ? 'completed' : 'pending'
        ]);
      }

      await client.query('COMMIT');

      // Log the action
      await pool.query(`
        SELECT log_agency_action($1, $2, $3, $4, $5)
      `, [
        agencyOrg.id,
        invitation.enterprise_org_id,
        'agency_registration',
        agencyUser.id,
        JSON.stringify({ agencyName, agencyEmail })
      ]);

      res.json({
        success: true,
        message: 'Agency registration completed successfully',
        agency: {
          id: agencyOrg.id,
          name: agencyOrg.name,
          email: agencyEmail,
          status: 'pending_approval'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error completing agency registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete agency registration'
    });
  }
});

// ===== AI TOOLS SUBMISSION =====

// POST /api/agency-onboarding/tools
// Agency submits AI tools for approval
router.post('/tools', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { 
      toolName, 
      toolDescription, 
      toolType, 
      toolUrl, 
      complianceDocumentation 
    } = req.body;
    
    const agencyOrgId = req.user.organizationId;

    // Get enterprise relationship
    const relationshipResult = await pool.query(`
      SELECT enterprise_org_id FROM agency_enterprise_relationships 
      WHERE agency_org_id = $1 AND relationship_status = 'active'
    `, [agencyOrgId]);

    if (relationshipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'No active enterprise relationship found'
      });
    }

    const enterpriseOrgId = relationshipResult.rows[0].enterprise_org_id;

    // Submit AI tool
    const toolResult = await pool.query(`
      INSERT INTO agency_ai_tools (
        agency_org_id, enterprise_org_id, tool_name, tool_description, 
        tool_type, tool_url, compliance_documentation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      agencyOrgId, enterpriseOrgId, toolName, toolDescription,
      toolType, toolUrl, JSON.stringify(complianceDocumentation)
    ]);

    const tool = toolResult.rows[0];

    // Log the action
    await pool.query(`
      SELECT log_agency_action($1, $2, $3, $4, $5)
    `, [
      agencyOrgId,
      enterpriseOrgId,
      'submit_ai_tool',
      req.user.sub,
      JSON.stringify({ toolId: tool.id, toolName, toolType })
    ]);

    res.json({
      success: true,
      message: 'AI tool submitted successfully',
      tool: {
        id: tool.id,
        name: tool.tool_name,
        type: tool.tool_type,
        status: tool.submission_status
      }
    });

  } catch (error) {
    console.error('Error submitting AI tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit AI tool'
    });
  }
});

// GET /api/agency-onboarding/tools
// Get AI tools for agency or enterprise
router.get('/tools', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const orgId = req.user.organizationId;
    const userRole = req.user.role;

    let query;
    const params = [];

    if (userRole === 'agency_admin' || userRole === 'agency_user') {
      // Agency viewing their own tools
      query = `
        SELECT aat.*, aer.relationship_status
        FROM agency_ai_tools aat
        JOIN agency_enterprise_relationships aer ON aat.agency_org_id = aer.agency_org_id 
          AND aat.enterprise_org_id = aer.enterprise_org_id
        WHERE aat.agency_org_id = $1
      `;
      params.push(orgId);
    } else {
      // Enterprise viewing tools from their agencies
      query = `
        SELECT aat.*, o.name as agency_name, u.email as submitted_by_email
        FROM agency_ai_tools aat
        JOIN organizations o ON aat.agency_org_id = o.id
        JOIN users u ON aat.agency_org_id = u.organization_id
        WHERE aat.enterprise_org_id = $1
      `;
      params.push(orgId);
    }

    if (status) {
      query += ` AND aat.submission_status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY aat.submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      tools: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length // Simplified for now
      }
    });

  } catch (error) {
    console.error('Error fetching AI tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI tools'
    });
  }
});

// POST /api/agency-onboarding/tools/:toolId/review
// Enterprise reviews AI tool submission
router.post('/tools/:toolId/review', checkJwt, requireOrganizationAccess, requirePermission('agency:review'), async (req, res) => {
  try {
    const { toolId } = req.params;
    const { action, reviewNotes } = req.body;
    const reviewerId = req.user.sub;
    const enterpriseOrgId = req.user.organizationId;

    // Validate action
    if (!['approved', 'rejected', 'under_review'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be approved, rejected, or under_review'
      });
    }

    // Update tool status
    const updateResult = await pool.query(`
      UPDATE agency_ai_tools 
      SET 
        submission_status = $1,
        reviewed_by = $2,
        review_notes = $3,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $4 AND enterprise_org_id = $5
      RETURNING *
    `, [action, reviewerId, reviewNotes, toolId, enterpriseOrgId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    const tool = updateResult.rows[0];

    // Log the action
    await pool.query(`
      SELECT log_agency_action($1, $2, $3, $4, $5)
    `, [
      tool.agency_org_id,
      enterpriseOrgId,
      'review_ai_tool',
      reviewerId,
      JSON.stringify({ toolId, action, reviewNotes })
    ]);

    res.json({
      success: true,
      message: `Tool ${action} successfully`,
      tool: {
        id: tool.id,
        name: tool.tool_name,
        status: tool.submission_status,
        reviewedAt: tool.reviewed_at
      }
    });

  } catch (error) {
    console.error('Error reviewing AI tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review AI tool'
    });
  }
});

// ===== DASHBOARD ENDPOINTS =====

// GET /api/agency-onboarding/dashboard
// Get onboarding dashboard data
router.get('/dashboard', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const userRole = req.user.role;

    let dashboardQuery;
    const params = [];

    if (userRole === 'agency_admin' || userRole === 'agency_user') {
      // Agency dashboard
      dashboardQuery = `
        SELECT 
          aer.relationship_status,
          aer.compliance_score,
          aer.last_audit_date,
          COUNT(DISTINCT aat.id) as tools_submitted,
          COUNT(DISTINCT CASE WHEN aat.submission_status = 'approved' THEN aat.id END) as tools_approved,
          COUNT(DISTINCT aop.id) as completed_steps,
          (SELECT COUNT(*) FROM agency_onboarding_steps) as total_steps
        FROM agency_enterprise_relationships aer
        LEFT JOIN agency_ai_tools aat ON aer.agency_org_id = aat.agency_org_id 
          AND aer.enterprise_org_id = aat.enterprise_org_id
        LEFT JOIN agency_onboarding_progress aop ON aer.agency_org_id = aop.agency_org_id 
          AND aer.enterprise_org_id = aop.enterprise_org_id AND aop.status = 'completed'
        WHERE aer.agency_org_id = $1
        GROUP BY aer.relationship_status, aer.compliance_score, aer.last_audit_date
      `;
      params.push(orgId);
    } else {
      // Enterprise dashboard
      dashboardQuery = `
        SELECT 
          COUNT(DISTINCT ai.id) as total_invitations,
          COUNT(DISTINCT CASE WHEN ai.status = 'pending' THEN ai.id END) as pending_invitations,
          COUNT(DISTINCT CASE WHEN ai.status = 'accepted' THEN ai.id END) as accepted_invitations,
          COUNT(DISTINCT aer.agency_org_id) as active_agencies,
          COUNT(DISTINCT aat.id) as total_tools_submitted,
          COUNT(DISTINCT CASE WHEN aat.submission_status = 'approved' THEN aat.id END) as approved_tools,
          AVG(aer.compliance_score) as avg_compliance_score
        FROM agency_invitations ai
        LEFT JOIN agency_enterprise_relationships aer ON ai.enterprise_org_id = aer.enterprise_org_id
        LEFT JOIN agency_ai_tools aat ON aer.agency_org_id = aat.agency_org_id 
          AND aer.enterprise_org_id = aat.enterprise_org_id
        WHERE ai.enterprise_org_id = $1
      `;
      params.push(orgId);
    }

    const dashboardResult = await pool.query(dashboardQuery, params);

    res.json({
      success: true,
      dashboard: dashboardResult.rows[0] || {}
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

module.exports = router; 