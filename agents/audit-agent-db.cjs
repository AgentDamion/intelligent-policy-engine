const { AuditAgent } = require('./audit-agent.js.cjs');
const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class PersistentAuditAgent extends AuditAgent {
    constructor(organizationId, userId) {
        super();
        this.organizationId = organizationId;
        this.userId = userId;
    }

    async startSession() {
        const session = super.startSession();
        await db.query(`
            INSERT INTO audit_sessions (session_id, organization_id, user_id, workflow_path, agents_engaged, status)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [session.session_id, this.organizationId, this.userId, JSON.stringify(session.workflow_path), session.agents_engaged, 'active']);
        return session;
    }

    async logDecision(agentType, decisionType, decision, reasoning, policiesReferenced = [], beforeState = null, afterState = null) {
        const auditEntry = super.logDecision(agentType, decisionType, decision, reasoning, policiesReferenced, beforeState, afterState);
        await db.query(`
            INSERT INTO audit_entries (entry_id, session_id, agent, decision_type, decision, reasoning, policies_referenced, before_state, after_state, risk_level, status, processing_time_ms, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
            auditEntry.entry_id,
            auditEntry.session_id,
            auditEntry.agent,
            auditEntry.decision_type,
            JSON.stringify(auditEntry.decision),
            auditEntry.reasoning,
            auditEntry.policies_referenced,
            JSON.stringify(auditEntry.before_state),
            JSON.stringify(auditEntry.after_state),
            auditEntry.risk_level,
            auditEntry.status,
            auditEntry.processing_time_ms,
            JSON.stringify(auditEntry.metadata)
        ]);
        return auditEntry;
    }

    async getAuditLog(sessionId) {
        const result = await db.query(`
            SELECT * FROM audit_entries WHERE session_id = $1 ORDER BY timestamp
        `, [sessionId]);
        return result.rows;
    }
}

module.exports = { PersistentAuditAgent }; 