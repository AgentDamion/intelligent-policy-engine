require('dotenv').config();
const { Pool } = require('pg');

// Use the same connection logic as the main application
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';

const pool = new Pool({
    connectionString,
});

async function addAdminAuditTable() {
    const client = await pool.connect();
    
    try {
        console.log('Adding admin_audit_log table...');
        console.log('Using connection string:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        // Create admin audit log table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_audit_log (
                id SERIAL PRIMARY KEY,
                admin_user_id VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                target VARCHAR(255) NOT NULL,
                reason TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address INET,
                result JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create indexes for efficient querying
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp);
        `);
        
        console.log('✅ Admin audit log table created successfully');
        
        // Verify table exists
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_audit_log';
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Table verification successful');
        } else {
            console.log('❌ Table verification failed');
        }
        
    } catch (error) {
        console.error('Error adding admin audit table:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await addAdminAuditTable();
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

module.exports = { addAdminAuditTable }; 