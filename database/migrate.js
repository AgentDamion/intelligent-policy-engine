require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';
const pool = new Pool({ connectionString });

async function migrate() {
  try {
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    await pool.query(sql);
    console.log('Database migration successful.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate(); 