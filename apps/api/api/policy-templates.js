// api/policy-templates.js
// API endpoints for policy template management

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET /api/policy-templates - Get all available policy templates
router.get('/', async (req, res) => {
  try {
    const { industry } = req.query;
    
    let query = 'SELECT * FROM policy_templates WHERE is_public = true';
    let params = [];
    
    // Filter by industry if specified
    if (industry) {
      query += ' AND (industry = $1 OR industry = $2)';
      params = [industry, 'general'];
    }
    
    query += ' ORDER BY industry, name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      templates: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching policy templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy templates'
    });
  }
});

// POST /api/policy-templates/customize-policy - MOVED BEFORE /:id route
router.post('/customize-policy', async (req, res) => {
  try {
    console.log('POST /customize-policy called with body:', req.body);
    
    const { organizationId, templateId, customizations, policyName } = req.body;
    
    // Validate required fields
    if (!organizationId || !templateId || !policyName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: organizationId, templateId, or policyName'
      });
    }
    
    // Get the base template
    const templateResult = await pool.query(
      'SELECT * FROM policy_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Policy template not found'
      });
    }
    
    const template = templateResult.rows[0];
    console.log('Found template:', template.name);
    
    // Create customized policy for the organization
    const result = await pool.query(`
      INSERT INTO policies (organization_id, name, rules, version, status)
      VALUES ($1, $2, $3, 1, 'active')
      RETURNING *
    `, [
      organizationId,
      policyName,
      JSON.stringify({
        base_template: template.base_rules,
        customizations: customizations || {},
        template_id: templateId
      })
    ]);
    
    console.log('Policy created successfully:', result.rows[0].id);
    
    res.json({
      success: true,
      policy: result.rows[0],
      message: 'Policy customized and saved successfully'
    });
    
  } catch (error) {
    console.error('Error creating customized policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customized policy: ' + error.message
    });
  }
});

// GET /api/policy-templates/:id - Get specific policy template (MOVED AFTER specific routes)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM policy_templates WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Policy template not found'
      });
    }
    
    res.json({
      success: true,
      template: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching policy template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy template'
    });
  }
});

// GET /api/policy-templates/:orgId/policies - Get organization's policies
router.get('/:orgId/policies', async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM policies WHERE organization_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    
    res.json({
      success: true,
      policies: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching organization policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies'
    });
  }
});

module.exports = router;