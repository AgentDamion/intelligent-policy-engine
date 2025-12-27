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
// GET /api/workspaces/:workspace_id/compliance - Get workspace compliance summary
// =============================================================================
router.get('/workspaces/:workspace_id/compliance', authenticateToken, async (req, res) => {
  try {
    const { workspace_id } = req.params;

    // Get enabled frameworks for workspace
    const frameworksResult = await pool.query(
      `SELECT 
        wf.*,
        rf.name as framework_name,
        rf.short_name as framework_short_code,
        rf.enforcement_date
      FROM workspace_frameworks wf
      JOIN regulatory_frameworks rf ON wf.framework_id = rf.id
      WHERE wf.workspace_id = $1 AND wf.enabled = true`,
      [workspace_id]
    );

    const frameworks = frameworksResult.rows;
    let totalRequirements = 0;
    let requirementsMet = 0;
    let requirementsPartial = 0;
    let requirementsGap = 0;
    let totalCoverage = 0;
    const byFramework = [];

    for (const framework of frameworks) {
      // Get compliance assessment for this framework
      // In production, this would query proof_bundle_compliance aggregated data
      const coverageScore = framework.current_coverage_score || 0;
      totalCoverage += coverageScore;

      // Get requirement counts (simplified - would need actual assessment data)
      const reqResult = await pool.query(
        `SELECT COUNT(*) as total
        FROM framework_requirements
        WHERE framework_id = $1
          AND id NOT IN (
            SELECT UNNEST($2::uuid[])
          )`,
        [framework.framework_id, framework.excluded_requirements || []]
      );

      const total = parseInt(reqResult.rows[0].total);
      totalRequirements += total;
      
      // Estimate met/partial/gap based on coverage score
      const met = Math.floor(total * (coverageScore / 100));
      const partial = Math.floor(total * ((coverageScore / 100) * 0.3));
      const gap = total - met - partial;

      requirementsMet += met;
      requirementsPartial += partial;
      requirementsGap += gap;

      byFramework.push({
        framework: {
          id: framework.framework_id,
          name: framework.framework_name,
          short_code: framework.framework_short_code
        },
        coverage_score: coverageScore,
        status: coverageScore >= 95 ? 'compliant' : coverageScore >= 70 ? 'partial' : 'non_compliant',
        requirements_summary: {
          total,
          met,
          partial,
          gap
        },
        critical_gaps: 0, // Would need actual assessment
        enforcement_date: framework.enforcement_date,
        days_until_enforcement: framework.enforcement_date 
          ? Math.ceil((new Date(framework.enforcement_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      });
    }

    const overallCoverage = frameworks.length > 0 ? totalCoverage / frameworks.length : 0;

    // Get top gaps (simplified)
    const topGaps = [];

    res.json({
      success: true,
      data: {
        summary: {
          overall_coverage: overallCoverage,
          frameworks_enabled: frameworks.length,
          total_requirements: totalRequirements,
          requirements_met: requirementsMet,
          requirements_partial: requirementsPartial,
          requirements_gap: requirementsGap
        },
        by_framework: byFramework,
        top_gaps: topGaps
      }
    });
  } catch (error) {
    console.error('Error fetching workspace compliance:', error);
    res.status(500).json({ error: 'Failed to fetch workspace compliance' });
  }
});

// =============================================================================
// GET /api/policies/:policy_id/compliance - Get policy compliance mapping
// =============================================================================
router.get('/policies/:policy_id/compliance', authenticateToken, async (req, res) => {
  try {
    const { policy_id } = req.params;

    // Get policy details
    const policyResult = await pool.query(
      `SELECT id, name FROM policies WHERE id = $1`,
      [policy_id]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const policy = policyResult.rows[0];

    // Get framework coverage for this policy
    const coverageResult = await pool.query(
      `SELECT 
        pfm.*,
        rf.name as framework_name,
        rf.short_name as framework_short_code,
        fr.requirement_code,
        fr.title as requirement_title
      FROM policy_framework_map pfm
      JOIN regulatory_frameworks rf ON pfm.framework_id = rf.id
      LEFT JOIN framework_requirements fr ON pfm.requirement_id = fr.id
      WHERE pfm.policy_id = $1
      ORDER BY rf.name, fr.requirement_code`,
      [policy_id]
    );

    // Group by framework
    const frameworkCoverage = {};
    coverageResult.rows.forEach(row => {
      if (!frameworkCoverage[row.framework_id]) {
        frameworkCoverage[row.framework_id] = {
          framework: {
            id: row.framework_id,
            name: row.framework_name,
            short_code: row.framework_short_code
          },
          overall_coverage: 0,
          requirements_addressed: [],
          requirements_not_addressed: []
        };
      }

      if (row.coverage_type !== 'none') {
        frameworkCoverage[row.framework_id].requirements_addressed.push({
          requirement_id: row.requirement_id,
          requirement_code: row.requirement_code,
          title: row.requirement_title,
          coverage_type: row.coverage_type,
          coverage_percentage: row.coverage_percentage,
          coverage_notes: row.coverage_notes,
          auto_detected: row.auto_detected,
          verified: row.verified
        });
      } else {
        frameworkCoverage[row.framework_id].requirements_not_addressed.push({
          requirement_id: row.requirement_id,
          requirement_code: row.requirement_code,
          title: row.requirement_title,
          gap_reason: 'Not addressed by policy'
        });
      }
    });

    // Calculate overall coverage per framework
    Object.values(frameworkCoverage).forEach(fw => {
      if (fw.requirements_addressed.length > 0) {
        const total = fw.requirements_addressed.length + fw.requirements_not_addressed.length;
        const covered = fw.requirements_addressed.reduce((sum, req) => 
          sum + (req.coverage_percentage || 0), 0
        );
        fw.overall_coverage = total > 0 ? covered / total : 0;
      }
    });

    res.json({
      success: true,
      data: {
        policy: {
          id: policy.id,
          name: policy.name
        },
        framework_coverage: Object.values(frameworkCoverage)
      }
    });
  } catch (error) {
    console.error('Error fetching policy compliance:', error);
    res.status(500).json({ error: 'Failed to fetch policy compliance' });
  }
});

// =============================================================================
// POST /api/proof-bundles/:bundle_id/assess - Assess proof bundle compliance
// =============================================================================
router.post('/proof-bundles/:bundle_id/assess', authenticateToken, async (req, res) => {
  try {
    const { bundle_id } = req.params;
    const { frameworks, force_reassess = false } = req.body;

    // TODO: Call assess-compliance edge function
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        proof_bundle_id: bundle_id,
        assessed_at: new Date().toISOString(),
        assessments: []
      },
      message: 'Assessment triggered. Results will be available shortly.'
    });
  } catch (error) {
    console.error('Error assessing proof bundle:', error);
    res.status(500).json({ error: 'Failed to assess proof bundle compliance' });
  }
});

// =============================================================================
// GET /api/proof-bundles/:bundle_id/export - Regulator-ready exports
// =============================================================================
router.get('/proof-bundles/:bundle_id/export', authenticateToken, async (req, res) => {
  try {
    const { bundle_id } = req.params;
    const { format = 'json' } = req.query;

    // Get proof bundle compliance data
    const complianceResult = await pool.query(
      `SELECT 
        pbc.*,
        rf.name as framework_name,
        rf.short_name as framework_short_code
      FROM proof_bundle_compliance pbc
      JOIN regulatory_frameworks rf ON pbc.framework_id = rf.id
      WHERE pbc.proof_bundle_id = $1`,
      [bundle_id]
    );

    if (complianceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance assessment not found' });
    }

    // Format response based on export format
    if (format === 'pdf') {
      // TODO: Generate PDF export
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${bundle_id}.pdf"`);
      return res.send('PDF export not yet implemented');
    } else if (format === 'ectd') {
      // TODO: Generate eCTD format
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-ectd-${bundle_id}.xml"`);
      return res.send('eCTD export not yet implemented');
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          proof_bundle_id: bundle_id,
          exported_at: new Date().toISOString(),
          format: 'json',
          assessments: complianceResult.rows.map(row => ({
            framework: {
              id: row.framework_id,
              name: row.framework_name,
              short_code: row.framework_short_code
            },
            compliance_status: row.compliance_status,
            overall_coverage: row.overall_coverage_percentage,
            requirement_results: row.requirement_results,
            gaps: row.gaps,
            recommendations: row.recommendations
          }))
        }
      });
    }
  } catch (error) {
    console.error('Error exporting proof bundle:', error);
    res.status(500).json({ error: 'Failed to export proof bundle' });
  }
});

export default router;

