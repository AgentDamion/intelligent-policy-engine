import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthFunctions() {
  console.log('🧪 Testing Alternative Supabase Auth Functions...\n');
  
  try {
    // Test 1: Create a test user
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@aicomplyr.io`;
    
    console.log('1️⃣ Creating test user...');
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });
    
    if (createError) throw createError;
    console.log('✅ User created:', authUser.user.email);
    
    // Test 2: Set enterprise context using ALTERNATIVE function
    console.log('\n2️⃣ Testing set_user_enterprise_context_alt...');
    const { data: context, error: contextError } = await supabase.rpc(
      'set_user_enterprise_context_alt',
      {
        p_user_id: authUser.user.id,
        p_enterprise_id: '10000000-0000-0000-0000-000000000001',
        p_role: 'admin'
      }
    );
    
    if (contextError) throw contextError;
    console.log('✅ Context set:', context);
    
    // Test 3: Get user context using ALTERNATIVE function
    console.log('\n3️⃣ Testing get_user_context_alt...');
    const { data: userContext, error: getError } = await supabase.rpc(
      'get_user_context_alt',
      { p_user_id: authUser.user.id }
    );
    
    if (getError) throw getError;
    console.log('✅ User context retrieved:', userContext);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(authUser.user.id);
    console.log('✅ Test user deleted');
    
    console.log('\n🎉 All alternative auth function tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAuthFunctions();
