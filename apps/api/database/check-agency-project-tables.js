require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';
const pool = new Pool({ connectionString });

async function checkTable(tableName) {
  const res = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName]
  );
  return res.rows[0].exists;
}

(async () => {
  try {
    const agenciesExists = await checkTable('agencies');
    const projectsExists = await checkTable('projects');
    console.log(`agencies table exists: ${agenciesExists}`);
    console.log(`projects table exists: ${projectsExists}`);
    process.exit(0);
  } catch (err) {
    console.error('Error checking tables:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})(); 