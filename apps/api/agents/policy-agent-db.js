const { PolicyAgent } = require('./policy-agent.js');
const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class PersistentPolicyAgent extends PolicyAgent {
    constructor(organizationId) {
        super();
        this.organizationId = organizationId;
    }

    async createPolicy(policyData) {
        const id = uuidv4();
        await db.query(`
            INSERT INTO policies (id, organization_id, name, risk_profiles, rules, version, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            id,
            this.organizationId,
            policyData.name,
            JSON.stringify(policyData.risk_profiles),
            JSON.stringify(policyData.rules),
            policyData.version || 1,
            policyData.status || 'active'
        ]);
        return id;
    }

    async getPolicy(policyId) {
        const result = await db.query(`
            SELECT * FROM policies WHERE id = $1 AND organization_id = $2
        `, [policyId, this.organizationId]);
        return result.rows[0];
    }

    async updatePolicy(policyId, updates) {
        await db.query(`
            UPDATE policies SET name = $1, risk_profiles = $2, rules = $3, version = $4, status = $5 WHERE id = $6 AND organization_id = $7
        `, [
            updates.name,
            JSON.stringify(updates.risk_profiles),
            JSON.stringify(updates.rules),
            updates.version,
            updates.status,
            policyId,
            this.organizationId
        ]);
    }

    async processPolicy(contextOutput) {
        // Call the parent class's evaluateRequest method
        return super.evaluateRequest(contextOutput);
    }
}  // ← This bracket closes the class

module.exports = { PersistentPolicyAgent }; 