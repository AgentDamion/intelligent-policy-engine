// Partner-Enterprise Relationship Service
// File: api/services/relationship-service.js

const db = require('../../database/connection');
const { getCacheService } = require('./cache-service');

class RelationshipService {
    constructor() {
        this.cache = getCacheService();
    }

    /**
     * Create a new partner-enterprise relationship
     */
    async createRelationship(partnerEnterpriseId, clientEnterpriseId, relationshipData, createdByUserId) {
        // Validate enterprises exist and are different
        if (partnerEnterpriseId === clientEnterpriseId) {
            throw new Error('Partner and client enterprises must be different');
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Check if relationship already exists
            const existing = await client.query(`
                SELECT * FROM partner_enterprise_relationships
                WHERE partner_enterprise_id = $1 AND client_enterprise_id = $2
            `, [partnerEnterpriseId, clientEnterpriseId]);

            if (existing.rows[0]) {
                throw new Error('Relationship already exists');
            }

            // Create relationship
            const result = await client.query(`
                INSERT INTO partner_enterprise_relationships (
                    partner_enterprise_id,
                    client_enterprise_id,
                    relationship_status,
                    relationship_type,
                    contract_start_date,
                    contract_end_date,
                    compliance_score,
                    risk_level,
                    settings,
                    created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                partnerEnterpriseId,
                clientEnterpriseId,
                relationshipData.relationshipStatus || 'pending',
                relationshipData.relationshipType || 'agency',
                relationshipData.contractStartDate || null,
                relationshipData.contractEndDate || null,
                relationshipData.complianceScore || 0.00,
                relationshipData.riskLevel || 'low',
                JSON.stringify(relationshipData.settings || {}),
                createdByUserId
            ]);

            await client.query('COMMIT');

            // Invalidate cache
            await this.invalidateRelationshipCache(partnerEnterpriseId, clientEnterpriseId);

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get relationship by ID
     */
    async getRelationship(relationshipId) {
        const result = await db.query(`
            SELECT 
                per.*,
                pe.name as partner_enterprise_name,
                ce.name as client_enterprise_name
            FROM partner_enterprise_relationships per
            JOIN enterprises pe ON per.partner_enterprise_id = pe.id
            JOIN enterprises ce ON per.client_enterprise_id = ce.id
            WHERE per.id = $1
        `, [relationshipId]);

        return result.rows[0] || null;
    }

    /**
     * List relationships (filtered by context)
     */
    async listRelationships(filters = {}) {
        let query = `
            SELECT 
                per.*,
                pe.name as partner_enterprise_name,
                ce.name as client_enterprise_name
            FROM partner_enterprise_relationships per
            JOIN enterprises pe ON per.partner_enterprise_id = pe.id
            JOIN enterprises ce ON per.client_enterprise_id = ce.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (filters.partnerEnterpriseId) {
            query += ` AND per.partner_enterprise_id = $${paramIndex++}`;
            params.push(filters.partnerEnterpriseId);
        }

        if (filters.clientEnterpriseId) {
            query += ` AND per.client_enterprise_id = $${paramIndex++}`;
            params.push(filters.clientEnterpriseId);
        }

        if (filters.relationshipStatus) {
            query += ` AND per.relationship_status = $${paramIndex++}`;
            params.push(filters.relationshipStatus);
        }

        query += ` ORDER BY per.created_at DESC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Update relationship
     */
    async updateRelationship(relationshipId, updateData, updatedByUserId) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (updateData.relationshipStatus !== undefined) {
                updates.push(`relationship_status = $${paramIndex++}`);
                params.push(updateData.relationshipStatus);
            }

            if (updateData.complianceScore !== undefined) {
                updates.push(`compliance_score = $${paramIndex++}`);
                params.push(updateData.complianceScore);
            }

            if (updateData.riskLevel !== undefined) {
                updates.push(`risk_level = $${paramIndex++}`);
                params.push(updateData.riskLevel);
            }

            if (updateData.settings !== undefined) {
                updates.push(`settings = $${paramIndex++}`);
                params.push(JSON.stringify(updateData.settings));
            }

            if (updateData.contractStartDate !== undefined) {
                updates.push(`contract_start_date = $${paramIndex++}`);
                params.push(updateData.contractStartDate);
            }

            if (updateData.contractEndDate !== undefined) {
                updates.push(`contract_end_date = $${paramIndex++}`);
                params.push(updateData.contractEndDate);
            }

            if (updates.length === 0) {
                throw new Error('No fields to update');
            }

            updates.push(`updated_at = NOW()`);
            params.push(relationshipId);

            const result = await client.query(`
                UPDATE partner_enterprise_relationships
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `, params);

            await client.query('COMMIT');

            const relationship = result.rows[0];
            await this.invalidateRelationshipCache(
                relationship.partner_enterprise_id,
                relationship.client_enterprise_id
            );

            return relationship;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get all clients for a partner
     */
    async getPartnerClients(partnerEnterpriseId, status = 'active') {
        const cacheKey = this.cache.enterpriseKey(partnerEnterpriseId, 'clients', status);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await db.query(`
            SELECT 
                per.*,
                ce.id as client_enterprise_id,
                ce.name as client_enterprise_name,
                ce.type as client_enterprise_type,
                ce.subscription_tier
            FROM partner_enterprise_relationships per
            JOIN enterprises ce ON per.client_enterprise_id = ce.id
            WHERE per.partner_enterprise_id = $1
              AND per.relationship_status = $2
            ORDER BY ce.name
        `, [partnerEnterpriseId, status]);

        const clients = result.rows;
        await this.cache.set(cacheKey, clients, 300); // 5 minutes

        return clients;
    }

    /**
     * Get all partners for an enterprise
     */
    async getEnterprisePartners(clientEnterpriseId, status = 'active') {
        const cacheKey = this.cache.enterpriseKey(clientEnterpriseId, 'partners', status);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await db.query(`
            SELECT 
                per.*,
                pe.id as partner_enterprise_id,
                pe.name as partner_enterprise_name,
                pe.type as partner_enterprise_type
            FROM partner_enterprise_relationships per
            JOIN enterprises pe ON per.partner_enterprise_id = pe.id
            WHERE per.client_enterprise_id = $1
              AND per.relationship_status = $2
            ORDER BY pe.name
        `, [clientEnterpriseId, status]);

        const partners = result.rows;
        await this.cache.set(cacheKey, partners, 300); // 5 minutes

        return partners;
    }

    /**
     * Calculate compliance score for a relationship
     */
    async calculateComplianceScore(partnerEnterpriseId, clientEnterpriseId) {
        // This is a placeholder - implement actual compliance calculation logic
        // Could be based on:
        // - Policy violations
        // - Submission approval rates
        // - Audit results
        // - Response times
        
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_submissions,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions
            FROM tool_submissions
            WHERE partner_enterprise_id = $1 
              AND client_enterprise_id = $2
              AND created_at > NOW() - INTERVAL '90 days'
        `, [partnerEnterpriseId, clientEnterpriseId]);

        const stats = result.rows[0];
        if (stats.total_submissions === 0) {
            return 50.0; // Default score if no submissions
        }

        const approvalRate = (stats.approved_submissions / stats.total_submissions) * 100;
        return Math.round(approvalRate * 10) / 10; // Round to 1 decimal
    }

    /**
     * Invalidate relationship cache
     */
    async invalidateRelationshipCache(partnerEnterpriseId, clientEnterpriseId) {
        await Promise.all([
            this.cache.del(this.cache.enterpriseKey(partnerEnterpriseId, 'clients', 'active')),
            this.cache.del(this.cache.enterpriseKey(clientEnterpriseId, 'partners', 'active')),
            this.cache.del(this.cache.enterpriseKey(partnerEnterpriseId, 'clients', 'pending')),
            this.cache.del(this.cache.enterpriseKey(clientEnterpriseId, 'partners', 'pending'))
        ]);
    }
}

module.exports = new RelationshipService();

