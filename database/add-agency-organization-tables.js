require('dotenv').config();
const { Pool } = require('pg');

// Use the same connection logic as the main application
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';

const pool = new Pool({
    connectionString,
});

async function addAgencyOrganizationTables() {
    const client = await pool.connect();
    
    try {
        console.log('Adding agencies and organizations tables...');
        console.log('Using connection string:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        // Create organizations table
        await client.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                industry VARCHAR(100),
                competitive_group VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create agencies table
        await client.query(`
            CREATE TABLE IF NOT EXISTS agencies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Agencies and organizations tables created successfully');
        
        // Verify tables exist
        const tables = ['organizations', 'agencies'];
        for (const table of tables) {
            const result = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            `, [table]);
            
            if (result.rows.length > 0) {
                console.log(`✅ Table '${table}' exists`);
            } else {
                console.log(`❌ Table '${table}' not found`);
            }
        }
        
    } catch (error) {
        console.error('Error adding agency and organization tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await addAgencyOrganizationTables();
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

module.exports = { addAgencyOrganizationTables }; 