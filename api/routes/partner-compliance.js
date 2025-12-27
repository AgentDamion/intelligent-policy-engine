import express from 'express';
const router = express.Router();
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || process.env.SUPABASE_DB_HOST || 'localhost',
  port: process.env.DB_PORT || process.env.SUPABASE_DB_PORT || 5432,
  database: process.env.DB_NAME || process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.DB_USER || process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD || 'postgres',
});

// Partner authentication middleware (API key or OAuth)
const authenticatePartner = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  // Check for API key authentication
  if (authHeader.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7);
    
    // Hash the API key and look it up
    // TODO: Implement proper API key hashing and lookup
    const result = await pool.query(
      `SELECT partner_id, scopes, is_active, expires_at
      FROM partner_api_keys
      WHERE api_key_hash = $1 AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())`,
      [apiKey] // In production, hash the key first
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyData = result.rows[0];
    req.partner = {
      partner_id: keyData.partner_id,
      scopes: keyData.scopes,
      auth_type: 'api_key'
    };

    // Update last_used_at
    await pool.query(
      `UPDATE partner_api_keys SET last_used_at = NOW() WHERE api_key_hash = $1`,
      [apiKey]
    );
  } else {
    // TODO: Implement OAuth/OIDC token verification
    return res.status(401).json({ error: 'Invalid authentication method' });
  }

  next();
};

// =============================================================================
// POST /api/partner/attestations - Submit partner attestations
// =============================================================================
router.post('/attestations', authenticatePartner, async (req, res) => {
  try {
    const {
      requirement_id,
      proof_bundle_id,
      attestation_data,
      attestation_type
    } = req.body;

    if (!requirement_id || !attestation_data || !attestation_type) {
      return res.status(400).json({ 
        error: 'requirement_id, attestation_data, and attestation_type are required' 
      });
    }

    // Validate attestation_type
    const validTypes = ['tool_usage', 'compliance', 'disclosure'];
    if (!validTypes.includes(attestation_type)) {
      return res.status(400).json({ 
        error: `attestation_type must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Insert attestation
    const result = await pool.query(
      `INSERT INTO partner_attestations (
        partner_id,
        requirement_id,
        proof_bundle_id,
        attestation_data,
        attestation_type,
        status,
        submitted_at
      ) VALUES ($1, $2, $3, $4, $5, 'submitted', NOW())
      RETURNING *`,
      [
        req.partner.partner_id,
        requirement_id,
        proof_bundle_id || null,
        JSON.stringify(attestation_data),
        attestation_type
      ]
    );

    res.json({
      success: true,
      data: {
        attestation: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          submitted_at: result.rows[0].submitted_at
        }
      }
    });
  } catch (error) {
    console.error('Error submitting attestation:', error);
    res.status(500).json({ error: 'Failed to submit attestation' });
  }
});

// =============================================================================
// GET /api/partner/compliance - Query partner compliance status
// =============================================================================
router.get('/compliance', authenticatePartner, async (req, res) => {
  try {
    const { framework_id } = req.query;

    // Get partner's compliance status
    let query = `
      SELECT 
        pbc.*,
        rf.name as framework_name,
        rf.short_name as framework_short_code
      FROM proof_bundle_compliance pbc
      JOIN regulatory_frameworks rf ON pbc.framework_id = rf.id
      JOIN proof_bundles pb ON pbc.proof_bundle_id = pb.id
      WHERE pb.enterprise_id = $1
    `;
    const params = [req.partner.partner_id];

    if (framework_id) {
      params.push(framework_id);
      query += ` AND pbc.framework_id = $2`;
    }

    query += ` ORDER BY pbc.assessed_at DESC LIMIT 10`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        compliance_status: result.rows.map(row => ({
          proof_bundle_id: row.proof_bundle_id,
          framework: {
            id: row.framework_id,
            name: row.framework_name,
            short_code: row.framework_short_code
          },
          compliance_status: row.compliance_status,
          overall_coverage: row.overall_coverage_percentage,
          assessed_at: row.assessed_at
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching partner compliance:', error);
    res.status(500).json({ error: 'Failed to fetch partner compliance' });
  }
});

// =============================================================================
// GET /api/partner/frameworks - Get applicable frameworks for partner
// =============================================================================
router.get('/frameworks', authenticatePartner, async (req, res) => {
  try {
    // Get frameworks applicable to partner's workspace/enterprise
    const result = await pool.query(
      `SELECT DISTINCT
        rf.id,
        rf.name,
        rf.short_name,
        rf.jurisdiction,
        rf.enforcement_date,
        rf.status
      FROM regulatory_frameworks rf
      JOIN workspace_frameworks wf ON rf.id = wf.framework_id
      JOIN workspaces w ON wf.workspace_id = w.id
      WHERE w.enterprise_id = $1 AND wf.enabled = true
      ORDER BY rf.name`,
      [req.partner.partner_id]
    );

    res.json({
      success: true,
      data: {
        frameworks: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          short_code: row.short_name,
          jurisdiction: row.jurisdiction,
          enforcement_date: row.enforcement_date,
          status: row.status
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching partner frameworks:', error);
    res.status(500).json({ error: 'Failed to fetch partner frameworks' });
  }
});

export default router;

