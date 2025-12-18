/**
 * Simple RFP Integration Test
 * Quick validation of core RFP functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function quickTest() {
  console.log('🔍 Quick RFP Integration Test\n');
  
  try {
    // Test 1: Check if tables exist
    console.log('1. Checking database tables...');
    
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('id')
      .limit(1);
    
    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Submissions table error: ${subError.message}`);
    }
    console.log('   ✅ submissions table accessible');
    
    const { data: rfpLib, error: rfpError } = await supabase
      .from('rfp_question_library')
      .select('id')
      .limit(1);
    
    if (rfpError && rfpError.code !== 'PGRST116') {
      throw new Error(`RFP library table error: ${rfpError.message}`);
    }
    console.log('   ✅ rfp_question_library table accessible');
    
    // Test 2: Check RPC functions
    console.log('\n2. Testing RPC functions...');
    
    const { data: badges, error: badgeError } = await supabase
      .rpc('rpc_get_rfp_badges', {
        p_organization_id: 'test-org',
        p_timezone: 'UTC'
      });
    
    if (badgeError) {
      throw new Error(`RPC badges error: ${badgeError.message}`);
    }
    console.log('   ✅ rpc_get_rfp_badges working');
    
    const { data: progress, error: progressError } = await supabase
      .rpc('rpc_get_submission_progress', {
        p_organization_id: 'test-org',
        p_submission_type: 'rfp_response'
      });
    
    if (progressError) {
      throw new Error(`RPC progress error: ${progressError.message}`);
    }
    console.log('   ✅ rpc_get_submission_progress working');
    
    // Test 3: Test basic CRUD
    console.log('\n3. Testing basic CRUD operations...');
    
    const testSubmission = {
      organization_id: 'test-org-' + Date.now(),
      submission_type: 'rfp_response',
      title: 'Quick Test Submission',
      rfi_id: 'test-rfi',
      question_id: 'test-q',
      response_text: 'Test response',
      status: 'draft'
    };
    
    const { data: created, error: createError } = await supabase
      .from('submissions')
      .insert(testSubmission)
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Create error: ${createError.message}`);
    }
    console.log('   ✅ Create submission working');
    
    const { data: read, error: readError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', created.id)
      .single();
    
    if (readError) {
      throw new Error(`Read error: ${readError.message}`);
    }
    console.log('   ✅ Read submission working');
    
    // Cleanup
    await supabase
      .from('submissions')
      .delete()
      .eq('id', created.id);
    console.log('   ✅ Cleanup completed');
    
    console.log('\n🎉 All tests passed! RFP integration is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('   - Applied the database migrations');
    console.log('   - Set SUPABASE_URL and SUPABASE_ANON_KEY');
    console.log('   - Deployed the edge functions (optional)');
  }
}

quickTest();




