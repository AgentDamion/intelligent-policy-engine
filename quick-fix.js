const { Pool } = require('pg');

// Your DATABASE_PUBLIC_URL from Railway
const DATABASE_PUBLIC_URL = 'postgresql://postgres:qgnsRxYcXHzObaSYyCfgccjIyvrgsUPD@interchange.proxy.rlwy.net:51286/railway';

const pool = new Pool({
  connectionString: DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    console.log(' Connecting to database...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log(' Connected successfully!');
    
    // Check existing audit tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'audit_%' 
      ORDER BY table_name
    `);
    
    console.log('\n Found audit tables:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Record the migration
    await pool.query(`
      INSERT INTO migrations (filename, checksum, executed_at) 
      VALUES ('001_create_audit_premium_tables.sql', 'manually_executed', NOW())
      ON CONFLICT (filename) DO NOTHING
    `);
    
    console.log('\n Migration recorded successfully!');
    
    // Verify
    const result = await pool.query('SELECT * FROM migrations');
    console.log('\n Migrations table now contains:');
    result.rows.forEach(row => {
      console.log(`  - ${row.filename}`);
    });
    
  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    await pool.end();
  }
}

fix();
