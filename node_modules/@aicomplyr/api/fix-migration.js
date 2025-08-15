require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixMigration() {
  try {
    // Check existing audit tables
    console.log('🔍 Checking existing audit tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'audit_%' 
      ORDER BY table_name
    `);
    
    console.log('Found tables:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Record the migration
    console.log('\n📝 Recording migration as executed...');
    await pool.query(`
      INSERT INTO migrations (filename, checksum, executed_at) 
      VALUES ('001_create_audit_premium_tables.sql', 'manually_executed', NOW())
      ON CONFLICT (filename) DO NOTHING
    `);
    
    // Verify
    const migrations = await pool.query('SELECT * FROM migrations');
    console.log('\n✅ Migrations table now contains:');
    migrations.rows.forEach(row => {
      console.log(`  - ${row.filename} (executed at ${row.executed_at})`);
    });
    
    console.log('\n🎉 Fixed! You can now run future migrations normally.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixMigration();