const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'aicomplyr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Authentication middleware (placeholder - integrate with your auth system)
const authenticateToken = (req, res, next) => {
  // TODO: Implement proper JWT authentication
  // For now, we'll use a simple header-based auth
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Mock user data - replace with actual JWT verification
  req.user = {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id',
    role: 'admin'
  };
  
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ============================================================================
// ORGANIZATION ROUTES
// ============================================================================

// GET /api/organizations - List organizations
router.get('/organizations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, industry, compliance_tier, contact_email, created_at
      FROM organizations_enhanced
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// POST /api/organizations - Create organization
router.post('/organizations', 
  authenticateToken,
  requireRole(['admin']),
  [
    body('name').isLength({ min: 1 }).trim().escape(),
    body('industry').optional().isIn(['pharmaceutical', 'healthcare', 'financial']),
    body('compliance_tier').optional().isIn(['enterprise', 'standard', 'basic']),
    body('contact_email').optional().isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, industry, compliance_tier, contact_email, contact_phone, address } = req.body;

      const result = await pool.query(`
        INSERT INTO organizations_enhanced (name, industry, compliance_tier, contact_email, contact_phone, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, industry, compliance_tier, contact_email, contact_phone, address]);

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'organization_created', 'organization', $3, $4)
      `, [result.rows[0].id, req.user.user_id, result.rows[0].id, JSON.stringify({ organization_name: name })]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Organization created successfully'
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  }
);

// ============================================================================
// POLICY TEMPLATES ROUTES
// ============================================================================

// GET /api/policy-templates - List policy templates
router.get('/policy-templates', authenticateToken, async (req, res) => {
  try {
    const { industry, regulation_framework } = req.query;
    
    let query = `
      SELECT id, name, description, industry, regulation_framework, 
             template_rules, risk_categories, is_public, version, created_at
      FROM policy_templates_enhanced
      WHERE is_public = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (industry) {
      paramCount++;
      query += ` AND industry = $${paramCount}`;
      params.push(industry);
    }
    
    if (regulation_framework) {
      paramCount++;
      query += ` AND regulation_framework = $${paramCount}`;
      params.push(regulation_framework);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching policy templates:', error);
    res.status(500).json({ error: 'Failed to fetch policy templates' });
  }
});

// GET /api/policy-templates/:id - Get specific template
router.get('/policy-templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM policy_templates_enhanced WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy template not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching policy template:', error);
    res.status(500).json({ error: 'Failed to fetch policy template' });
  }
});

// ============================================================================
// POLICIES ROUTES
// ============================================================================

// GET /api/policies - List organization's policies
router.get('/policies', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, search } = req.query;
    
    let query = `
      SELECT p.*, 
             u.full_name as created_by_name,
             pt.name as template_name,
             COUNT(pd.partner_id) as distributed_to_partners,
             COUNT(pr.id) as rule_count
      FROM policies_enhanced p
      LEFT JOIN users_enhanced u ON p.created_by = u.id
      LEFT JOIN policy_templates_enhanced pt ON p.template_id = pt.id
      LEFT JOIN policy_distributions pd ON p.id = pd.policy_id
      LEFT JOIN policy_rules pr ON p.id = pr.policy_id
      WHERE p.organization_id = $1
    `;
    
    const params = [organization_id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY p.id, u.full_name, pt.name ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// GET /api/policies/:id - Get specific policy
router.get('/policies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    
    const result = await pool.query(`
      SELECT p.*, 
             u.full_name as created_by_name,
             a.full_name as approved_by_name,
             pt.name as template_name,
             pt.template_rules as template_rules
      FROM policies_enhanced p
      LEFT JOIN users_enhanced u ON p.created_by = u.id
      LEFT JOIN users_enhanced a ON p.approved_by = a.id
      LEFT JOIN policy_templates_enhanced pt ON p.template_id = pt.id
      WHERE p.id = $1 AND p.organization_id = $2
    `, [id, organization_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    // Get policy rules
    const rulesResult = await pool.query(`
      SELECT * FROM policy_rules WHERE policy_id = $1 ORDER BY rule_type, rule_name
    `, [id]);
    
    const policy = result.rows[0];
    policy.rules = rulesResult.rows;
    
    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// POST /api/policies - Create new policy
router.post('/policies', 
  authenticateToken, 
  requireRole(['admin', 'compliance_officer']),
  [
    body('name').isLength({ min: 1 }).trim().escape(),
    body('description').optional().trim().escape(),
    body('policy_rules').isObject(),
    body('template_id').optional().isUUID(),
    body('compliance_framework').optional().isIn(['FDA', 'HIPAA', 'GDPR', 'AI_ACT']),
    body('effective_date').optional().isISO8601(),
    body('expiry_date').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        name, 
        description, 
        policy_rules, 
        template_id, 
        compliance_framework,
        effective_date,
        expiry_date,
        risk_scoring 
      } = req.body;
      
      const { organization_id, user_id } = req.user;

      const result = await pool.query(`
        INSERT INTO policies_enhanced (
          organization_id, name, description, template_id, policy_rules, 
          compliance_framework, effective_date, expiry_date, risk_scoring, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        organization_id, name, description, template_id, JSON.stringify(policy_rules),
        compliance_framework, effective_date, expiry_date, JSON.stringify(risk_scoring), user_id
      ]);

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'policy_created', 'policy', $3, $4)
      `, [organization_id, user_id, result.rows[0].id, JSON.stringify({ 
        policy_name: name, 
        template_id: template_id,
        compliance_framework: compliance_framework 
      })]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Policy created successfully'
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Failed to create policy' });
    }
  }
);

// PUT /api/policies/:id - Update policy
router.put('/policies/:id', 
  authenticateToken,
  requireRole(['admin', 'compliance_officer']),
  [
    body('name').optional().isLength({ min: 1 }).trim().escape(),
    body('description').optional().trim().escape(),
    body('policy_rules').optional().isObject(),
    body('status').optional().isIn(['draft', 'active', 'archived', 'suspended'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { organization_id, user_id } = req.user;
      
      // Verify policy belongs to organization
      const policyCheck = await pool.query(`
        SELECT id FROM policies_enhanced WHERE id = $1 AND organization_id = $2
      `, [id, organization_id]);
      
      if (policyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      const updateFields = [];
      const values = [];
      let paramCount = 0;

      if (req.body.name) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        values.push(req.body.name);
      }
      
      if (req.body.description !== undefined) {
        paramCount++;
        updateFields.push(`description = $${paramCount}`);
        values.push(req.body.description);
      }
      
      if (req.body.policy_rules) {
        paramCount++;
        updateFields.push(`policy_rules = $${paramCount}`);
        values.push(JSON.stringify(req.body.policy_rules));
      }
      
      if (req.body.status) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        values.push(req.body.status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, organization_id);
      const result = await pool.query(`
        UPDATE policies_enhanced 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount + 1} AND organization_id = $${paramCount + 2}
        RETURNING *
      `, values);

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'policy_updated', 'policy', $3, $4)
      `, [organization_id, user_id, id, JSON.stringify({ updated_fields: Object.keys(req.body) })]);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Policy updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy:', error);
      res.status(500).json({ error: 'Failed to update policy' });
    }
  }
);

// DELETE /api/policies/:id - Delete policy
router.delete('/policies/:id', 
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { organization_id, user_id } = req.user;
      
      // Verify policy belongs to organization
      const policyCheck = await pool.query(`
        SELECT id, name FROM policies_enhanced WHERE id = $1 AND organization_id = $2
      `, [id, organization_id]);
      
      if (policyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      // Soft delete by setting status to archived
      const result = await pool.query(`
        UPDATE policies_enhanced 
        SET status = 'archived', updated_at = NOW()
        WHERE id = $1 AND organization_id = $2
        RETURNING *
      `, [id, organization_id]);

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'policy_archived', 'policy', $3, $4)
      `, [organization_id, user_id, id, JSON.stringify({ policy_name: policyCheck.rows[0].name })]);

      res.json({
        success: true,
        message: 'Policy archived successfully'
      });
    } catch (error) {
      console.error('Error archiving policy:', error);
      res.status(500).json({ error: 'Failed to archive policy' });
    }
  }
);

// ============================================================================
// POLICY RULES ROUTES
// ============================================================================

// GET /api/policies/:id/rules - Get policy rules
router.get('/policies/:id/rules', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    
    // Verify policy belongs to organization
    const policyCheck = await pool.query(`
      SELECT id FROM policies_enhanced WHERE id = $1 AND organization_id = $2
    `, [id, organization_id]);
    
    if (policyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const result = await pool.query(`
      SELECT * FROM policy_rules WHERE policy_id = $1 ORDER BY rule_type, rule_name
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching policy rules:', error);
    res.status(500).json({ error: 'Failed to fetch policy rules' });
  }
});

// POST /api/policies/:id/rules - Add rule to policy
router.post('/policies/:id/rules', 
  authenticateToken,
  requireRole(['admin', 'compliance_officer']),
  [
    body('rule_type').isIn(['data_handling', 'content_creation', 'tool_approval', 'disclosure']),
    body('rule_name').isLength({ min: 1 }).trim().escape(),
    body('description').optional().trim().escape(),
    body('conditions').isObject(),
    body('requirements').isObject(),
    body('risk_weight').isInt({ min: 1, max: 10 }),
    body('is_mandatory').optional().isBoolean(),
    body('enforcement_level').optional().isIn(['strict', 'advisory', 'warning'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { organization_id, user_id } = req.user;
      
      // Verify policy belongs to organization
      const policyCheck = await pool.query(`
        SELECT id FROM policies_enhanced WHERE id = $1 AND organization_id = $2
      `, [id, organization_id]);
      
      if (policyCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      const {
        rule_type,
        rule_name,
        description,
        conditions,
        requirements,
        risk_weight,
        is_mandatory = true,
        enforcement_level = 'strict'
      } = req.body;

      const result = await pool.query(`
        INSERT INTO policy_rules (
          policy_id, rule_type, rule_name, description, conditions, 
          requirements, risk_weight, is_mandatory, enforcement_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [id, rule_type, rule_name, description, JSON.stringify(conditions), 
           JSON.stringify(requirements), risk_weight, is_mandatory, enforcement_level]);

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'rule_created', 'rule', $3, $4)
      `, [organization_id, user_id, result.rows[0].id, JSON.stringify({ 
        rule_name, rule_type, policy_id: id 
      })]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Policy rule created successfully'
      });
    } catch (error) {
      console.error('Error creating policy rule:', error);
      res.status(500).json({ error: 'Failed to create policy rule' });
    }
  }
);

// ============================================================================
// PARTNERS ROUTES
// ============================================================================

// GET /api/partners - List organization's partners
router.get('/partners', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, partner_type, search } = req.query;
    
    let query = `
      SELECT p.*, 
             COUNT(pd.policy_id) as active_policies,
             COUNT(cv.id) as open_violations
      FROM partners p
      LEFT JOIN policy_distributions pd ON p.id = pd.partner_id AND pd.compliance_status = 'compliant'
      LEFT JOIN compliance_violations cv ON p.id = cv.partner_id AND cv.status = 'open'
      WHERE p.organization_id = $1
    `;
    
    const params = [organization_id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    if (partner_type) {
      paramCount++;
      query += ` AND p.partner_type = $${paramCount}`;
      params.push(partner_type);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.contact_email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY p.id ORDER BY p.name`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// POST /api/partners - Create partner
router.post('/partners', 
  authenticateToken,
  requireRole(['admin', 'compliance_officer']),
  [
    body('name').isLength({ min: 1 }).trim().escape(),
    body('partner_type').isIn(['agency', 'vendor', 'freelancer', 'consultant']),
    body('contact_email').optional().isEmail().normalizeEmail(),
    body('contact_phone').optional().trim().escape(),
    body('address').optional().trim().escape(),
    body('services_offered').optional().isArray(),
    body('compliance_certifications').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        partner_type,
        contact_email,
        contact_phone,
        address,
        services_offered,
        compliance_certifications
      } = req.body;
      
      const { organization_id, user_id } = req.user;

      const result = await pool.query(`
        INSERT INTO partners (
          organization_id, name, partner_type, contact_email, contact_phone,
          address, services_offered, compliance_certifications
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        organization_id, name, partner_type, contact_email, contact_phone,
        address, services_offered, compliance_certifications
      ]);

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'partner_created', 'partner', $3, $4)
      `, [organization_id, user_id, result.rows[0].id, JSON.stringify({ 
        partner_name: name, partner_type 
      })]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Partner created successfully'
      });
    } catch (error) {
      console.error('Error creating partner:', error);
      res.status(500).json({ error: 'Failed to create partner' });
    }
  }
);

// ============================================================================
// POLICY DISTRIBUTION ROUTES
// ============================================================================

// POST /api/policies/:id/distribute - Distribute policy to partners
router.post('/policies/:id/distribute', 
  authenticateToken,
  requireRole(['admin', 'compliance_officer']),
  [
    body('partner_ids').isArray({ min: 1 }),
    body('partner_ids.*').isUUID()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { partner_ids } = req.body;
      const { organization_id, user_id } = req.user;

      // Verify policy belongs to organization
      const policy = await pool.query(`
        SELECT id, name FROM policies_enhanced WHERE id = $1 AND organization_id = $2
      `, [id, organization_id]);

      if (policy.rows.length === 0) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      // Verify all partners belong to organization
      const partners = await pool.query(`
        SELECT id, name FROM partners WHERE id = ANY($1) AND organization_id = $2
      `, [partner_ids, organization_id]);

      if (partners.rows.length !== partner_ids.length) {
        return res.status(400).json({ error: 'Some partners not found or do not belong to organization' });
      }

      // Distribute to each partner
      const distributions = [];
      for (const partner_id of partner_ids) {
        const result = await pool.query(`
          INSERT INTO policy_distributions (policy_id, partner_id)
          VALUES ($1, $2)
          ON CONFLICT (policy_id, partner_id) 
          DO UPDATE SET distributed_at = NOW(), updated_at = NOW()
          RETURNING *
        `, [id, partner_id]);
        
        distributions.push(result.rows[0]);
      }

      // Log audit trail
      await pool.query(`
        INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, 'policy_distributed', 'policy', $3, $4)
      `, [organization_id, user_id, id, JSON.stringify({ 
        partner_count: partner_ids.length,
        partner_ids: partner_ids
      })]);

      res.json({
        success: true,
        data: distributions,
        message: `Policy distributed to ${distributions.length} partners successfully`
      });
    } catch (error) {
      console.error('Error distributing policy:', error);
      res.status(500).json({ error: 'Failed to distribute policy' });
    }
  }
);

// GET /api/policies/:id/distributions - Get policy distributions
router.get('/policies/:id/distributions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    
    // Verify policy belongs to organization
    const policyCheck = await pool.query(`
      SELECT id FROM policies_enhanced WHERE id = $1 AND organization_id = $2
    `, [id, organization_id]);
    
    if (policyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const result = await pool.query(`
      SELECT pd.*, p.name as partner_name, p.partner_type, p.compliance_score
      FROM policy_distributions pd
      JOIN partners p ON pd.partner_id = p.id
      WHERE pd.policy_id = $1
      ORDER BY pd.distributed_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching policy distributions:', error);
    res.status(500).json({ error: 'Failed to fetch policy distributions' });
  }
});

// ============================================================================
// COMPLIANCE ROUTES
// ============================================================================

// GET /api/compliance/violations - Get compliance violations
router.get('/compliance/violations', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, severity, partner_id } = req.query;
    
    let query = `
      SELECT cv.*, 
             p.name as policy_name,
             pt.name as partner_name,
             pt.partner_type
      FROM compliance_violations cv
      JOIN policies_enhanced p ON cv.policy_id = p.id
      JOIN partners pt ON cv.partner_id = pt.id
      WHERE cv.organization_id = $1
    `;
    
    const params = [organization_id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND cv.status = $${paramCount}`;
      params.push(status);
    }
    
    if (severity) {
      paramCount++;
      query += ` AND cv.severity = $${paramCount}`;
      params.push(severity);
    }
    
    if (partner_id) {
      paramCount++;
      query += ` AND cv.partner_id = $${paramCount}`;
      params.push(partner_id);
    }
    
    query += ` ORDER BY cv.detected_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching compliance violations:', error);
    res.status(500).json({ error: 'Failed to fetch compliance violations' });
  }
});

// GET /api/compliance/checks - Get compliance checks
router.get('/compliance/checks', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, check_type, partner_id } = req.query;
    
    let query = `
      SELECT cc.*, 
             p.name as policy_name,
             pt.name as partner_name
      FROM compliance_checks cc
      JOIN policies_enhanced p ON cc.policy_id = p.id
      JOIN partners pt ON cc.partner_id = pt.id
      WHERE cc.organization_id = $1
    `;
    
    const params = [organization_id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND cc.status = $${paramCount}`;
      params.push(status);
    }
    
    if (check_type) {
      paramCount++;
      query += ` AND cc.check_type = $${paramCount}`;
      params.push(check_type);
    }
    
    if (partner_id) {
      paramCount++;
      query += ` AND cc.partner_id = $${paramCount}`;
      params.push(partner_id);
    }
    
    query += ` ORDER BY cc.check_date DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching compliance checks:', error);
    res.status(500).json({ error: 'Failed to fetch compliance checks' });
  }
});

// ============================================================================
// AUDIT LOGS ROUTES
// ============================================================================

// GET /api/audit-logs - Get audit logs
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { action, entity_type, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT al.*, u.full_name as user_name
      FROM audit_logs_enhanced al
      LEFT JOIN users_enhanced u ON al.user_id = u.id
      WHERE al.organization_id = $1
    `;
    
    const params = [organization_id];
    let paramCount = 1;
    
    if (action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
    }
    
    if (entity_type) {
      paramCount++;
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(entity_type);
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    
    // Get policy statistics
    const policyStats = await pool.query(`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_policies,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_policies
      FROM policies_enhanced 
      WHERE organization_id = $1
    `, [organization_id]);
    
    // Get partner statistics
    const partnerStats = await pool.query(`
      SELECT 
        COUNT(*) as total_partners,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_partners,
        AVG(compliance_score) as avg_compliance_score,
        COUNT(CASE WHEN risk_level = 'high' OR risk_level = 'critical' THEN 1 END) as high_risk_partners
      FROM partners 
      WHERE organization_id = $1
    `, [organization_id]);
    
    // Get compliance statistics
    const complianceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_violations,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_violations,
        COUNT(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 END) as high_severity_violations
      FROM compliance_violations 
      WHERE organization_id = $1
    `, [organization_id]);
    
    // Get recent activity
    const recentActivity = await pool.query(`
      SELECT al.action, al.entity_type, al.created_at, u.full_name as user_name
      FROM audit_logs_enhanced al
      LEFT JOIN users_enhanced u ON al.user_id = u.id
      WHERE al.organization_id = $1
      ORDER BY al.created_at DESC
      LIMIT 10
    `, [organization_id]);
    
    res.json({
      success: true,
      data: {
        policies: policyStats.rows[0],
        partners: partnerStats.rows[0],
        compliance: complianceStats.rows[0],
        recent_activity: recentActivity.rows
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
