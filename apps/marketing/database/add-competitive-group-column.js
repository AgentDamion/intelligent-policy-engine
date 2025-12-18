require('dotenv').config();
const { Pool } = require('pg');

// Use the same connection logic as the main application
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';

const pool = new Pool({
    connectionString,
});

async function addCompetitiveGroupColumn() {
    const client = await pool.connect();
    
    try {
        console.log('Adding competitive_group column to organizations table...');
        console.log('Using connection string:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        // Check if column already exists
        const columnExists = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'competitive_group'
        `);
        
        if (columnExists.rows.length > 0) {
            console.log('✅ competitive_group column already exists');
            return;
        }
        
        // Add competitive_group column
        await client.query(`
            ALTER TABLE organizations 
            ADD COLUMN competitive_group VARCHAR(100)
        `);
        
        console.log('✅ competitive_group column added successfully');
        
        // Verify column was added
        const verifyResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'competitive_group'
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log(`✅ Column verified: ${verifyResult.rows[0].column_name} (${verifyResult.rows[0].data_type})`);
        } else {
            console.log('❌ Column verification failed');
        }
        
    } catch (error) {
        console.error('Error adding competitive_group column:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await addCompetitiveGroupColumn();
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

module.exports = { addCompetitiveGroupColumn }; 