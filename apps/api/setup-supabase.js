#!/usr/bin/env node

/**
 * Supabase Quick Setup Script
 * This script helps set up your Supabase configuration and test the connection
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🚀 AICOMPLYR Supabase Setup');
console.log('============================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  // Read the example file
  const examplePath = path.join(process.cwd(), 'env.supabase.example');
  if (fs.existsSync(examplePath)) {
    const exampleContent = fs.readFileSync(examplePath, 'utf8');
    fs.writeFileSync(envPath, exampleContent);
    console.log('✅ Created .env.local from template');
    console.log('⚠️  Please update .env.local with your actual Supabase credentials\n');
  } else {
    console.log('❌ env.supabase.example not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env.local already exists');
}

// Check required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('\n🔍 Checking environment variables...');
let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`❌ Missing: ${varName}`);
  } else {
    console.log(`✅ Found: ${varName}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️  Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease update your .env.local file with the missing variables.');
  console.log('You can get these from your Supabase project dashboard.');
} else {
  console.log('\n✅ All required environment variables are set!');
}

// Check if Supabase client can be imported
console.log('\n🔧 Checking Supabase client configuration...');
try {
  const { createClient } = require('@supabase/supabase-js');
  console.log('✅ @supabase/supabase-js is installed');
  
  // Try to create client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  console.log('✅ Supabase client created successfully');
  
} catch (error) {
  console.log('❌ Error with Supabase client:', error.message);
  console.log('Please run: npm install @supabase/supabase-js');
}

// Check migration files
console.log('\n📁 Checking migration files...');
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`✅ Found ${migrationFiles.length} migration files:`);
  migrationFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log('❌ Migrations directory not found');
}

// Provide next steps
console.log('\n🎯 Next Steps:');
console.log('1. Update .env.local with your Supabase credentials');
console.log('2. Create your Supabase project at https://supabase.com');
console.log('3. Run migrations: cd supabase && node migrate.js run-all');
console.log('4. Test your connection: node supabase/migrate.js status');
console.log('5. Start your development server: npm run dev');

console.log('\n📚 For detailed instructions, see: SUPABASE_MIGRATION_GUIDE.md');
console.log('🚀 Happy coding with Supabase!');
