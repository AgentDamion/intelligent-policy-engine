require('dotenv').config();
const { Pool } = require('pg');

// Use Railway's DATABASE_URL directly
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found. Make sure you have Railway env vars.');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Railway
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    
    // Check if organizations_enhanced table exists and has data
    const orgCheck = await pool.query(`
      SELECT COUNT(*) as org_count 
      FROM organizations_enhanced
    `);
    
    console.log(`📊 Found ${orgCheck.rows[0].org_count} organizations in database`);
    
    if (orgCheck.rows[0].org_count === 0) {
      console.log('⚠️  No organizations found. The sample data in the migration may fail.');
      console.log('💡 Consider running the policy management migration first or creating sample organizations.');
    } else {
      console.log('✅ Organizations found - migration should work with sample data');
    }
    
    // Check if contract management tables already exist
    const contractCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'contract_templates'
      ) as exists;
    `);
    
    if (contractCheck.rows[0].exists) {
      console.log('⚠️  Contract management tables already exist');
    } else {
      console.log('✅ Contract management tables do not exist - ready for migration');
    }
    
  } catch (err) {
    console.error('❌ Database test failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
