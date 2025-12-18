/**
 * Test Enhanced Orchestration Engine
 * 
 * Demonstrates the enhanced agent integration and orchestration system
 * with Trust & Transparency Layer and Agency-Enterprise Bridge
 */

const EnhancedOrchestrationEngine = require('./core/enhanced-orchestration-engine');
const TrustTransparencyLayer = require('./core/trust-transparency-layer');
const AgencyEnterpriseBridge = require('./core/agency-enterprise-bridge');

async function testEnhancedOrchestration() {
  console.log('🚀 Testing Enhanced Orchestration Engine');
  console.log('=' .repeat(60));

  // Initialize components
  const orchestrationEngine = new EnhancedOrchestrationEngine();
  const trustTransparencyLayer = new TrustTransparencyLayer();
  const agencyEnterpriseBridge = new AgencyEnterpriseBridge();

  // Test 1: Agency Tool Submission Workflow
  console.log('\n📋 Test 1: Agency Tool Submission Workflow');
  console.log('-'.repeat(40));
  
  const agencyToolInput = {
    type: 'agency-tool-submission',
    content: {
      toolName: 'AI Content Generator Pro',
      toolDescription: 'Advanced AI-powered content generation tool with compliance features',
      complianceData: {
        dataPrivacy: 'GDPR compliant with data encryption',
        fdaCompliance: 'Medical content review enabled',
        industryStandards: 'Pharmaceutical industry compliant'
      },
      clientContext: {
        clients: ['Pfizer', 'Novartis', 'Johnson & Johnson'],
        industry: 'pharmaceutical',
        riskLevel: 'high'
      }
    },
    userId: 'user_123',
    enterpriseId: 'enterprise_456',
    agencyId: 'agency_789'
  };

  const agencyContext = {
    userId: 'user_123',
    enterpriseId: 'enterprise_456',
    agencyId: 'agency_789',
    userRole: 'agency_admin',
    requestType: 'agency-tool-submission',
    userContext: {
      toolName: 'AI Content Generator Pro',
      clientContext: {
        clients: ['Pfizer', 'Novartis', 'Johnson & Johnson'],
        industry: 'pharmaceutical'
      }
    }
  };

  try {
    const agencyResult = await orchestrationEngine.orchestrateRequest(agencyToolInput, agencyContext);
    console.log('✅ Agency Tool Submission Result:');
    console.log(`- Session ID: ${agencyResult.sessionId}`);
    console.log(`- Workflow Type: ${agencyResult.workflowType}`);
    console.log(`- Processing Time: ${agencyResult.processingTime}ms`);
    console.log(`- Final Status: ${agencyResult.result.finalResult.status}`);
    console.log(`- Requires Human Review: ${agencyResult.result.finalResult.requiresHumanReview}`);
  } catch (error) {
    console.error('❌ Agency Tool Submission Error:', error.message);
  }

  // Test 2: Enterprise Policy Creation Workflow
  console.log('\n📋 Test 2: Enterprise Policy Creation Workflow');
  console.log('-'.repeat(40));
  
  const enterprisePolicyInput = {
    type: 'enterprise-policy-creation',
    content: {
      policyName: 'AI Content Guidelines 2024',
      policyContent: 'Comprehensive guidelines for AI-generated content in pharmaceutical marketing...',
      targetAgencies: ['agency_789', 'agency_101', 'agency_112'],
      complianceRequirements: {
        fda: true,
        gdpr: true,
        industry: 'pharmaceutical',
        medicalAccuracy: true,
        dataPrivacy: true
      }
    },
    userId: 'enterprise_admin_001',
    enterpriseId: 'enterprise_456'
  };

  const enterpriseContext = {
    userId: 'enterprise_admin_001',
    enterpriseId: 'enterprise_456',
    userRole: 'enterprise_admin',
    requestType: 'enterprise-policy-creation',
    userContext: {
      policyName: 'AI Content Guidelines 2024',
      targetAgencies: ['agency_789', 'agency_101', 'agency_112']
    }
  };

  try {
    const enterpriseResult = await orchestrationEngine.orchestrateRequest(enterprisePolicyInput, enterpriseContext);
    console.log('✅ Enterprise Policy Creation Result:');
    console.log(`- Session ID: ${enterpriseResult.sessionId}`);
    console.log(`- Workflow Type: ${enterpriseResult.workflowType}`);
    console.log(`- Processing Time: ${enterpriseResult.processingTime}ms`);
    console.log(`- Final Status: ${enterpriseResult.result.finalResult.status}`);
    console.log(`- Distributed to Agencies: ${enterpriseResult.result.finalResult.distributedToAgencies?.length || 0}`);
  } catch (error) {
    console.error('❌ Enterprise Policy Creation Error:', error.message);
  }

  // Test 3: Multi-Client Conflict Resolution Workflow
  console.log('\n📋 Test 3: Multi-Client Conflict Resolution Workflow');
  console.log('-'.repeat(40));
  
  const conflictResolutionInput = {
    type: 'multi-client-conflict-resolution',
    content: {
      clients: [
        { name: 'Pfizer', industry: 'pharmaceutical', policies: ['policy_1', 'policy_2'] },
        { name: 'Novartis', industry: 'pharmaceutical', policies: ['policy_3', 'policy_4'] },
        { name: 'Johnson & Johnson', industry: 'pharmaceutical', policies: ['policy_5', 'policy_6'] }
      ],
      conflicts: [
        {
          type: 'competitive_intelligence',
          severity: 'high',
          description: 'Risk of sharing competitive information between rival clients',
          affectedClients: ['Pfizer', 'Novartis']
        }
      ],
      resolutionStrategy: 'information_segregation'
    },
    userId: 'conflict_resolver_001',
    enterpriseId: 'enterprise_456'
  };

  const conflictContext = {
    userId: 'conflict_resolver_001',
    enterpriseId: 'enterprise_456',
    userRole: 'enterprise_admin',
    requestType: 'multi-client-conflict-resolution',
    userContext: {
      clients: ['Pfizer', 'Novartis', 'Johnson & Johnson'],
      conflicts: ['competitive_intelligence']
    }
  };

  try {
    const conflictResult = await orchestrationEngine.orchestrateRequest(conflictResolutionInput, conflictContext);
    console.log('✅ Multi-Client Conflict Resolution Result:');
    console.log(`- Session ID: ${conflictResult.sessionId}`);
    console.log(`- Workflow Type: ${conflictResult.workflowType}`);
    console.log(`- Processing Time: ${conflictResult.processingTime}ms`);
    console.log(`- Final Status: ${conflictResult.result.finalResult.status}`);
    console.log(`- Conflicts Resolved: ${conflictResult.result.finalResult.conflictsResolved || 0}`);
    console.log(`- Requires Human Review: ${conflictResult.result.finalResult.requiresHumanReview}`);
  } catch (error) {
    console.error('❌ Multi-Client Conflict Resolution Error:', error.message);
  }

  // Test 4: Transparency Report Generation
  console.log('\n📋 Test 4: Transparency Report Generation');
  console.log('-'.repeat(40));
  
  try {
    // Use the session ID from the first test
    const transparencyReport = await trustTransparencyLayer.generateTransparencyReport('session-123');
    console.log('✅ Transparency Report Generated:');
    console.log(`- Session ID: ${transparencyReport.sessionId}`);
    console.log(`- Total Decisions: ${transparencyReport.summary.totalDecisions}`);
    console.log(`- Human Reviews: ${transparencyReport.summary.humanReviews}`);
    console.log(`- Average Confidence: ${(transparencyReport.summary.averageConfidence * 100).toFixed(1)}%`);
    console.log(`- Average Processing Time: ${transparencyReport.summary.averageProcessingTime}ms`);
    console.log(`- Recommendations: ${transparencyReport.recommendations.length}`);
  } catch (error) {
    console.error('❌ Transparency Report Error:', error.message);
  }

  // Test 5: Agency-Enterprise Bridge Functionality
  console.log('\n📋 Test 5: Agency-Enterprise Bridge Functionality');
  console.log('-'.repeat(40));
  
  try {
    // Test distribution stats
    const distributionStats = await agencyEnterpriseBridge.getDistributionStats('enterprise_456');
    console.log('✅ Distribution Stats:');
    console.log(`- Total Distributions: ${distributionStats.total_distributions || 0}`);
    console.log(`- Active Distributions: ${distributionStats.active_distributions || 0}`);
    console.log(`- Acknowledged Distributions: ${distributionStats.acknowledged_distributions || 0}`);
    console.log(`- Average Compliance Score: ${distributionStats.avg_compliance_score || 0}%`);

    // Test agency compliance report
    const complianceReport = await agencyEnterpriseBridge.getAgencyComplianceReport('agency_789');
    console.log('✅ Agency Compliance Report:');
    console.log(`- Compliance Records: ${complianceReport.length}`);
    if (complianceReport.length > 0) {
      console.log(`- Latest Compliance Score: ${complianceReport[0].compliance_score}%`);
      console.log(`- Latest Assessment: ${complianceReport[0].last_assessment_date}`);
    }
  } catch (error) {
    console.error('❌ Agency-Enterprise Bridge Error:', error.message);
  }

  // Test 6: Workflow Status and Configuration
  console.log('\n📋 Test 6: Workflow Status and Configuration');
  console.log('-'.repeat(40));
  
  try {
    const workflows = orchestrationEngine.workflows;
    console.log('✅ Available Workflows:');
    Object.entries(workflows).forEach(([name, config]) => {
      console.log(`- ${name}:`);
      console.log(`  Description: ${config.description}`);
      console.log(`  Agents: ${config.agents.join(', ')}`);
      console.log(`  SLA: ${config.sla_hours} hours`);
      console.log(`  Auto Distribute: ${config.auto_distribute || false}`);
      console.log(`  Requires Human Review: ${config.requires_human_review || false}`);
    });

    console.log('\n✅ Orchestration Engine Status:');
    console.log(`- Active Workflows: ${orchestrationEngine.activeWorkflows.size}`);
    console.log(`- Enterprise-Agency Relationships: ${orchestrationEngine.enterpriseAgencyRelationships.size}`);
    console.log(`- Trust & Transparency Layer: ${trustTransparencyLayer.activeSessions.size} active sessions`);
    console.log(`- Agency-Enterprise Bridge: ${agencyEnterpriseBridge.activeConnections.size} active connections`);
  } catch (error) {
    console.error('❌ Workflow Status Error:', error.message);
  }

  console.log('\n🎉 Enhanced Orchestration Engine Test Complete!');
  console.log('=' .repeat(60));
}

// Run the test
if (require.main === module) {
  testEnhancedOrchestration().catch(console.error);
}

module.exports = { testEnhancedOrchestration }; 