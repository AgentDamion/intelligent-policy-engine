/**
 * Risk Profile Taxonomy Test Suite
 * 
 * Tests the LLM-based 6-dimensional risk assessment integration
 * with ComplianceScoringAgent, PolicyAgent, and AuditAgent
 */

const ComplianceScoringAgent = require('../agents/compliance-scoring-agent');
const { PolicyAgent } = require('../agents/policy-agent');
const AuditAgent = require('../agents/audit-agent');

// Test configuration
const TEST_CONFIG = {
  enableLLM: process.env.OPENAI_API_KEY ? true : false,
  verbose: true
};

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Test Case 1: Minimal Risk Tool (Grammarly)
 */
async function testMinimalRiskTool() {
  console.log(`\n${colors.cyan}=== TEST 1: Minimal Risk Tool ===${colors.reset}`);
  
  const agent = new ComplianceScoringAgent();
  
  const toolData = {
    id: 'tool-001',
    name: 'Grammarly',
    useCase: 'Internal grammar checking for emails',
    dataTypes: ['text'],
    dataHandling: 'No customer data, temporary processing only',
    deployment: 'cloud',
    userRole: 'general_employee'
  };
  
  const vendorData = {
    id: 'vendor-001',
    name: 'Grammarly Inc'
  };
  
  try {
    const result = await agent.assessCompliance(toolData, vendorData, {});
    
    console.log(`${colors.blue}Expected Tier:${colors.reset} minimal`);
    console.log(`${colors.blue}Actual Tier:${colors.reset} ${result.riskProfile.tier}`);
    console.log(`${colors.blue}Compliance Score:${colors.reset} ${result.overallComplianceScore}`);
    console.log(`${colors.blue}Dimension Scores:${colors.reset}`);
    console.log(`  - Data Sensitivity: ${result.riskProfile.dimensionScores.dataSensitivity}/100`);
    console.log(`  - External Exposure: ${result.riskProfile.dimensionScores.externalExposure}/100`);
    console.log(`  - Model Transparency: ${result.riskProfile.dimensionScores.modelTransparency}/100`);
    console.log(`  - Misuse Vectors: ${result.riskProfile.dimensionScores.misuseVectors}/100`);
    console.log(`  - Legal/IP Risk: ${result.riskProfile.dimensionScores.legalIPRisk}/100`);
    console.log(`  - Operational Criticality: ${result.riskProfile.dimensionScores.operationalCriticality}/100`);
    console.log(`${colors.blue}Audit Checklist:${colors.reset} ${result.riskProfile.auditChecklist.length} items`);
    console.log(`  ${result.riskProfile.auditChecklist.slice(0, 5).join(', ')}...`);
    
    // Assertions
    const isCorrectTier = result.riskProfile.tier === 'minimal' || result.riskProfile.tier === 'low';
    if (isCorrectTier) {
      console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Correctly classified as low-risk tool\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Expected minimal/low tier, got ${result.riskProfile.tier}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ TEST ERROR${colors.reset}: ${error.message}\n`);
    return false;
  }
}

/**
 * Test Case 2: Critical Risk Tool (Medical Diagnosis AI)
 */
async function testCriticalRiskTool() {
  console.log(`\n${colors.cyan}=== TEST 2: Critical Risk Tool ===${colors.reset}`);
  
  const agent = new ComplianceScoringAgent();
  
  const toolData = {
    id: 'tool-002',
    name: 'MedDiagnose AI',
    useCase: 'Automated patient diagnosis recommendations',
    dataTypes: ['PHI', 'medical_imaging', 'patient_records'],
    dataHandling: 'Processes protected health information (PHI) and medical records',
    deployment: 'cloud',
    userRole: 'physician'
  };
  
  const vendorData = {
    id: 'vendor-002',
    name: 'HealthTech AI'
  };
  
  try {
    const result = await agent.assessCompliance(toolData, vendorData, {});
    
    console.log(`${colors.blue}Expected Tier:${colors.reset} critical or high`);
    console.log(`${colors.blue}Actual Tier:${colors.reset} ${result.riskProfile.tier}`);
    console.log(`${colors.blue}Compliance Score:${colors.reset} ${result.overallComplianceScore}`);
    console.log(`${colors.blue}Dimension Scores:${colors.reset}`);
    console.log(`  - Data Sensitivity: ${result.riskProfile.dimensionScores.dataSensitivity}/100`);
    console.log(`  - External Exposure: ${result.riskProfile.dimensionScores.externalExposure}/100`);
    console.log(`  - Model Transparency: ${result.riskProfile.dimensionScores.modelTransparency}/100`);
    console.log(`  - Misuse Vectors: ${result.riskProfile.dimensionScores.misuseVectors}/100`);
    console.log(`  - Legal/IP Risk: ${result.riskProfile.dimensionScores.legalIPRisk}/100`);
    console.log(`  - Operational Criticality: ${result.riskProfile.dimensionScores.operationalCriticality}/100`);
    console.log(`${colors.blue}Audit Checklist:${colors.reset} ${result.riskProfile.auditChecklist.length} items`);
    console.log(`  ${result.riskProfile.auditChecklist.slice(0, 8).join(', ')}...`);
    
    // Assertions
    const isCorrectTier = result.riskProfile.tier === 'critical' || result.riskProfile.tier === 'high';
    const hasExtensiveChecklist = result.riskProfile.auditChecklist.length >= 10;
    
    if (isCorrectTier && hasExtensiveChecklist) {
      console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Correctly classified as high-risk tool with extensive audit requirements\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Expected critical/high tier with 10+ audit items\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ TEST ERROR${colors.reset}: ${error.message}\n`);
    return false;
  }
}

/**
 * Test Case 3: Medium Risk Tool (Marketing Content Generator)
 */
async function testMediumRiskTool() {
  console.log(`\n${colors.cyan}=== TEST 3: Medium Risk Tool ===${colors.reset}`);
  
  const agent = new ComplianceScoringAgent();
  
  const toolData = {
    id: 'tool-003',
    name: 'ContentGen Pro',
    useCase: 'AI-powered marketing content generation for social media',
    dataTypes: ['text', 'marketing_data'],
    dataHandling: 'Processes marketing content, some customer data for personalization',
    deployment: 'cloud',
    userRole: 'marketing_team'
  };
  
  const vendorData = {
    id: 'vendor-003',
    name: 'ContentAI Solutions'
  };
  
  try {
    const result = await agent.assessCompliance(toolData, vendorData, {});
    
    console.log(`${colors.blue}Expected Tier:${colors.reset} medium`);
    console.log(`${colors.blue}Actual Tier:${colors.reset} ${result.riskProfile.tier}`);
    console.log(`${colors.blue}Compliance Score:${colors.reset} ${result.overallComplianceScore}`);
    console.log(`${colors.blue}Dimension Scores:${colors.reset}`);
    console.log(`  - Data Sensitivity: ${result.riskProfile.dimensionScores.dataSensitivity}/100`);
    console.log(`  - External Exposure: ${result.riskProfile.dimensionScores.externalExposure}/100`);
    console.log(`  - Model Transparency: ${result.riskProfile.dimensionScores.modelTransparency}/100`);
    console.log(`  - Misuse Vectors: ${result.riskProfile.dimensionScores.misuseVectors}/100`);
    console.log(`  - Legal/IP Risk: ${result.riskProfile.dimensionScores.legalIPRisk}/100`);
    console.log(`  - Operational Criticality: ${result.riskProfile.dimensionScores.operationalCriticality}/100`);
    console.log(`${colors.blue}Audit Checklist:${colors.reset} ${result.riskProfile.auditChecklist.length} items`);
    console.log(`  ${result.riskProfile.auditChecklist.slice(0, 6).join(', ')}...`);
    
    // Assertions
    const isCorrectTier = result.riskProfile.tier === 'medium' || result.riskProfile.tier === 'low';
    if (isCorrectTier) {
      console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Correctly classified as medium-risk tool\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Expected medium tier, got ${result.riskProfile.tier}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ TEST ERROR${colors.reset}: ${error.message}\n`);
    return false;
  }
}

/**
 * Test Case 4: Policy Agent Integration
 */
async function testPolicyAgentIntegration() {
  console.log(`\n${colors.cyan}=== TEST 4: Policy Agent Integration ===${colors.reset}`);
  
  const complianceAgent = new ComplianceScoringAgent();
  const policyAgent = new PolicyAgent();
  
  const toolData = {
    id: 'tool-004',
    name: 'ChatGPT',
    useCase: 'General AI assistant for internal use',
    dataTypes: ['text', 'documents'],
    dataHandling: 'No PII, internal documents only',
    deployment: 'cloud',
    userRole: 'all_employees'
  };
  
  const vendorData = {
    id: 'vendor-004',
    name: 'OpenAI'
  };
  
  try {
    // Step 1: Get compliance assessment
    const complianceResult = await complianceAgent.assessCompliance(toolData, vendorData, {});
    
    // Step 2: Evaluate policy using tier-specific thresholds
    const policyDecision = await policyAgent.evaluatePolicy({}, complianceResult);
    
    console.log(`${colors.blue}Risk Tier:${colors.reset} ${complianceResult.riskProfile.tier}`);
    console.log(`${colors.blue}Compliance Score:${colors.reset} ${complianceResult.overallComplianceScore}`);
    console.log(`${colors.blue}Policy Decision:${colors.reset} ${policyDecision.decision}`);
    console.log(`${colors.blue}Approval Threshold:${colors.reset} ${policyDecision.approvalThreshold}`);
    console.log(`${colors.blue}Required Controls:${colors.reset} ${policyDecision.requiredControls.join(', ')}`);
    console.log(`${colors.blue}Confidence:${colors.reset} ${(policyDecision.confidence * 100).toFixed(1)}%`);
    console.log(`${colors.blue}Rationale:${colors.reset} ${policyDecision.rationale}`);
    
    // Assertions
    const hasValidDecision = ['APPROVED', 'HUMAN_IN_LOOP', 'REJECTED'].includes(policyDecision.decision);
    const hasControls = policyDecision.requiredControls.length > 0;
    const hasRiskProfile = policyDecision.riskProfile !== undefined;
    
    if (hasValidDecision && hasControls && hasRiskProfile) {
      console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Policy agent correctly using risk tier for decisions\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Policy agent integration incomplete\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ TEST ERROR${colors.reset}: ${error.message}\n`);
    return false;
  }
}

/**
 * Test Case 5: Audit Agent Integration
 */
async function testAuditAgentIntegration() {
  console.log(`\n${colors.cyan}=== TEST 5: Audit Agent Integration ===${colors.reset}`);
  
  const auditAgent = new AuditAgent();
  
  // Simulate a policy decision with risk profile
  const mockDecision = {
    decision: {
      status: 'approved',
      type: 'conditional'
    },
    risk: {
      score: 0.45,
      level: 'medium',
      profile: 'medium',
      dimensionScores: {
        dataSensitivity: 60,
        externalExposure: 55,
        modelTransparency: 50,
        misuseVectors: 45,
        legalIPRisk: 40,
        operationalCriticality: 35
      }
    }
  };
  
  const context = {
    tool: 'TestTool',
    vendor: 'TestVendor'
  };
  
  const complianceResult = {
    complianceScore: 75,
    riskProfile: {
      tier: 'medium',
      dimensionScores: {
        dataSensitivity: 60,
        externalExposure: 55,
        modelTransparency: 50,
        misuseVectors: 45,
        legalIPRisk: 40,
        operationalCriticality: 35
      },
      auditChecklist: ['usage_tracking', 'enhanced_monitoring', 'data_protection_audit']
    }
  };
  
  try {
    // Start audit session
    const sessionId = auditAgent.startAuditSession('Test request', 'test-user');
    
    // Log policy decision with risk profile
    const entryId = auditAgent.logPolicyDecision(mockDecision, context, complianceResult);
    
    // Generate audit checklist
    const checklist = auditAgent.generateAuditChecklist('medium', mockDecision);
    
    console.log(`${colors.blue}Session ID:${colors.reset} ${sessionId}`);
    console.log(`${colors.blue}Entry ID:${colors.reset} ${entryId}`);
    console.log(`${colors.blue}Audit Checklist Items:${colors.reset} ${checklist.length}`);
    console.log(`  ${checklist.slice(0, 8).join(', ')}...`);
    
    // Assertions
    const hasSessionId = sessionId !== undefined;
    const hasEntryId = entryId !== undefined;
    const hasChecklist = checklist.length > 0;
    
    if (hasSessionId && hasEntryId && hasChecklist) {
      console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Audit agent correctly storing and processing risk profiles\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Audit agent integration incomplete\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ TEST ERROR${colors.reset}: ${error.message}\n`);
    return false;
  }
}

/**
 * Test Case 6: Dimension Score Parsing
 */
async function testDimensionScoreParsing() {
  console.log(`\n${colors.cyan}=== TEST 6: Dimension Score Parsing ===${colors.reset}`);
  
  const agent = new ComplianceScoringAgent();
  
  // Test JSON parsing
  const jsonResponse = `{
    "dataSensitivity": 75,
    "externalExposure": 60,
    "modelTransparency": 55,
    "misuseVectors": 50,
    "legalIPRisk": 45,
    "operationalCriticality": 40,
    "rationale": {
      "dataSensitivity": "High due to PII processing"
    }
  }`;
  
  const parsed = agent.parseDimensionScores(jsonResponse);
  
  console.log(`${colors.blue}Parsed Scores:${colors.reset}`);
  console.log(`  - Data Sensitivity: ${parsed.dataSensitivity}`);
  console.log(`  - External Exposure: ${parsed.externalExposure}`);
  console.log(`  - Model Transparency: ${parsed.modelTransparency}`);
  console.log(`  - Misuse Vectors: ${parsed.misuseVectors}`);
  console.log(`  - Legal/IP Risk: ${parsed.legalIPRisk}`);
  console.log(`  - Operational Criticality: ${parsed.operationalCriticality}`);
  
  // Assertions
  const allScoresValid = parsed.dataSensitivity === 75 && 
                         parsed.externalExposure === 60 &&
                         parsed.modelTransparency === 55;
  
  if (allScoresValid) {
    console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Dimension score parsing works correctly\n`);
    return true;
  } else {
    console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Dimension score parsing failed\n`);
    return false;
  }
}

/**
 * Test Case 7: Risk Tier Calculation
 */
async function testRiskTierCalculation() {
  console.log(`\n${colors.cyan}=== TEST 7: Risk Tier Calculation ===${colors.reset}`);
  
  const agent = new ComplianceScoringAgent();
  
  const testCases = [
    {
      scores: { dataSensitivity: 10, externalExposure: 10, modelTransparency: 10, misuseVectors: 10, legalIPRisk: 10, operationalCriticality: 10 },
      expectedTier: 'minimal'
    },
    {
      scores: { dataSensitivity: 30, externalExposure: 30, modelTransparency: 30, misuseVectors: 30, legalIPRisk: 30, operationalCriticality: 30 },
      expectedTier: 'low'
    },
    {
      scores: { dataSensitivity: 50, externalExposure: 50, modelTransparency: 50, misuseVectors: 50, legalIPRisk: 50, operationalCriticality: 50 },
      expectedTier: 'medium'
    },
    {
      scores: { dataSensitivity: 70, externalExposure: 70, modelTransparency: 70, misuseVectors: 70, legalIPRisk: 70, operationalCriticality: 70 },
      expectedTier: 'high'
    },
    {
      scores: { dataSensitivity: 90, externalExposure: 90, modelTransparency: 90, misuseVectors: 90, legalIPRisk: 90, operationalCriticality: 90 },
      expectedTier: 'critical'
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const tier = agent.calculateRiskTier(testCase.scores);
    const passed = tier === testCase.expectedTier;
    
    const status = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${status} Scores ${testCase.scores.dataSensitivity} → Expected: ${testCase.expectedTier}, Got: ${tier}`);
    
    if (!passed) allPassed = false;
  }
  
  if (allPassed) {
    console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Risk tier calculation accurate\n`);
    return true;
  } else {
    console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Some risk tier calculations incorrect\n`);
    return false;
  }
}

/**
 * Test Case 8: Audit Checklist Generation
 */
async function testAuditChecklistGeneration() {
  console.log(`\n${colors.cyan}=== TEST 8: Audit Checklist Generation ===${colors.reset}`);
  
  const agent = new ComplianceScoringAgent();
  
  // Test minimal tier
  const minimalChecklist = agent.generateAuditChecklist('minimal', {
    dataSensitivity: 10,
    externalExposure: 10,
    modelTransparency: 10,
    misuseVectors: 10,
    legalIPRisk: 10,
    operationalCriticality: 10
  });
  
  // Test critical tier with high dimension scores
  const criticalChecklist = agent.generateAuditChecklist('critical', {
    dataSensitivity: 90,
    externalExposure: 85,
    modelTransparency: 80,
    misuseVectors: 75,
    legalIPRisk: 85,
    operationalCriticality: 80
  });
  
  console.log(`${colors.blue}Minimal Tier Checklist:${colors.reset} ${minimalChecklist.length} items`);
  console.log(`  ${minimalChecklist.slice(0, 5).join(', ')}`);
  
  console.log(`${colors.blue}Critical Tier Checklist:${colors.reset} ${criticalChecklist.length} items`);
  console.log(`  ${criticalChecklist.slice(0, 10).join(', ')}...`);
  
  // Assertions
  const minimalIsSmaller = minimalChecklist.length < criticalChecklist.length;
  const criticalHasEnoughItems = criticalChecklist.length >= 15;
  
  if (minimalIsSmaller && criticalHasEnoughItems) {
    console.log(`${colors.green}✓ TEST PASSED${colors.reset}: Audit checklist generation scales with risk\n`);
    return true;
  } else {
    console.log(`${colors.red}✗ TEST FAILED${colors.reset}: Audit checklist generation incorrect\n`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.yellow}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.yellow}║   Risk Profile Taxonomy Integration Test Suite             ║${colors.reset}`);
  console.log(`${colors.yellow}║   Testing LLM-based 6-dimensional risk assessment           ║${colors.reset}`);
  console.log(`${colors.yellow}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  if (!TEST_CONFIG.enableLLM) {
    console.log(`${colors.yellow}\n⚠️  Warning: OPENAI_API_KEY not found. Using fallback scoring.${colors.reset}`);
    console.log(`${colors.yellow}   Set OPENAI_API_KEY environment variable for full LLM testing.${colors.reset}\n`);
  }
  
  const results = [];
  
  // Run all tests
  results.push(await testMinimalRiskTool());
  results.push(await testCriticalRiskTool());
  results.push(await testMediumRiskTool());
  results.push(await testPolicyAgentIntegration());
  results.push(await testAuditAgentIntegration());
  results.push(await testDimensionScoreParsing());
  results.push(await testRiskTierCalculation());
  results.push(await testAuditChecklistGeneration());
  
  // Summary
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  const total = results.length;
  
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Total Tests:  ${total}`);
  console.log(`${colors.green}Passed:       ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${failed}${colors.reset}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✓ ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}Risk Profile Taxonomy integration is working correctly.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}✗ SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.red}Please review the failed tests above.${colors.reset}\n`);
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  testMinimalRiskTool,
  testCriticalRiskTool,
  testMediumRiskTool,
  testPolicyAgentIntegration,
  testAuditAgentIntegration,
  testDimensionScoreParsing,
  testRiskTierCalculation,
  testAuditChecklistGeneration,
  runAllTests
};

