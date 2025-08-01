const express = require('express');
const router = express.Router();
const pool = require('../database/connection');
const { checkJwt, requirePermission, requireOrganizationAccess } = require('./auth/auth0-middleware');

// Get all policy distributions for an enterprise
router.get('/distributions', checkJwt, requireOrganizationAccess, requirePermission('policy:read'), async (req, res) => {
  try {
    const { org_id } = req.user;
    const { status, agency_id } = req.query;
    
    let query = `
      SELECT pd.*, p.name as policy_name, p.description as policy_description,
             a.name as agency_name, u.name as acknowledged_by_name
      FROM policy_distributions pd
      JOIN policies p ON pd.policy_id = p.id
      JOIN organizations a ON pd.agency_org_id = a.id
      LEFT JOIN users u ON pd.acknowledged_by = u.id
      WHERE pd.enterprise_org_id = $1
    `;
    
    const params = [org_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND pd.distribution_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (agency_id) {
      query += ` AND pd.agency_org_id = $${paramIndex}`;
      params.push(agency_id);
    }
    
    query += ' ORDER BY pd.distributed_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching policy distributions:', error);
    res.status(500).json({ error: 'Failed to fetch policy distributions' });
  }
});

// Distribute a policy to agencies
router.post('/distribute', checkJwt, requireOrganizationAccess, requirePermission('policy:write'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { policy_id, agency_ids, message } = req.body;
    const { org_id } = req.user;
    
    // Validate policy exists and belongs to enterprise
    const policyCheck = await client.query(
      'SELECT id FROM policies WHERE id = $1 AND organization_id = $2',
      [policy_id, org_id]
    );
    
    if (policyCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const distributions = [];
    
    for (const agency_id of agency_ids) {
      // Check if agency relationship exists
      const relationshipCheck = await client.query(
        'SELECT id FROM agency_enterprise_relationships WHERE agency_org_id = $1 AND enterprise_org_id = $2 AND relationship_status = $3',
        [agency_id, org_id, 'active']
      );
      
      if (relationshipCheck.rows.length === 0) {
        continue; // Skip if no active relationship
      }
      
      // Deactivate previous version if exists
      await client.query(
        'UPDATE policy_distributions SET is_current_version = FALSE WHERE policy_id = $1 AND agency_org_id = $2 AND enterprise_org_id = $3',
        [policy_id, agency_id, org_id]
      );
      
      // Create new distribution
      const distribution = await client.query(
        `INSERT INTO policy_distributions 
         (policy_id, enterprise_org_id, agency_org_id, distribution_status, version_number)
         VALUES ($1, $2, $3, $4, 
           COALESCE((SELECT MAX(version_number) + 1 FROM policy_distributions WHERE policy_id = $1 AND agency_org_id = $3), 1)
         ) RETURNING *`,
        [policy_id, org_id, agency_id, 'active']
      );
      
      distributions.push(distribution.rows[0]);
      
      // Create compliance tracking record
      await client.query(
        `INSERT INTO agency_policy_compliance 
         (policy_distribution_id, agency_org_id, compliance_status)
         VALUES ($1, $2, $3)`,
        [distribution.rows[0].id, agency_id, 'pending']
      );
    }
    
    await client.query('COMMIT');
    res.json({ 
      message: `Policy distributed to ${distributions.length} agencies`,
      distributions 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error distributing policy:', error);
    res.status(500).json({ error: 'Failed to distribute policy' });
  } finally {
    client.release();
  }
});

// Get policy compliance for an agency
router.get('/compliance/:agency_id', checkJwt, requireOrganizationAccess, requirePermission('policy:read'), async (req, res) => {
  try {
    const { agency_id } = req.params;
    const { org_id } = req.user;
    
    const result = await pool.query(
      `SELECT apc.*, pd.policy_id, p.name as policy_name, p.description as policy_description,
              pd.enterprise_org_id, e.name as enterprise_name
       FROM agency_policy_compliance apc
       JOIN policy_distributions pd ON apc.policy_distribution_id = pd.id
       JOIN policies p ON pd.policy_id = p.id
       JOIN organizations e ON pd.enterprise_org_id = e.id
       WHERE apc.agency_org_id = $1 AND pd.enterprise_org_id = $2
       ORDER BY apc.last_assessment_date DESC`,
      [agency_id, org_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching compliance:', error);
    res.status(500).json({ error: 'Failed to fetch compliance data' });
  }
});

// Update compliance status
router.put('/compliance/:compliance_id', checkJwt, requireOrganizationAccess, requirePermission('policy:write'), async (req, res) => {
  try {
    const { compliance_id } = req.params;
    const { compliance_score, compliance_status, violations_count, next_review_date } = req.body;
    
    const result = await pool.query(
      `UPDATE agency_policy_compliance 
       SET compliance_score = $1, compliance_status = $2, violations_count = $3, 
           next_review_date = $4, last_assessment_date = NOW()
       WHERE id = $5 RETURNING *`,
      [compliance_score, compliance_status, violations_count, next_review_date, compliance_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating compliance:', error);
    res.status(500).json({ error: 'Failed to update compliance' });
  }
});

// Get policy conflicts for an agency
router.get('/conflicts/:agency_id', checkJwt, requireOrganizationAccess, requirePermission('policy:read'), async (req, res) => {
  try {
    const { agency_id } = req.params;
    const { status, severity } = req.query;
    
    let query = `
      SELECT pc.*, 
             p1.name as policy_a_name, p1.description as policy_a_description,
             p2.name as policy_b_name, p2.description as policy_b_description,
             u.name as resolved_by_name
      FROM policy_conflicts pc
      JOIN policies p1 ON pc.policy_a_id = p1.id
      JOIN policies p2 ON pc.policy_b_id = p2.id
      LEFT JOIN users u ON pc.resolved_by = u.id
      WHERE pc.agency_org_id = $1
    `;
    
    const params = [agency_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND pc.resolution_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (severity) {
      query += ` AND pc.severity = $${paramIndex}`;
      params.push(severity);
    }
    
    query += ' ORDER BY pc.detected_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching policy conflicts:', error);
    res.status(500).json({ error: 'Failed to fetch policy conflicts' });
  }
});

// Resolve a policy conflict
router.put('/conflicts/:conflict_id/resolve', checkJwt, requireOrganizationAccess, requirePermission('policy:write'), async (req, res) => {
  try {
    const { conflict_id } = req.params;
    const { resolution_status, resolution_notes } = req.body;
    const { sub } = req.user;
    
    const result = await pool.query(
      `UPDATE policy_conflicts 
       SET resolution_status = $1, resolution_notes = $2, resolved_at = NOW(), resolved_by = $3
       WHERE id = $4 RETURNING *`,
      [resolution_status, resolution_notes, sub, conflict_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conflict not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// Acknowledge policy distribution
router.post('/distributions/:distribution_id/acknowledge', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { distribution_id } = req.params;
    const { sub } = req.user;
    
    const result = await pool.query(
      `UPDATE policy_distributions 
       SET acknowledged_at = NOW(), acknowledged_by = $1
       WHERE id = $2 RETURNING *`,
      [sub, distribution_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Distribution not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error acknowledging distribution:', error);
    res.status(500).json({ error: 'Failed to acknowledge distribution' });
  }
});

// Get policy sync status dashboard
router.get('/dashboard', checkJwt, requireOrganizationAccess, requirePermission('policy:read'), async (req, res) => {
  try {
    const { org_id } = req.user;
    
    // Get distribution statistics
    const distributionStats = await pool.query(
      `SELECT 
         COUNT(*) as total_distributions,
         COUNT(CASE WHEN distribution_status = 'active' THEN 1 END) as active_distributions,
         COUNT(CASE WHEN acknowledged_at IS NOT NULL THEN 1 END) as acknowledged_distributions
       FROM policy_distributions 
       WHERE enterprise_org_id = $1`,
      [org_id]
    );
    
    // Get compliance statistics
    const complianceStats = await pool.query(
      `SELECT 
         COUNT(*) as total_compliance_records,
         COUNT(CASE WHEN compliance_status = 'compliant' THEN 1 END) as compliant_count,
         COUNT(CASE WHEN compliance_status = 'non_compliant' THEN 1 END) as non_compliant_count,
         COUNT(CASE WHEN compliance_status = 'pending' THEN 1 END) as pending_count,
         AVG(compliance_score) as avg_compliance_score
       FROM agency_policy_compliance apc
       JOIN policy_distributions pd ON apc.policy_distribution_id = pd.id
       WHERE pd.enterprise_org_id = $1`,
      [org_id]
    );
    
    // Get conflict statistics
    const conflictStats = await pool.query(
      `SELECT 
         COUNT(*) as total_conflicts,
         COUNT(CASE WHEN resolution_status = 'unresolved' THEN 1 END) as unresolved_conflicts,
         COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) as resolved_conflicts,
         COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity_conflicts
       FROM policy_conflicts pc
       JOIN policy_distributions pd ON pc.policy_a_id = pd.policy_id OR pc.policy_b_id = pd.policy_id
       WHERE pd.enterprise_org_id = $1`,
      [org_id]
    );
    
    res.json({
      distributions: distributionStats.rows[0],
      compliance: complianceStats.rows[0],
      conflicts: conflictStats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Detect policy conflicts for an agency
router.post('/detect-conflicts/:agency_id', checkJwt, requireOrganizationAccess, requirePermission('policy:write'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { agency_id } = req.params;
    
    // Get all active policies for this agency
    const policies = await client.query(
      `SELECT DISTINCT p.id, p.name, p.description, pd.enterprise_org_id
       FROM policies p
       JOIN policy_distributions pd ON p.id = pd.policy_id
       WHERE pd.agency_org_id = $1 AND pd.distribution_status = 'active'`,
      [agency_id]
    );
    
    const conflicts = [];
    
    // Compare each policy with others for conflicts
    for (let i = 0; i < policies.rows.length; i++) {
      for (let j = i + 1; j < policies.rows.length; j++) {
        const policyA = policies.rows[i];
        const policyB = policies.rows[j];
        
        // Simple conflict detection based on policy names and descriptions
        // In a real system, this would use more sophisticated AI analysis
        const conflictType = detectPolicyConflict(policyA, policyB);
        
        if (conflictType) {
          const conflict = await client.query(
            `INSERT INTO policy_conflicts 
             (agency_org_id, policy_a_id, policy_b_id, conflict_type, conflict_description, severity)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (agency_org_id, policy_a_id, policy_b_id) DO NOTHING
             RETURNING *`,
            [agency_id, policyA.id, policyB.id, conflictType.type, conflictType.description, conflictType.severity]
          );
          
          if (conflict.rows.length > 0) {
            conflicts.push(conflict.rows[0]);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ 
      message: `Detected ${conflicts.length} new conflicts`,
      conflicts 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error detecting conflicts:', error);
    res.status(500).json({ error: 'Failed to detect conflicts' });
  } finally {
    client.release();
  }
});

// Helper function to detect policy conflicts
function detectPolicyConflict(policyA, policyB) {
  // Simple conflict detection logic
  // In a real system, this would use AI/ML to analyze policy content
  
  const nameA = policyA.name.toLowerCase();
  const nameB = policyB.name.toLowerCase();
  const descA = policyA.description.toLowerCase();
  const descB = policyB.description.toLowerCase();
  
  // Check for similar policy names
  if (nameA.includes('privacy') && nameB.includes('privacy')) {
    return {
      type: 'naming_conflict',
      description: 'Both policies contain "privacy" in their names',
      severity: 'medium'
    };
  }
  
  // Check for data handling conflicts
  if ((descA.includes('data') && descB.includes('data')) ||
      (descA.includes('gdpr') && descB.includes('gdpr'))) {
    return {
      type: 'data_handling_conflict',
      description: 'Both policies address data handling requirements',
      severity: 'high'
    };
  }
  
  // Check for FDA compliance conflicts
  if (descA.includes('fda') && descB.includes('fda')) {
    return {
      type: 'fda_compliance_conflict',
      description: 'Both policies address FDA compliance requirements',
      severity: 'high'
    };
  }
  
  return null;
}

module.exports = router; 