/**
 * Test script for the Compliance Checking System
 * This script demonstrates how the automated compliance checking works
 */

const SUPABASE_URL = process.env.VITE_API_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const AGENT_INGEST_KEY = process.env.AGENT_INGEST_KEY || 'your-agent-key';

// Test data for different compliance scenarios
const testActivities = [
  {
    agent: 'content-generator-ai',
    action: 'generate_marketing_content',
    status: 'success',
    details: {
      content_type: 'social_media_post',
      ai_generated: true,
      ai_disclosed: false, // This should trigger a violation
      medical_claims: false,
      sensitive_data: false
    }
  },
  {
    agent: 'data-processor-ai',
    action: 'process_patient_data',
    status: 'success',
    details: {
      data_type: 'patient_records',
      sensitive_data: true,
      encrypted: false, // This should trigger a violation
      access_controlled: true,
      retention_period: 365
    }
  },
  {
    agent: 'unapproved-tool',
    action: 'analyze_competitor_data',
    status: 'success',
    details: {
      tool_name: 'unapproved-tool',
      vendor_name: 'Unknown Vendor',
      external_api: true,
      sensitive_data: true
    }
  },
  {
    agent: 'compliant-agent',
    action: 'generate_general_content',
    status: 'success',
    details: {
      content_type: 'general_info',
      ai_generated: true,
      ai_disclosed: true,
      medical_claims: false,
      sensitive_data: false,
      encrypted: true,
      access_controlled: true
    }
  }
];

async function testComplianceSystem() {
  console.log('🧪 Testing Compliance Checking System\n');

  try {
    // Test 1: Insert agent activities and trigger compliance checks
    console.log('1. Testing agent activity insertion with compliance checks...');
    
    for (let i = 0; i < testActivities.length; i++) {
      const activity = testActivities[i];
      console.log(`\n   Testing activity ${i + 1}: ${activity.agent} - ${activity.action}`);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Key': AGENT_INGEST_KEY,
          },
          body: JSON.stringify(activity)
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ Activity inserted successfully: ${result.data.id}`);
          
          // Wait a moment for the compliance check to run
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check for generated alerts
          await checkForAlerts(result.data.id);
        } else {
          console.log(`   ❌ Failed to insert activity: ${result.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Error inserting activity: ${error.message}`);
      }
    }

    // Test 2: Manual compliance check
    console.log('\n2. Testing manual compliance check...');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/compliance_check_agent_activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Key': AGENT_INGEST_KEY,
        },
        body: JSON.stringify({
          activity_id: 'test-activity-id', // This would be a real activity ID
          trigger_type: 'manual',
          force_check: true
        })
      });

      const result = await response.json();
      console.log('   Manual compliance check result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`   ❌ Error running manual compliance check: ${error.message}`);
    }

    // Test 3: Get compliance summary
    console.log('\n3. Testing compliance summary...');
    await getComplianceSummary();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function checkForAlerts(activityId) {
  try {
    // This would query the alerts table to see if any alerts were generated
    // For now, we'll just log that we're checking
    console.log(`   🔍 Checking for alerts related to activity: ${activityId}`);
    
    // In a real implementation, you would query the alerts table:
    // const { data: alerts } = await supabase
    //   .from('alerts')
    //   .select('*')
    //   .eq('entity_id', activityId)
    //   .eq('entity_type', 'agent_activity');
    
    console.log(`   ℹ️  Alert checking would be implemented here`);
  } catch (error) {
    console.log(`   ❌ Error checking alerts: ${error.message}`);
  }
}

async function getComplianceSummary() {
  try {
    // This would call the compliance summary function
    console.log('   📊 Getting compliance summary...');
    
    // In a real implementation, you would call the database function:
    // const { data: summary } = await supabase
    //   .rpc('get_compliance_summary', { org_id: 'your-org-id' });
    
    console.log('   ℹ️  Compliance summary would be implemented here');
  } catch (error) {
    console.log(`   ❌ Error getting compliance summary: ${error.message}`);
  }
}

// Test policy creation
async function testPolicyCreation() {
  console.log('\n4. Testing policy creation...');
  
  const samplePolicy = {
    name: 'AI Content Compliance Policy',
    description: 'Policy for AI-generated content compliance',
    policy_type: 'compliance',
    rules: {
      riskThreshold: 0.7,
      requiredApprovals: ['content_review', 'legal_review'],
      restrictedTerms: ['cure', 'treat', 'heal'],
      stages: ['draft', 'review', 'approval', 'published'],
      approvers: ['content_manager', 'legal_team'],
      complianceRules: {
        fdaGuidelines: true,
        emaGuidelines: false,
        localRegulations: ['US', 'EU']
      }
    },
    enterpriseId: 'your-enterprise-id'
  };
  
  console.log('   📋 Sample policy structure:', JSON.stringify(samplePolicy, null, 2));
  console.log('   ℹ️  Policy creation would be implemented here');
}

// Run the tests
async function runAllTests() {
  console.log('🚀 Starting Compliance System Tests\n');
  console.log('=' .repeat(50));
  
  await testComplianceSystem();
  await testPolicyCreation();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Deploy the compliance_check_agent_activity function');
  console.log('2. Run the database migration to create alerts table');
  console.log('3. Configure the compliance check URL in your database settings');
  console.log('4. Test with real agent activities');
}

// Export for use in other scripts
module.exports = {
  testComplianceSystem,
  testPolicyCreation,
  runAllTests
};

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
