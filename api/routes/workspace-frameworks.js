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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // TODO: Implement proper JWT verification
  req.user = {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id',
    role: 'admin'
  };
  
  next();
};

// =============================================================================
// GET /api/workspaces/:workspace_id/frameworks - Get enabled frameworks
// =============================================================================
router.get('/:workspace_id/frameworks', authenticateToken, async (req, res) => {
  try {
    const { workspace_id } = req.params;

    // Get enabled frameworks
    const enabledResult = await pool.query(
      `SELECT 
        wf.*,
        rf.name as framework_name,
        rf.short_name as framework_short_code,
        rf.jurisdiction,
        rf.enforcement_date,
        rf.status as framework_status
      FROM workspace_frameworks wf
      JOIN regulatory_frameworks rf ON wf.framework_id = rf.id
      WHERE wf.workspace_id = $1 AND wf.enabled = true
      ORDER BY wf.priority DESC, rf.name`,
      [workspace_id]
    );

    // Get available frameworks (not yet enabled)
    const availableResult = await pool.query(
      `SELECT 
        rf.id,
        rf.name,
        rf.short_name,
        rf.jurisdiction,
        rf.enforcement_date,
        rf.status
      FROM regulatory_frameworks rf
      WHERE rf.status = 'active'
        AND rf.id NOT IN (
          SELECT framework_id FROM workspace_frameworks 
          WHERE workspace_id = $1 AND enabled = true
        )
      ORDER BY rf.name`,
      [workspace_id]
    );

    res.json({
      success: true,
      data: {
        enabled_frameworks: enabledResult.rows.map(row => ({
          id: row.id,
          framework: {
            id: row.framework_id,
            name: row.framework_name,
            short_code: row.framework_short_code,
            jurisdiction: row.jurisdiction
          },
          enabled: row.enabled,
          priority: row.priority,
          configuration: row.configuration,
          compliance_target_date: row.compliance_target_date,
          current_coverage_score: row.current_coverage_score,
          last_assessment_date: row.last_assessment_date
        })),
        available_frameworks: availableResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          short_code: row.short_name,
          jurisdiction: row.jurisdiction,
          enabled: false
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching workspace frameworks:', error);
    res.status(500).json({ error: 'Failed to fetch workspace frameworks' });
  }
});

// =============================================================================
// POST /api/workspaces/:workspace_id/frameworks - Enable framework
// =============================================================================
router.post('/:workspace_id/frameworks', authenticateToken, async (req, res) => {
  try {
    const { workspace_id } = req.params;
    const {
      framework_id,
      priority = 0,
      compliance_target_date,
      configuration = {},
      excluded_requirements = []
    } = req.body;

    if (!framework_id) {
      return res.status(400).json({ error: 'framework_id is required' });
    }

    // Insert or update workspace framework
    const result = await pool.query(
      `INSERT INTO workspace_frameworks (
        workspace_id,
        framework_id,
        enabled,
        priority,
        compliance_target_date,
        configuration,
        excluded_requirements,
        enabled_by,
        enabled_at
      ) VALUES ($1, $2, true, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (workspace_id, framework_id)
      DO UPDATE SET
        enabled = true,
        priority = EXCLUDED.priority,
        compliance_target_date = EXCLUDED.compliance_target_date,
        configuration = EXCLUDED.configuration,
        excluded_requirements = EXCLUDED.excluded_requirements,
        enabled_by = EXCLUDED.enabled_by,
        enabled_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        workspace_id,
        framework_id,
        priority,
        compliance_target_date,
        JSON.stringify(configuration),
        excluded_requirements,
        req.user.user_id
      ]
    );

    const workspaceFramework = result.rows[0];

    // TODO: Trigger initial compliance assessment
    // This would call the assess-compliance edge function
    const initialAssessment = {
      coverage_score: 0,
      gaps_identified: 0,
      critical_gaps: 0
    };

    res.json({
      success: true,
      data: {
        workspace_framework: {
          id: workspaceFramework.id,
          workspace_id: workspaceFramework.workspace_id,
          framework_id: workspaceFramework.framework_id,
          enabled: workspaceFramework.enabled,
          priority: workspaceFramework.priority,
          compliance_target_date: workspaceFramework.compliance_target_date,
          configuration: workspaceFramework.configuration
        },
        initial_assessment: initialAssessment
      }
    });
  } catch (error) {
    console.error('Error enabling framework:', error);
    res.status(500).json({ error: 'Failed to enable framework' });
  }
});

// =============================================================================
// PATCH /api/workspaces/:workspace_id/frameworks/:framework_id - Update configuration
// =============================================================================
router.patch('/:workspace_id/frameworks/:framework_id', authenticateToken, async (req, res) => {
  try {
    const { workspace_id, framework_id } = req.params;
    const {
      priority,
      compliance_target_date,
      excluded_requirements,
      configuration
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (priority !== undefined) {
      paramCount++;
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
    }

    if (compliance_target_date !== undefined) {
      paramCount++;
      updates.push(`compliance_target_date = $${paramCount}`);
      params.push(compliance_target_date);
    }

    if (excluded_requirements !== undefined) {
      paramCount++;
      updates.push(`excluded_requirements = $${paramCount}`);
      params.push(excluded_requirements);
    }

    if (configuration !== undefined) {
      paramCount++;
      updates.push(`configuration = $${paramCount}`);
      params.push(JSON.stringify(configuration));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    paramCount++;
    params.push(workspace_id);
    paramCount++;
    params.push(framework_id);

    const query = `
      UPDATE workspace_frameworks
      SET ${updates.join(', ')}
      WHERE workspace_id = $${paramCount - 1} AND framework_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace framework not found' });
    }

    res.json({
      success: true,
      data: {
        workspace_framework: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error updating workspace framework:', error);
    res.status(500).json({ error: 'Failed to update workspace framework' });
  }
});

// =============================================================================
// DELETE /api/workspaces/:workspace_id/frameworks/:framework_id - Disable framework
// =============================================================================
router.delete('/:workspace_id/frameworks/:framework_id', authenticateToken, async (req, res) => {
  try {
    const { workspace_id, framework_id } = req.params;

    const result = await pool.query(
      `UPDATE workspace_frameworks
      SET enabled = false, updated_at = NOW()
      WHERE workspace_id = $1 AND framework_id = $2
      RETURNING *`,
      [workspace_id, framework_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace framework not found' });
    }

    res.json({
      success: true,
      data: {
        message: 'Framework disabled successfully'
      }
    });
  } catch (error) {
    console.error('Error disabling framework:', error);
    res.status(500).json({ error: 'Failed to disable framework' });
  }
});

export default router;

