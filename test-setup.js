#!/usr/bin/env node

/**
 * Quick Setup Test
 * Tests if the basic setup is working
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🧪 Testing Basic Setup...\n');

// Test 1: Environment Variables
console.log('1️⃣ Checking Environment Variables...');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let envVarsOk = true;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.log(`❌ Missing: ${envVar}`);
    envVarsOk = false;
  } else {
    console.log(`✅ Found: ${envVar}`);
  }
}

if (!envVarsOk) {
  console.log('\n⚠️  Please set up your environment variables first!');
  console.log('Create a .env file with:');
  console.log('SUPABASE_URL=https://your-project-ref.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Test 2: Supabase Connection
console.log('\n2️⃣ Testing Supabase Connection...');
try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test connection by querying a simple table
  const { data, error } = await supabase
    .from('agent_activities')
    .select('count')
    .limit(1);

  if (error) {
    console.log('❌ Supabase connection failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Supabase connection successful');
  }
} catch (error) {
  console.log('❌ Supabase connection error:', error.message);
  process.exit(1);
}

// Test 3: Check if tables exist
console.log('\n3️⃣ Checking Required Tables...');
try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tables = ['agent_activities', 'ai_agent_decisions', 'invitation_keys'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${table} not accessible:`, error.message);
    } else {
      console.log(`✅ Table ${table} accessible`);
    }
  }
} catch (error) {
  console.log('❌ Table check error:', error.message);
}

console.log('\n🎉 Setup test completed!');
console.log('\nNext steps:');
console.log('1. If all tests passed, run: npm run dev');
console.log('2. If tests failed, check your environment variables');
console.log('3. Visit http://localhost:3001/health to test the server');
