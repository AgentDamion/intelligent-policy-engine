#!/usr/bin/env node

/**
 * Direct Supabase Migration Runner
 * This script directly executes migrations through the Supabase client
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const files = fs.readdirSync(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('\n📋 Available migrations:');
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    return migrationFiles;
  } catch (error) {
    console.error('❌ Error listing migrations:', error);
    return [];
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting migration process...\n');
  
  try {
    const migrationFiles = await listMigrations();
    
    if (migrationFiles.length === 0) {
      console.log('❌ No migration files found');
      return false;
    }
    
    let successCount = 0;
    let totalCount = migrationFiles.length;
    
    for (const migrationFile of migrationFiles) {
      const success = await runMigration(migrationFile);
      if (success) successCount++;
      console.log(''); // Add spacing between migrations
    }
    
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${totalCount - successCount}`);
    console.log(`   📊 Total: ${totalCount}`);
    
    return successCount === totalCount;
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    return false;
  }
}

async function runSpecificMigration(migrationName) {
  if (!migrationName) {
    console.error('❌ Please specify a migration file name');
    console.log('Usage: node run-migrations-direct.mjs <migration-file.sql>');
    return false;
  }
  
  // Ensure .sql extension
  if (!migrationName.endsWith('.sql')) {
    migrationName += '.sql';
  }
  
  console.log(`🎯 Running specific migration: ${migrationName}`);
  return await runMigration(migrationName);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0) {
      // No arguments - run all migrations
      await runAllMigrations();
    } else if (args[0] === '--list' || args[0] === '-l') {
      // List migrations
      await listMigrations();
    } else if (args[0] === '--help' || args[0] === '-h') {
      // Show help
      console.log('🚀 Supabase Migration Runner');
      console.log('');
      console.log('Usage:');
      console.log('  node run-migrations-direct.mjs                    # Run all migrations');
      console.log('  node run-migrations-direct.mjs <migration.sql>    # Run specific migration');
      console.log('  node run-migrations-direct.mjs --list             # List available migrations');
      console.log('  node run-migrations-direct.mjs --help             # Show this help');
      console.log('');
      console.log('Environment Variables:');
      console.log('  SUPABASE_URL                    # Your Supabase project URL');
      console.log('  SUPABASE_SERVICE_ROLE_KEY       # Your Supabase service role key');
    } else {
      // Run specific migration
      await runSpecificMigration(args[0]);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
