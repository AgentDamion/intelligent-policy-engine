require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createOrg() {
  try {
    // First check if any organizations exist
    const existing = await pool.query('SELECT id, name FROM organizations LIMIT 1');
    
    if (existing.rows.length > 0) {
      console.log('Found existing organization:');
      console.log('ID:', existing.rows[0].id);
      console.log('Name:', existing.rows[0].name);
      console.log('\nUse this ID in your frontend:', existing.rows[0].id);
    } else {
      // Create a new one
      const result = await pool.query(`
        INSERT INTO organizations (name, type, competitive_group)
        VALUES ('Demo Company', 'enterprise', 'pharma')
        RETURNING id, name
      `);
      
      console.log('Created new organization:');
      console.log('ID:', result.rows[0].id);
      console.log('Name:', result.rows[0].name);
      console.log('\nUse this ID in your frontend:', result.rows[0].id);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createOrg(); 