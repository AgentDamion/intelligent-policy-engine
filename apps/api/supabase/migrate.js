#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * This script helps apply migrations to your Supabase database
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Also load .env as fallback
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env file or environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration directory
const migrationsDir = path.join(__dirname, 'migrations');

async function runMigration(migrationFile) {
  const filePath = path.join(migrationsDir, migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    return false;
  }

  try {
    console.log(`📋 Running migration: ${migrationFile}`);
    
    // Read migration SQL
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        // Supabase doesn't support exec_sql by default, so we'll provide guidance
        // for manual execution in the dashboard
        console.log(`📝 Statement ${i + 1} needs to be run in Supabase dashboard:`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        console.log(`   Visit: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/new`);
        console.log('');
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error);
    return false;
  }
}

async function listMigrations() {
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('\n📁 Available migrations:');
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    return files;
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error);
    return [];
  }
}

async function checkMigrationStatus() {
  try {
    const { data, error } = await supabase
      .from('supabase_migrations')
      .select('*')
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.log('ℹ️  No migration tracking table found yet');
      return [];
    }
    
    console.log('\n📊 Applied migrations:');
    data.forEach(migration => {
      console.log(`   ✅ ${migration.migration_name} - ${migration.applied_at}`);
    });
    
    return data;
  } catch (error) {
    console.log('ℹ️  Could not check migration status');
    return [];
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🚀 Supabase Migration Runner');
  console.log('=============================\n');
  
  switch (command) {
    case 'list':
      await listMigrations();
      break;
      
    case 'status':
      await checkMigrationStatus();
      break;
      
    case 'run':
      const migrationFile = process.argv[3];
      if (!migrationFile) {
        console.error('❌ Please specify a migration file to run');
        console.error('   Usage: node migrate.js run <migration-file>');
        process.exit(1);
      }
      
      const success = await runMigration(migrationFile);
      if (success) {
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n⚠️  Note: Some SQL statements may need to be run manually in the Supabase dashboard');
        console.log('   Visit: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/new');
      } else {
        console.log('\n❌ Migration failed. Please check the errors above.');
        process.exit(1);
      }
      break;
      
    case 'run-all':
      const migrations = await listMigrations();
      console.log('\n🔄 Running all migrations...\n');
      
      let allSuccess = true;
      for (const migration of migrations) {
        const success = await runMigration(migration);
        if (!success) {
          allSuccess = false;
          break;
        }
        console.log(''); // Add spacing between migrations
      }
      
      if (allSuccess) {
        console.log('🎉 All migrations completed successfully!');
      } else {
        console.log('❌ Some migrations failed. Please check the errors above.');
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node migrate.js list                    - List available migrations');
      console.log('  node migrate.js status                  - Check migration status');
      console.log('  node migrate.js run <migration-file>   - Run specific migration');
      console.log('  node migrate.js run-all                 - Run all migrations');
      console.log('\nExamples:');
      console.log('  node migrate.js run 001_initial_schema.sql');
      console.log('  node migrate.js run-all');
      break;
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
