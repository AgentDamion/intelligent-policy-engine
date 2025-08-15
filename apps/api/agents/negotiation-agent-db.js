const { NegotiationAgent } = require('./negotiation-agent.js');
const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class PersistentNegotiationAgent extends NegotiationAgent {
    constructor(organizationId) {
        super();
        this.organizationId = organizationId;
    }

    async createNegotiation(negotiationData) {
        const negotiation_id = uuidv4();
        await db.query(`
            INSERT INTO negotiations (negotiation_id, organization_id, timestamp, clients, relationships, conflicts, solution, client_requirements, status)
            VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
        `, [
            negotiation_id,
            this.organizationId,
            JSON.stringify(negotiationData.clients),
            JSON.stringify(negotiationData.relationships),
            JSON.stringify(negotiationData.conflicts),
            JSON.stringify(negotiationData.solution),
            JSON.stringify(negotiationData.client_requirements),
            negotiationData.status || 'active'
        ]);
        return negotiation_id;
    }

    async getNegotiation(negotiationId) {
        const result = await db.query(`
            SELECT * FROM negotiations WHERE negotiation_id = $1 AND organization_id = $2
        `, [negotiationId, this.organizationId]);
        return result.rows[0];
    }

    async updateNegotiation(negotiationId, updates) {
        // For simplicity, update only status and solution
        await db.query(`
            UPDATE negotiations SET status = $1, solution = $2 WHERE negotiation_id = $3 AND organization_id = $4
        `, [updates.status, JSON.stringify(updates.solution), negotiationId, this.organizationId]);
    }
}

module.exports = { PersistentNegotiationAgent }; 