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

// Authentication middleware (placeholder - integrate with your auth system)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // TODO: Implement proper JWT verification
  // For now, we'll use a simple header-based auth
  req.user = {
    user_id: 'mock-user-id',
    organization_id: 'mock-org-id',
    role: 'admin'
  };
  
  next();
};

// =============================================================================
// GET /api/frameworks - List frameworks with filtering
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      jurisdiction,
      status,
      framework_type,
      search,
      page = 1,
      per_page = 20
    } = req.query;

    let query = `
      SELECT 
        rf.id,
        rf.name,
        rf.short_name,
        rf.jurisdiction,
        rf.jurisdiction_display,
        rf.regulatory_body,
        rf.framework_type,
        rf.risk_approach,
        rf.status,
        rf.effective_date,
        rf.enforcement_date,
        rf.summary,
        rf.penalty_info,
        COUNT(DISTINCT fr.id) as requirement_count
      FROM regulatory_frameworks rf
      LEFT JOIN framework_requirements fr ON rf.id = fr.framework_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (jurisdiction) {
      paramCount++;
      query += ` AND rf.jurisdiction = $${paramCount}`;
      params.push(jurisdiction);
    }

    if (status) {
      paramCount++;
      query += ` AND rf.status = $${paramCount}`;
      params.push(status);
    }

    if (framework_type) {
      paramCount++;
      query += ` AND rf.framework_type = $${paramCount}`;
      params.push(framework_type);
    }

    if (search) {
      paramCount++;
      query += ` AND (rf.name ILIKE $${paramCount} OR rf.summary ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY rf.id`;

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT rf.id) as total FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(per_page);
    paramCount++;
    query += ` ORDER BY rf.name LIMIT $${paramCount}`;
    params.push(parseInt(per_page));
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        frameworks: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          short_code: row.short_name,
          jurisdiction: row.jurisdiction,
          jurisdiction_display: row.jurisdiction_display,
          regulatory_body: row.regulatory_body,
          framework_type: row.framework_type,
          risk_approach: row.risk_approach,
          status: row.status,
          effective_date: row.effective_date,
          enforcement_date: row.enforcement_date,
          summary: row.summary,
          requirement_count: parseInt(row.requirement_count),
          penalty_info: row.penalty_info
        })),
        pagination: {
          page: parseInt(page),
          per_page: parseInt(per_page),
          total,
          total_pages: Math.ceil(total / parseInt(per_page))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching frameworks:', error);
    res.status(500).json({ error: 'Failed to fetch frameworks' });
  }
});

// =============================================================================
// GET /api/frameworks/:framework_id - Get framework details
// =============================================================================
router.get('/:framework_id', authenticateToken, async (req, res) => {
  try {
    const { framework_id } = req.params;
    const { include_requirements } = req.query;

    // Get framework details
    const frameworkResult = await pool.query(
      `SELECT * FROM regulatory_frameworks WHERE id = $1`,
      [framework_id]
    );

    if (frameworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    const framework = frameworkResult.rows[0];

    // Get requirements summary
    const summaryResult = await pool.query(
      `SELECT 
        requirement_type,
        COUNT(*) as count
      FROM framework_requirements
      WHERE framework_id = $1
      GROUP BY requirement_type`,
      [framework_id]
    );

    const requirements_summary = {
      total: 0,
      mandatory: 0,
      conditional: 0,
      recommended: 0
    };

    summaryResult.rows.forEach(row => {
      requirements_summary.total += parseInt(row.count);
      if (row.requirement_type === 'mandatory') {
        requirements_summary.mandatory = parseInt(row.count);
      } else if (row.requirement_type === 'conditional') {
        requirements_summary.conditional = parseInt(row.count);
      } else if (row.requirement_type === 'recommended') {
        requirements_summary.recommended = parseInt(row.count);
      }
    });

    const response = {
      success: true,
      data: {
        framework: {
          id: framework.id,
          name: framework.name,
          short_code: framework.short_name,
          version: framework.version,
          jurisdiction: framework.jurisdiction,
          jurisdiction_display: framework.jurisdiction_display,
          regulatory_body: framework.regulatory_body,
          framework_type: framework.framework_type,
          risk_approach: framework.risk_approach,
          scope_category: framework.scope_category,
          enacted_date: framework.enacted_date,
          effective_date: framework.effective_date,
          enforcement_date: framework.enforcement_date,
          phase_dates: framework.phase_dates,
          status: framework.status,
          summary: framework.summary,
          key_obligations: framework.key_obligations,
          penalty_info: framework.penalty_info,
          source_url: framework.source_url,
          requirements_summary
        }
      }
    };

    // Include requirements if requested
    if (include_requirements === 'true') {
      const requirementsResult = await pool.query(
        `SELECT 
          id,
          requirement_code,
          requirement_type,
          title,
          description,
          article_reference,
          section_reference,
          applicability_criteria,
          risk_categories,
          actor_types,
          evidence_required,
          compliance_indicators,
          compliance_weight,
          is_critical,
          parent_requirement_id
        FROM framework_requirements
        WHERE framework_id = $1
        ORDER BY sort_order, requirement_code`,
        [framework_id]
      );

      response.data.requirements = requirementsResult.rows;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching framework details:', error);
    res.status(500).json({ error: 'Failed to fetch framework details' });
  }
});

// =============================================================================
// GET /api/frameworks/:framework_id/requirements - Get framework requirements
// =============================================================================
router.get('/:framework_id/requirements', authenticateToken, async (req, res) => {
  try {
    const { framework_id } = req.params;
    const {
      requirement_type,
      risk_category,
      is_critical
    } = req.query;

    let query = `
      SELECT 
        id,
        requirement_code,
        requirement_type,
        title,
        description,
        article_reference,
        section_reference,
        applicability_criteria,
        risk_categories,
        actor_types,
        evidence_required,
        compliance_indicators,
        compliance_weight,
        is_critical,
        parent_requirement_id,
        sort_order
      FROM framework_requirements
      WHERE framework_id = $1
    `;
    const params = [framework_id];
    let paramCount = 1;

    if (requirement_type) {
      paramCount++;
      query += ` AND requirement_type = $${paramCount}`;
      params.push(requirement_type);
    }

    if (risk_category) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(risk_categories)`;
      params.push(risk_category);
    }

    if (is_critical === 'true') {
      query += ` AND is_critical = true`;
    }

    query += ` ORDER BY sort_order, requirement_code`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        requirements: result.rows.map(row => ({
          id: row.id,
          requirement_code: row.requirement_code,
          requirement_type: row.requirement_type,
          title: row.title,
          description: row.description,
          article_reference: row.article_reference,
          section_reference: row.section_reference,
          applicability_criteria: row.applicability_criteria,
          risk_categories: row.risk_categories,
          actor_types: row.actor_types,
          evidence_required: row.evidence_required,
          compliance_indicators: row.compliance_indicators,
          compliance_weight: row.compliance_weight,
          is_critical: row.is_critical,
          parent_requirement_id: row.parent_requirement_id,
          child_requirements: [] // Would need separate query to populate
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching framework requirements:', error);
    res.status(500).json({ error: 'Failed to fetch framework requirements' });
  }
});

export default router;

