require('dotenv').config();
const { Pool } = require('pg');

// Use the same connection logic as the main application
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';

const pool = new Pool({
    connectionString,
});

async function addRelationshipsTable() {
    const client = await pool.connect();
    
    try {
        console.log('Adding relationships table...');
        console.log('Using connection string:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        // Create relationships table
        await client.query(`
            CREATE TABLE IF NOT EXISTS relationships (
                id SERIAL PRIMARY KEY,
                agency_id INTEGER REFERENCES agencies(id),
                organization_id INTEGER REFERENCES organizations(id),
                relationship_type VARCHAR(50) DEFAULT 'client',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Relationships table created successfully');
        
        // Verify table exists
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'relationships'
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Table verification successful');
        } else {
            console.log('❌ Table verification failed');
        }
        
    } catch (error) {
        console.error('Error adding relationships table:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await addRelationshipsTable();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    main();
}

module.exports = { addRelationshipsTable }; 