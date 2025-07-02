require('dotenv').config();
const { Pool } = require('pg');

// Use the same connection logic as the main application
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';

const pool = new Pool({
    connectionString,
});

async function seedSampleData() {
    const client = await pool.connect();
    
    try {
        console.log('Seeding sample organizations and agencies...');
        console.log('Using connection string:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        // Insert sample organizations
        const orgs = [
            { name: 'PharmaCorp Inc.', industry: 'Pharmaceuticals', competitive_group: 'pharma_giants' },
            { name: 'MediTech Solutions', industry: 'Medical Technology', competitive_group: 'medtech_innovators' },
            { name: 'Global Finance Bank', industry: 'Banking', competitive_group: 'global_banks' },
            { name: 'TechStart Ventures', industry: 'Technology', competitive_group: 'tech_startups' },
            { name: 'BioGen Research', industry: 'Biotechnology', competitive_group: 'biotech_leaders' }
        ];
        
        console.log('Inserting organizations...');
        for (const org of orgs) {
            const result = await client.query(`
                INSERT INTO organizations (name, industry, competitive_group) 
                VALUES ($1, $2, $3) 
                RETURNING id, name
            `, [org.name, org.industry, org.competitive_group]);
            
            console.log(`✅ Created organization: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        }
        
        // Insert sample agencies
        const agencies = [
            { name: 'ComplianceFirst Agency', specialization: 'Regulatory Compliance' },
            { name: 'RiskGuard Partners', specialization: 'Risk Management' },
            { name: 'PolicyPro Solutions', specialization: 'Policy Development' },
            { name: 'AuditSecure LLC', specialization: 'Audit Services' }
        ];
        
        console.log('\nInserting agencies...');
        for (const agency of agencies) {
            const result = await client.query(`
                INSERT INTO agencies (name, specialization) 
                VALUES ($1, $2) 
                RETURNING id, name
            `, [agency.name, agency.specialization]);
            
            console.log(`✅ Created agency: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        }
        
        // Create relationships between agencies and organizations
        console.log('\nCreating agency-organization relationships...');
        const relationships = [
            { agency_id: 1, organization_id: 1, relationship_type: 'client' },
            { agency_id: 1, organization_id: 2, relationship_type: 'client' },
            { agency_id: 2, organization_id: 3, relationship_type: 'client' },
            { agency_id: 2, organization_id: 4, relationship_type: 'client' },
            { agency_id: 3, organization_id: 5, relationship_type: 'client' },
            { agency_id: 4, organization_id: 1, relationship_type: 'client' },
            { agency_id: 4, organization_id: 3, relationship_type: 'client' }
        ];
        
        for (const rel of relationships) {
            const result = await client.query(`
                INSERT INTO relationships (agency_id, organization_id, relationship_type) 
                VALUES ($1, $2, $3) 
                RETURNING id
            `, [rel.agency_id, rel.organization_id, rel.relationship_type]);
            
            console.log(`✅ Created relationship ID: ${result.rows[0].id} (Agency ${rel.agency_id} -> Org ${rel.organization_id})`);
        }
        
        console.log('\n✅ Sample data seeding completed successfully!');
        
        // Display summary
        const orgCount = await client.query('SELECT COUNT(*) FROM organizations');
        const agencyCount = await client.query('SELECT COUNT(*) FROM agencies');
        const relCount = await client.query('SELECT COUNT(*) FROM relationships');
        
        console.log(`\n📊 Database Summary:`);
        console.log(`   Organizations: ${orgCount.rows[0].count}`);
        console.log(`   Agencies: ${agencyCount.rows[0].count}`);
        console.log(`   Relationships: ${relCount.rows[0].count}`);
        
    } catch (error) {
        console.error('Error seeding sample data:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await seedSampleData();
        console.log('\nSeeding completed successfully');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    main();
}

module.exports = { seedSampleData }; 