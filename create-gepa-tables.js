import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createGEPATables() {
  console.log('🚀 Creating GEPA optimization tables...\n');

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20250119_gepa_optimization.sql', 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📝 Executing statement ${i + 1}...`);
          
          // Try to execute via RPC call
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  RPC failed, trying direct query approach...`);
            
            // For CREATE TABLE statements, we'll try a different approach
            if (statement.toLowerCase().includes('create table')) {
              console.log(`ℹ️  CREATE TABLE statement - may need manual execution`);
              console.log(`   Statement: ${statement.substring(0, 100)}...`);
            } else {
              console.log(`⚠️  Statement ${i + 1} had issues: ${error.message}`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} had issues: ${err.message}`);
        }
      }
    }

    console.log('\n📊 Table creation process completed');
    console.log('\n⚠️  Note: Some tables may need to be created manually in the Supabase dashboard');
    console.log('   You can copy the SQL from supabase/migrations/20250119_gepa_optimization.sql');
    console.log('   and run it in the Supabase SQL editor.');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createGEPATables();
