const pool = require('./database/db-connection');

async function checkColumns() {
  try {
    console.log('🔍 Checking audit_sessions columns:');
    const sessions = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_sessions'
      ORDER BY ordinal_position
    `);
    sessions.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
    console.log('\n🔍 Checking audit_entries columns:');
    const entries = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_entries'
      ORDER BY ordinal_position
    `);
    entries.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();