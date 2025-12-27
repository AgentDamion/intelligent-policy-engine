import express from 'express';
const router = express.Router();
import pool from '../database/connection.js';
import { checkJwt, requireOrganizationAccess } from './auth/auth0-middleware.js';

// POST /api/tool-submission
// Save a partner's tool submission
router.post('/', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const {
      toolName,
      vendor,
      category,
      riskScore = null,
      policyVersion,
      workspaceId,
      description = null,
      toolUrl = null
    } = req.body;

    if (!toolName || !vendor || !category || !policyVersion || !workspaceId) {
      return res.status(400).json({
        error: 'toolName, vendor, category, policyVersion, and workspaceId are required'
      });
    }

    const agencyOrgId = req.user.organizationId;

    // Resolve the enterprise relationship for this agency
    const rel = await pool.query(
      `SELECT enterprise_org_id FROM agency_enterprise_relationships 
       WHERE agency_org_id = $1 AND relationship_status IN ('active','pending')
       ORDER BY (relationship_status = 'active') DESC
       LIMIT 1`,
      [agencyOrgId]
    );

    if (rel.rows.length === 0) {
      return res.status(403).json({ error: 'No enterprise relationship found for agency' });
    }

    const enterpriseOrgId = rel.rows[0].enterprise_org_id;

    // Pack submission context into existing JSONB column
    const submissionContext = {
      vendor,
      category,
      riskScore,
      policyVersion,
      workspaceId
    };

    const insert = await pool.query(`
      INSERT INTO agency_ai_tools (
        agency_org_id,
        enterprise_org_id,
        tool_name,
        tool_description,
        tool_type,
        tool_url,
        compliance_documentation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING id, submission_status, submitted_at
    `, [
      agencyOrgId,
      enterpriseOrgId,
      toolName,
      description,
      category,
      toolUrl,
      JSON.stringify(submissionContext)
    ]);

    const record = insert.rows[0];

    // Optional: log agency action (function may not exist in all envs)
    try {
      await pool.query('SELECT log_agency_action($1, $2, $3, $4, $5)', [
        agencyOrgId,
        enterpriseOrgId,
        'partner_tool_submission',
        req.user.sub || null,
        JSON.stringify({ toolName, vendor, category, policyVersion, workspaceId })
      ]);
    } catch (e) {
      // Ignore logging failures in non-migrated dbs
    }

    res.status(201).json({
      success: true,
      toolId: record.id,
      status: record.submission_status,
      submittedAt: record.submitted_at
    });
  } catch (error) {
    console.error('Error creating tool submission:', error);
    res.status(500).json({ error: 'Failed to create tool submission' });
  }
});

export default router;


