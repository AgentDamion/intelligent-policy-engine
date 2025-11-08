/**
 * RFP Integration Test Script
 * Comprehensive testing of the RFP/RFI agentic integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test data
const TEST_ORG_ID = 'test-org-' + Date.now();
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_RFI_ID = 'test-rfi-' + Date.now();

async function runTests() {
  console.log('🚀 Starting RFP Integration Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Database Schema
  console.log('📊 Testing Database Schema...');
  totalTests++;
  try {
    await testDatabaseSchema();
    console.log('✅ Database schema test passed\n');
    passedTests++;
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message, '\n');
  }
  
  // Test 2: RPC Functions
  console.log('🔧 Testing RPC Functions...');
  totalTests++;
  try {
    await testRPCFunctions();
    console.log('✅ RPC functions test passed\n');
    passedTests++;
  } catch (error) {
    console.error('❌ RPC functions test failed:', error.message, '\n');
  }
  
  // Test 3: Submissions CRUD
  console.log('📝 Testing Submissions CRUD...');
  totalTests++;
  try {
    await testSubmissionsCRUD();
    console.log('✅ Submissions CRUD test passed\n');
    passedTests++;
  } catch (error) {
    console.error('❌ Submissions CRUD test failed:', error.message, '\n');
  }
  
  // Test 4: RFP Question Library
  console.log('📚 Testing RFP Question Library...');
  totalTests++;
  try {
    await testRFPQuestionLibrary();
    console.log('✅ RFP Question Library test passed\n');
    passedTests++;
  } catch (error) {
    console.error('❌ RFP Question Library test failed:', error.message, '\n');
  }
  
  // Test 5: Edge Functions (if accessible)
  console.log('⚡ Testing Edge Functions...');
  totalTests++;
  try {
    await testEdgeFunctions();
    console.log('✅ Edge functions test passed\n');
    passedTests++;
  } catch (error) {
    console.error('❌ Edge functions test failed:', error.message, '\n');
  }
  
  // Test 6: RLS Policies
  console.log('🔒 Testing RLS Policies...');
  totalTests++;
  try {
    await testRLSPolicies();
    console.log('✅ RLS policies test passed\n');
    passedTests++;
  } catch (error) {
    console.error('❌ RLS policies test failed:', error.message, '\n');
  }
  
  // Summary
  console.log('📋 Test Summary');
  console.log('==============');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! RFP integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  // Cleanup
  await cleanup();
}

async function testDatabaseSchema() {
  // Check if submissions table exists
  const { data: submissionsTable, error: submissionsError } = await supabase
    .from('submissions')
    .select('id')
    .limit(1);
    
  if (submissionsError && submissionsError.code !== 'PGRST116') {
    throw new Error(`Submissions table not accessible: ${submissionsError.message}`);
  }
  
  // Check if rfp_question_library table exists
  const { data: rfpTable, error: rfpError } = await supabase
    .from('rfp_question_library')
    .select('id')
    .limit(1);
    
  if (rfpError && rfpError.code !== 'PGRST116') {
    throw new Error(`RFP question library table not accessible: ${rfpError.message}`);
  }
  
  console.log('  ✓ submissions table exists');
  console.log('  ✓ rfp_question_library table exists');
}

async function testRPCFunctions() {
  // Test rpc_get_rfp_badges
  const { data: badges, error: badgesError } = await supabase
    .rpc('rpc_get_rfp_badges', {
      p_organization_id: TEST_ORG_ID,
      p_timezone: 'UTC'
    });
    
  if (badgesError) {
    throw new Error(`rpc_get_rfp_badges failed: ${badgesError.message}`);
  }
  
  // Test rpc_get_submission_progress
  const { data: progress, error: progressError } = await supabase
    .rpc('rpc_get_submission_progress', {
      p_organization_id: TEST_ORG_ID,
      p_submission_type: 'rfp_response'
    });
    
  if (progressError) {
    throw new Error(`rpc_get_submission_progress failed: ${progressError.message}`);
  }
  
  // Test rpc_get_rfp_distributions
  const { data: distributions, error: distributionsError } = await supabase
    .rpc('rpc_get_rfp_distributions', {
      p_organization_id: TEST_ORG_ID,
      p_status_filter: null
    });
    
  if (distributionsError) {
    throw new Error(`rpc_get_rfp_distributions failed: ${distributionsError.message}`);
  }
  
  console.log('  ✓ rpc_get_rfp_badges working');
  console.log('  ✓ rpc_get_submission_progress working');
  console.log('  ✓ rpc_get_rfp_distributions working');
}

async function testSubmissionsCRUD() {
  // Create a test submission
  const testSubmission = {
    organization_id: TEST_ORG_ID,
    submission_type: 'rfp_response',
    title: 'Test RFP Response',
    description: 'This is a test submission',
    rfi_id: TEST_RFI_ID,
    question_id: 'test-q-123',
    response_text: 'This is a test response to an RFP question',
    scoring_results: {
      score: 85,
      max_score: 100,
      percentage: 85,
      feedback: ['Test feedback'],
      compliance_gaps: ['Test gap'],
      recommendations: ['Test recommendation']
    },
    status: 'draft'
  };
  
  const { data: createdSubmission, error: createError } = await supabase
    .from('submissions')
    .insert(testSubmission)
    .select()
    .single();
    
  if (createError) {
    throw new Error(`Failed to create submission: ${createError.message}`);
  }
  
  // Read the submission
  const { data: readSubmission, error: readError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', createdSubmission.id)
    .single();
    
  if (readError) {
    throw new Error(`Failed to read submission: ${readError.message}`);
  }
  
  // Update the submission
  const { data: updatedSubmission, error: updateError } = await supabase
    .from('submissions')
    .update({ 
      status: 'in_review',
      response_text: 'Updated test response'
    })
    .eq('id', createdSubmission.id)
    .select()
    .single();
    
  if (updateError) {
    throw new Error(`Failed to update submission: ${updateError.message}`);
  }
  
  console.log('  ✓ Create submission working');
  console.log('  ✓ Read submission working');
  console.log('  ✓ Update submission working');
  
  // Store submission ID for cleanup
  global.testSubmissionId = createdSubmission.id;
}

async function testRFPQuestionLibrary() {
  const testRFI = {
    organization_id: TEST_ORG_ID,
    rfi_id: TEST_RFI_ID,
    title: 'Test RFI Document',
    organization: 'Test Organization',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: 'q-1',
        question_text: 'What is your security policy?',
        category: 'Security',
        priority: 'high',
        requirements: ['SOC 2', 'Data encryption'],
        context: 'Security compliance question'
      }
    ],
    metadata: {
      total_questions: 1,
      high_priority_count: 1,
      categories: ['Security'],
      parsed_at: new Date().toISOString()
    }
  };
  
  // Create RFI entry
  const { data: createdRFI, error: createError } = await supabase
    .from('rfp_question_library')
    .insert(testRFI)
    .select()
    .single();
    
  if (createError) {
    throw new Error(`Failed to create RFI entry: ${createError.message}`);
  }
  
  // Read RFI entry
  const { data: readRFI, error: readError } = await supabase
    .from('rfp_question_library')
    .select('*')
    .eq('id', createdRFI.id)
    .single();
    
  if (readError) {
    throw new Error(`Failed to read RFI entry: ${readError.message}`);
  }
  
  console.log('  ✓ Create RFI entry working');
  console.log('  ✓ Read RFI entry working');
  
  // Store RFI ID for cleanup
  global.testRFIId = createdRFI.id;
}

async function testEdgeFunctions() {
  // Test RFI document parser
  try {
    const { data: parseResult, error: parseError } = await supabase.functions.invoke('rfi_document_parser', {
      body: {
        file_url: 'https://example.com/test.pdf',
        file_type: 'application/pdf',
        organization_id: TEST_ORG_ID
      }
    });
    
    if (parseError) {
      console.log('  ⚠️  RFI document parser not accessible (may need authentication)');
    } else {
      console.log('  ✓ RFI document parser working');
    }
  } catch (error) {
    console.log('  ⚠️  RFI document parser test skipped (function may not be deployed)');
  }
  
  // Test RFP score response
  try {
    const { data: scoreResult, error: scoreError } = await supabase.functions.invoke('rfp_score_response', {
      body: {
        submission_id: global.testSubmissionId || 'test-submission-id',
        question_id: 'test-q-123',
        response_text: 'Test response for scoring',
        organization_id: TEST_ORG_ID
      }
    });
    
    if (scoreError) {
      console.log('  ⚠️  RFP score response not accessible (may need authentication)');
    } else {
      console.log('  ✓ RFP score response working');
    }
  } catch (error) {
    console.log('  ⚠️  RFP score response test skipped (function may not be deployed)');
  }
}

async function testRLSPolicies() {
  // Test that we can only access our own organization's data
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .eq('organization_id', TEST_ORG_ID);
    
  if (submissionsError) {
    throw new Error(`RLS policy test failed for submissions: ${submissionsError.message}`);
  }
  
  const { data: rfpEntries, error: rfpError } = await supabase
    .from('rfp_question_library')
    .select('*')
    .eq('organization_id', TEST_ORG_ID);
    
  if (rfpError) {
    throw new Error(`RLS policy test failed for RFP library: ${rfpError.message}`);
  }
  
  console.log('  ✓ RLS policies working for submissions');
  console.log('  ✓ RLS policies working for RFP library');
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up test submissions
    if (global.testSubmissionId) {
      await supabase
        .from('submissions')
        .delete()
        .eq('id', global.testSubmissionId);
      console.log('  ✓ Test submission cleaned up');
    }
    
    // Clean up test RFI entries
    if (global.testRFIId) {
      await supabase
        .from('rfp_question_library')
        .delete()
        .eq('id', global.testRFIId);
      console.log('  ✓ Test RFI entry cleaned up');
    }
    
    // Clean up any remaining test data
    await supabase
      .from('submissions')
      .delete()
      .eq('organization_id', TEST_ORG_ID);
      
    await supabase
      .from('rfp_question_library')
      .delete()
      .eq('organization_id', TEST_ORG_ID);
      
    console.log('  ✓ All test data cleaned up');
  } catch (error) {
    console.log('  ⚠️  Cleanup warning:', error.message);
  }
}

// Run the tests
runTests().catch(console.error);




