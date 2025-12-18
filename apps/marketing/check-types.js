const { Pool } = require('pg');

const DATABASE_PUBLIC_URL = 'postgresql://postgres:qgnsRxYcXHzObaSYyCfgccjIyvrgsUPD@interchange.proxy.rlwy.net:51286/railway';

const pool = new Pool({
  connectionString: DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTypes() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('audit_entries', 'audit_sessions')
      AND column_name IN ('id', 'entry_id', 'session_id')
      ORDER BY table_name, column_name
    `);
    
    console.log('Column types in existing tables:');
    result.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTypes();