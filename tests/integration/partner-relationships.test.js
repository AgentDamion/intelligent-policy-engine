// Partner-Enterprise Relationships Integration Tests
// File: tests/integration/partner-relationships.test.js

const relationshipService = require('../../api/services/relationship-service');
const db = require('../../database/connection');

describe('Partner-Enterprise Relationships', () => {
    let partnerEnterpriseId;
    let clientEnterpriseId;
    let relationshipId;

    beforeAll(async () => {
        // Create test enterprises
        const partnerResult = await db.query(`
            INSERT INTO enterprises (name, slug, type, subscription_tier)
            VALUES ('Test Partner Agency', 'test-partner', 'partner', 'standard')
            RETURNING id
        `);
        partnerEnterpriseId = partnerResult.rows[0].id;

        const clientResult = await db.query(`
            INSERT INTO enterprises (name, slug, type, subscription_tier)
            VALUES ('Test Client Pharma', 'test-client', 'pharma', 'enterprise')
            RETURNING id
        `);
        clientEnterpriseId = clientResult.rows[0].id;
    });

    afterAll(async () => {
        // Cleanup
        if (relationshipId) {
            await db.query('DELETE FROM partner_enterprise_relationships WHERE id = $1', [relationshipId]);
        }
        if (partnerEnterpriseId) {
            await db.query('DELETE FROM enterprises WHERE id = $1', [partnerEnterpriseId]);
        }
        if (clientEnterpriseId) {
            await db.query('DELETE FROM enterprises WHERE id = $1', [clientEnterpriseId]);
        }
    });

    test('should create a partner-enterprise relationship', async () => {
        const relationship = await relationshipService.createRelationship(
            partnerEnterpriseId,
            clientEnterpriseId,
            {
                relationshipStatus: 'active',
                relationshipType: 'agency',
                complianceScore: 85.5
            },
            null // createdByUserId
        );

        expect(relationship).toBeDefined();
        expect(relationship.partner_enterprise_id).toBe(partnerEnterpriseId);
        expect(relationship.client_enterprise_id).toBe(clientEnterpriseId);
        expect(relationship.relationship_status).toBe('active');
        
        relationshipId = relationship.id;
    });

    test('should get partner clients', async () => {
        const clients = await relationshipService.getPartnerClients(partnerEnterpriseId, 'active');
        
        expect(clients).toBeDefined();
        expect(Array.isArray(clients)).toBe(true);
        expect(clients.length).toBeGreaterThan(0);
        expect(clients[0].client_enterprise_id).toBe(clientEnterpriseId);
    });

    test('should get enterprise partners', async () => {
        const partners = await relationshipService.getEnterprisePartners(clientEnterpriseId, 'active');
        
        expect(partners).toBeDefined();
        expect(Array.isArray(partners)).toBe(true);
        expect(partners.length).toBeGreaterThan(0);
        expect(partners[0].partner_enterprise_id).toBe(partnerEnterpriseId);
    });

    test('should update relationship', async () => {
        const updated = await relationshipService.updateRelationship(
            relationshipId,
            {
                complianceScore: 90.0,
                riskLevel: 'low'
            },
            null
        );

        expect(updated.compliance_score).toBe('90.00');
        expect(updated.risk_level).toBe('low');
    });
});

