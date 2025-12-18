const pool = require('../database/connection');

class MultiTenantOrchestratorAgent {
  constructor() {
    this.name = 'multi-tenant-orchestrator';
  }

  async process(input, context = {}) {
    const tenant = await this.resolveTenantContext(context);

    // Simple routing hints: enforce data isolation and tenant-aware flags
    const routing = {
      enterpriseId: tenant.enterpriseId,
      agencyId: tenant.agencyId,
      dataIsolationKey: tenant.isolationKey,
      policies: tenant.policies || [],
      riskFactors: tenant.riskFactors || []
    };

    return {
      tenant,
      routing,
      confidence: tenant.confidence || 0.9
    };
  }

  async resolveTenantContext(context) {
    const enterpriseId = context.enterpriseId || null;
    const agencyId = context.agencyId || null;

    // Best-effort DB lookups; if DB not configured, return minimal context
    try {
      if (!enterpriseId) {
        return { enterpriseId: null, agencyId, isolationKey: 'public', confidence: 0.5 };
      }

      const org = await pool.query('SELECT id, name FROM organizations WHERE id = $1 LIMIT 1', [enterpriseId]);
      const isolationKey = `tenant-${enterpriseId}`;

      let relationship = null;
      if (agencyId) {
        const rel = await pool.query(
          'SELECT relationship_status, compliance_score FROM agency_enterprise_relationships WHERE enterprise_org_id = $1 AND agency_org_id = $2 LIMIT 1',
          [enterpriseId, agencyId]
        );
        relationship = rel.rows[0] || null;
      }

      return {
        enterpriseId,
        agencyId: agencyId || null,
        isolationKey,
        relationship,
        confidence: 0.9
      };
    } catch (e) {
      return { enterpriseId, agencyId, isolationKey: 'public', confidence: 0.6, error: e.message };
    }
  }
}

module.exports = MultiTenantOrchestratorAgent;
