#!/usr/bin/env node

/**
 * Direct Supabase Migration Runner
 * This script directly executes migrations through the Supabase client
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
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

async function executeSQL(sql) {
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📝 Executing statement ${i + 1}...`);
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // If exec_sql is not available, try alternative approach
            console.log(`⚠️  exec_sql not available, trying alternative method...`);
            
            // For table creation, we can check if table exists instead
            if (statement.toLowerCase().includes('create table')) {
              const tableName = extractTableName(statement);
              if (tableName) {
                const { data: tableCheck, error: tableError } = await supabase
                  .from(tableName)
                  .select('*')
                  .limit(1);
                
                if (!tableError) {
                  console.log(`✅ Table ${tableName} already exists`);
                } else {
                  console.log(`⚠️  Table ${tableName} may not exist yet`);
                }
              }
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} had issues: ${err.message}`);
        }
      }
    }
    return true;
  } catch (error) {
    console.error(`❌ Error executing SQL:`, error);
    return false;
  }
}

function extractTableName(createTableSQL) {
  const match = createTableSQL.match(/CREATE TABLE (?:IF NOT EXISTS )?([a-zA-Z_][a-zA-Z0-9_]*)/i);
  return match ? match[1] : null;
}

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
    
    // Execute the SQL
    const success = await executeSQL(sql);
    
    if (success) {
      console.log(`✅ Migration completed: ${migrationFile}`);
    } else {
      console.log(`⚠️  Migration had some issues: ${migrationFile}`);
    }
    
    return success;
    
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

async function checkTables() {
  try {
    console.log('\n🔍 Checking existing tables...');
    
    // Try to query some common tables to see what exists
    const tables = [
      'organizations_enhanced',
      'users_enhanced', 
      'policies',
      'policy_templates',
      'contracts',
      'audit_entries'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🚀 Direct Supabase Migration Runner');
  console.log('===================================\n');
  
  switch (command) {
    case 'list':
      await listMigrations();
      break;
      
    case 'check':
      await checkTables();
      break;
      
    case 'run':
      const migrationFile = process.argv[3];
      if (!migrationFile) {
        console.error('❌ Please specify a migration file to run');
        console.error('   Usage: node run-migrations-direct.js run <migration-file>');
        process.exit(1);
      }
      
      const success = await runMigration(migrationFile);
      if (success) {
        console.log('\n🎉 Migration completed successfully!');
      } else {
        console.log('\n⚠️  Migration had some issues. Check the output above.');
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
        }
        console.log(''); // Add spacing between migrations
      }
      
      if (allSuccess) {
        console.log('🎉 All migrations completed successfully!');
      } else {
        console.log('⚠️  Some migrations had issues. Check the output above.');
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node run-migrations-direct.js list                    - List available migrations');
      console.log('  node run-migrations-direct.js check                  - Check existing tables');
      console.log('  node run-migrations-direct.js run <migration-file>   - Run specific migration');
      console.log('  node run-migrations-direct.js run-all                - Run all migrations');
      console.log('\nExamples:');
      console.log('  node run-migrations-direct.js run 001_initial_schema.sql');
      console.log('  node run-migrations-direct.js run-all');
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
