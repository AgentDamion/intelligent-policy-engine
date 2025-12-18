require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Railway Connection Verification\n');
console.log('='.repeat(60));

// Check environment variables
const connectionString = process.env.DATABASE_URL;
const railwayUrl = process.env.RAILWAY_STATIC_URL;
const port = process.env.PORT || 3000;

console.log('\n1️⃣ Environment Variables Check:');
console.log(`   DATABASE_URL: ${connectionString ? '✅ Set' : '❌ Missing'}`);
console.log(`   RAILWAY_STATIC_URL: ${railwayUrl ? '✅ Set' : '⚠️  Not set (optional)'}`);
console.log(`   PORT: ${port}`);

if (!connectionString) {
  console.error('\n❌ DATABASE_URL not found!');
  console.log('\n💡 To fix:');
  console.log('   1. Go to Railway Dashboard → Your Project → Variables');
  console.log('   2. Ensure DATABASE_URL is set (auto-provided by Railway Postgres)');
  console.log('   3. Or set it manually in your .env file');
  process.exit(1);
}

// Check port in connection string
const portMatch = connectionString.match(/:(\d+)\//);
const dbPort = portMatch ? portMatch[1] : null;

console.log(`\n2️⃣ Database Connection String Analysis:`);
console.log(`   Detected Port: ${dbPort || 'Not found'}`);
if (dbPort === '3000') {
  console.log('   ✅ Port 3000 confirmed (Railway standard)');
} else if (dbPort === '5432') {
  console.log('   ⚠️  Port 5432 detected - Railway uses port 3000');
  console.log('   💡 Update your DATABASE_URL to use port 3000');
} else {
  console.log(`   ⚠️  Unexpected port: ${dbPort}`);
}

// Test database connection
console.log(`\n3️⃣ Testing Database Connection:`);
const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Railway
});

async function verify() {
  try {
    // Basic connection test
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('   ✅ Database connection successful!');
    console.log(`   📅 Server Time: ${result.rows[0].current_time}`);
    console.log(`   🗄️  PostgreSQL: ${result.rows[0].pg_version.split(',')[0]}`);
    
    // Test table access
    try {
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `);
      console.log(`\n4️⃣ Database Schema Check:`);
      console.log(`   ✅ Can access database schema`);
      if (tablesResult.rows.length > 0) {
        console.log(`   📊 Found ${tablesResult.rows.length} table(s) (showing first 5)`);
        tablesResult.rows.forEach(row => {
          console.log(`      - ${row.table_name}`);
        });
      }
    } catch (schemaErr) {
      console.log(`   ⚠️  Schema check failed: ${schemaErr.message}`);
    }
    
    // Check for agent_task_requests table (used by worker.py)
    try {
      const agentTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'agent_task_requests'
        ) as exists;
      `);
      if (agentTableCheck.rows[0].exists) {
        console.log(`\n5️⃣ Agent Worker Table Check:`);
        console.log(`   ✅ 'agent_task_requests' table exists`);
        
        // Count pending tasks
        const taskCount = await pool.query(`
          SELECT COUNT(*) as count, status 
          FROM agent_task_requests 
          GROUP BY status
        `);
        if (taskCount.rows.length > 0) {
          console.log(`   📊 Task status breakdown:`);
          taskCount.rows.forEach(row => {
            console.log(`      - ${row.status}: ${row.count}`);
          });
        }
      } else {
        console.log(`\n5️⃣ Agent Worker Table Check:`);
        console.log(`   ⚠️  'agent_task_requests' table not found`);
        console.log(`   💡 This table is needed for agent-worker/worker.py`);
      }
    } catch (tableErr) {
      console.log(`   ⚠️  Table check failed: ${tableErr.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Railway connection verification complete!');
    
  } catch (err) {
    console.error('\n❌ Connection test failed!');
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code || 'N/A'}`);
    
    if (err.code === 'ENOTFOUND') {
      console.log('\n💡 Possible issues:');
      console.log('   - Check if Railway Postgres service is running');
      console.log('   - Verify DATABASE_URL is correct');
      console.log('   - Check network connectivity');
    } else if (err.code === '28P01') {
      console.log('\n💡 Authentication failed:');
      console.log('   - Check database password in DATABASE_URL');
      console.log('   - Verify credentials in Railway dashboard');
    } else if (err.code === '3D000') {
      console.log('\n💡 Database not found:');
      console.log('   - Check database name in DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verify();

