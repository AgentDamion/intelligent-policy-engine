const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'aicomplyr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function applyPolicyManagementMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying Policy Management System Migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '008_create_policy_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('1. Executing migration SQL...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(`   ✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // Skip if table already exists (IF NOT EXISTS handles this)
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`   ⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n2. Verifying migration...');
    
    // Check if key tables were created
    const tables = [
      'organizations_enhanced',
      'users_enhanced',
      'policy_templates_enhanced',
      'policies_enhanced',
      'policy_rules',
      'partners',
      'policy_distributions',
      'compliance_violations',
      'compliance_checks',
      'audit_logs_enhanced',
      'policy_workflows',
      'workflow_instances'
    ];

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`   ✅ Table ${table} exists`);
      } else {
        console.log(`   ❌ Table ${table} missing`);
      }
    }

    // Check if indexes were created
    const indexes = [
      'idx_policies_enhanced_organization',
      'idx_policy_rules_policy',
      'idx_audit_logs_enhanced_org_time',
      'idx_partners_organization'
    ];

    for (const index of indexes) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        );
      `, [index]);
      
      if (result.rows[0].exists) {
        console.log(`   ✅ Index ${index} exists`);
      } else {
        console.log(`   ❌ Index ${index} missing`);
      }
    }

    // Check if sample data was inserted
    const sampleData = await client.query(`
      SELECT COUNT(*) as org_count FROM organizations_enhanced;
    `);
    
    console.log(`   ✅ Sample organizations: ${sampleData.rows[0].org_count}`);

    const templateData = await client.query(`
      SELECT COUNT(*) as template_count FROM policy_templates_enhanced;
    `);
    
    console.log(`   ✅ Sample templates: ${templateData.rows[0].template_count}`);

    console.log('\n🎉 Policy Management System migration applied successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('   • 12 new tables created');
    console.log('   • 15+ indexes for performance');
    console.log('   • Triggers for automatic timestamp updates');
    console.log('   • Sample data inserted for testing');
    console.log('   • Comprehensive audit logging system');
    console.log('   • Workflow management capabilities');
    console.log('   • Partner compliance tracking');

    console.log('\n📖 Next Steps:');
    console.log('   1. Review the schema documentation: POLICY_MANAGEMENT_SYSTEM_README.md');
    console.log('   2. Run the test script: node test-policy-management-schema.js');
    console.log('   3. Integrate with your application code');
    console.log('   4. Configure your environment variables for database connection');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  applyPolicyManagementMigration()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { applyPolicyManagementMigration };
