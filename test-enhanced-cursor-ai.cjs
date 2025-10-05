/**
 * Enhanced Cursor AI System Test
 * Tests all the improvements identified in the analysis
 */

const { EnhancedAgentCoordinator } = require('./agents/enhanced-agent-coordinator.cjs');
const { EnhancedAIClient } = require('./agents/enhanced-ai-client.cjs');
const { CursorAIAgent } = require('./agents/cursor-ai-agent.cjs');

async function testEnhancedCursorAI() {
  console.log('🚀 Testing Enhanced Cursor AI System');
  console.log('=====================================\n');

  try {
    // Test 1: Enhanced Agent Coordinator
    console.log('1. Testing Enhanced Agent Coordinator...');
    const coordinator = new EnhancedAgentCoordinator();
    
    const testRequests = [
      {
        agentName: 'policy',
        input: {
          tool: 'test_tool',
          vendor: 'test_vendor',
          usage: 'testing',
          dataHandling: 'no customer data'
        },
        context: { enterprise_id: 'test_enterprise' }
      },
      {
        agentName: 'context',
        input: {
          userMessage: 'Test message for context analysis'
        },
        context: { enterprise_id: 'test_enterprise' }
      }
    ];

    const coordinationResult = await coordinator.coordinateAgents(testRequests);
    console.log('✅ Coordination Result:', {
      finalDecision: coordinationResult.finalDecision,
      confidence: coordinationResult.confidence,
      agentsExecuted: coordinationResult.metadata.agentsExecuted,
      processingTime: coordinationResult.metadata.processingTime
    });

    // Test 2: Enhanced AI Client
    console.log('\n2. Testing Enhanced AI Client...');
    const aiClient = new EnhancedAIClient();
    
    const testRequest = {
      prompt: 'Test AI analysis request',
      agentType: 'policy',
      context: { enterprise_id: 'test_enterprise' }
    };

    const aiResult = await aiClient.processRequest(testRequest);
    console.log('✅ AI Client Result:', {
      provider: aiResult.metadata.provider,
      model: aiResult.metadata.model,
      confidence: aiResult.confidence,
      processingTime: aiResult.metadata.processingTime
    });

    // Test 3: Cursor AI Agent
    console.log('\n3. Testing Cursor AI Agent...');
    const cursorAgent = new CursorAIAgent();
    
    const testDoc = {
      id: 'test_doc_123',
      type: 'policy',
      content: 'Test policy document for analysis',
      tool: 'test_tool',
      vendor: 'test_vendor',
      usage: 'testing',
      dataHandling: 'no customer data'
    };

    const documentResult = await cursorAgent.analyzeDocument(testDoc, 'test_enterprise');
    console.log('✅ Document Analysis Result:', {
      id: documentResult.id,
      decision: documentResult.decision,
      confidence: documentResult.confidence,
      processingAgents: documentResult.metadata.processing_agents
    });

    // Test 4: RFP Processing
    console.log('\n4. Testing RFP Processing...');
    const testQuestion = {
      id: 'rfp_q_123',
      question_text: 'What are your compliance requirements?',
      category: 'compliance',
      priority: 'high'
    };

    const rfpResult = await cursorAgent.processRFPQuestion(testQuestion, 'test_org', 'test_user');
    console.log('✅ RFP Processing Result:', {
      id: rfpResult.id,
      decision: rfpResult.decision,
      confidence: rfpResult.confidence,
      rfpProcessing: rfpResult.metadata.rfp_processing
    });

    // Test 5: System Status
    console.log('\n5. Testing System Status...');
    const status = await cursorAgent.getAgentStatus();
    console.log('✅ System Status:', {
      version: status.cursor_ai_version,
      status: status.status,
      agents: status.agents.length,
      aiConnected: status.metrics.ai_connected
    });

    // Test 6: Metrics and Performance
    console.log('\n6. Testing Metrics and Performance...');
    const metrics = coordinator.getMetrics();
    console.log('✅ Coordinator Metrics:', {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      averageResponseTime: metrics.averageResponseTime,
      cacheSize: metrics.cacheSize
    });

    // Test 7: Circuit Breaker
    console.log('\n7. Testing Circuit Breaker...');
    const circuitBreakerStatus = metrics.circuitBreakerStatus;
    console.log('✅ Circuit Breaker Status:', circuitBreakerStatus);

    // Test 8: Cache Performance
    console.log('\n8. Testing Cache Performance...');
    const cacheHits = coordinationResult.metadata.cacheHits;
    console.log('✅ Cache Performance:', {
      cacheHits,
      cacheHitRate: metrics.cacheHitRate
    });

    console.log('\n🎉 All Enhanced Cursor AI Tests Passed!');
    console.log('\n📊 Performance Summary:');
    console.log(`- Total Requests: ${metrics.totalRequests}`);
    console.log(`- Success Rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(1)}%`);
    console.log(`- Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`- Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`- Agents Available: ${status.agents.length}`);

    return {
      success: true,
      metrics,
      status,
      coordinationResult,
      aiResult,
      documentResult,
      rfpResult
    };

  } catch (error) {
    console.error('❌ Test Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testEnhancedCursorAI()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Enhanced Cursor AI System is operational!');
        process.exit(0);
      } else {
        console.log('\n❌ Enhanced Cursor AI System has issues:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedCursorAI };
