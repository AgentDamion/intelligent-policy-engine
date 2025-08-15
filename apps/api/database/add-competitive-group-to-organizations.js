require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';
const pool = new Pool({ connectionString });

async function migrate() {
  try {
    // Check if column exists
    const checkRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='organizations' AND column_name='competitive_group'`);
    if (checkRes.rows.length === 0) {
      await pool.query(`ALTER TABLE organizations ADD COLUMN competitive_group VARCHAR(100)`);
      console.log('competitive_group column added to organizations table.');
    } else {
      console.log('competitive_group column already exists in organizations table.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate(); 