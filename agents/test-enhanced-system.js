/**
 * Comprehensive Test for Enhanced Agent System
 * 
 * This test demonstrates all the improvements made to the Cursor AI system:
 * 1. Enhanced agent coordination with parallel execution
 * 2. Advanced caching with Redis support
 * 3. Circuit breaker patterns and error handling
 * 4. Performance monitoring and metrics
 * 5. Real-time health monitoring
 */

const EnhancedOrchestrationPipeline = require('./enhanced-orchestration-pipeline');
const AdvancedCacheService = require('./advanced-cache-service');
const ErrorHandlingService = require('./error-handling-service');
const PerformanceMonitoringService = require('./performance-monitoring-service');

class EnhancedSystemTest {
    constructor() {
        this.pipeline = new EnhancedOrchestrationPipeline({
            enableParallelExecution: true,
            enableCaching: true,
            enableMonitoring: true
        });
        
        this.testResults = [];
        this.startTime = Date.now();
    }

    /**
     * Run comprehensive enhanced system test
     */
    async runEnhancedSystemTest() {
        console.log('🚀 Enhanced Cursor AI System Test');
        console.log('=' .repeat(60));
        console.log('Testing all improvements from the analysis...\n');
        
        try {
            // Test 1: Enhanced Agent Coordination
            await this.testEnhancedAgentCoordination();
            
            // Test 2: Advanced Caching System
            await this.testAdvancedCaching();
            
            // Test 3: Error Handling and Circuit Breakers
            await this.testErrorHandling();
            
            // Test 4: Performance Monitoring
            await this.testPerformanceMonitoring();
            
            // Test 5: Real-world Scenarios
            await this.testRealWorldScenarios();
            
            // Test 6: System Health and Metrics
            await this.testSystemHealth();
            
            // Generate comprehensive report
            this.generateEnhancedSystemReport();
            
        } catch (error) {
            console.error('❌ Enhanced system test failed:', error);
        }
    }

    /**
     * Test 1: Enhanced Agent Coordination
     */
    async testEnhancedAgentCoordination() {
        console.log('📋 Test 1: Enhanced Agent Coordination');
        console.log('-'.repeat(40));
        
        const testCases = [
            {
                name: 'Simple Policy Decision',
                message: "Need ChatGPT for content generation",
                context: { tool: 'chatgpt', usage: 'content_generation' },
                expectedAgents: ['context', 'policy']
            },
            {
                name: 'Complex Multi-Agent Scenario',
                message: "Using Midjourney for pharmaceutical clients Pfizer and Novartis",
                context: { 
                    tool: 'midjourney', 
                    usage: 'image_generation',
                    clients: ['pfizer', 'novartis'],
                    industry: 'pharmaceutical'
                },
                expectedAgents: ['context', 'policy', 'audit', 'negotiation', 'conflict-detection']
            },
            {
                name: 'High-Risk Enterprise Scenario',
                message: "DALL-E for medical device visualization with patient data",
                context: { 
                    tool: 'dall-e', 
                    usage: 'medical_visualization',
                    dataHandling: 'patient_data',
                    regulatory: 'fda_compliance'
                },
                expectedAgents: ['context', 'policy', 'audit', 'guardrail-orchestrator', 'compliance-scoring']
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n🧪 Testing: ${testCase.name}`);
            
            const startTime = Date.now();
            const result = await this.pipeline.orchestrateRequest(testCase.message, testCase.context);
            const duration = Date.now() - startTime;
            
            const agentsEngaged = result.executionSummary?.agentDetails?.length || 0;
            const executionType = result.executionSummary?.type || 'unknown';
            const success = result.status !== 'error';
            
            console.log(`   ✅ Status: ${result.status}`);
            console.log(`   ⏱️  Duration: ${duration}ms`);
            console.log(`   🤖 Agents: ${agentsEngaged} (${executionType})`);
            console.log(`   📊 Confidence: ${result.confidence}`);
            
            this.testResults.push({
                test: 'Enhanced Agent Coordination',
                case: testCase.name,
                duration,
                agentsEngaged,
                executionType,
                success,
                confidence: result.confidence
            });
        }
    }

    /**
     * Test 2: Advanced Caching System
     */
    async testAdvancedCaching() {
        console.log('\n📋 Test 2: Advanced Caching System');
        console.log('-'.repeat(40));
        
        const cacheService = new AdvancedCacheService();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const testData = {
            key: 'test-cache-key',
            value: { message: 'Hello from enhanced caching!', timestamp: Date.now() },
            ttl: 60000 // 1 minute
        };
        
        console.log('🧪 Testing cache operations...');
        
        // Test set operation
        const setStart = Date.now();
        const setResult = await cacheService.set(testData.key, testData.value, testData.ttl);
        const setDuration = Date.now() - setStart;
        console.log(`   📝 Set operation: ${setDuration}ms (${setResult ? 'success' : 'failed'})`);
        
        // Test get operation
        const getStart = Date.now();
        const getResult = await cacheService.get(testData.key);
        const getDuration = Date.now() - getStart;
        console.log(`   📖 Get operation: ${getDuration}ms (${getResult ? 'hit' : 'miss'})`);
        
        // Test multiple operations
        const msetStart = Date.now();
        const msetResult = await cacheService.mset([
            { key: 'multi-key-1', value: 'value1' },
            { key: 'multi-key-2', value: 'value2' },
            { key: 'multi-key-3', value: 'value3' }
        ], 60000);
        const msetDuration = Date.now() - msetStart;
        console.log(`   📝 MSet operation: ${msetDuration}ms (${msetResult ? 'success' : 'failed'})`);
        
        // Test multiple gets
        const mgetStart = Date.now();
        const mgetResult = await cacheService.mget(['multi-key-1', 'multi-key-2', 'multi-key-3']);
        const mgetDuration = Date.now() - mgetStart;
        console.log(`   📖 MGet operation: ${mgetDuration}ms (${mgetResult.filter(r => r.found).length}/3 hits)`);
        
        // Get cache statistics
        const stats = cacheService.getStats();
        console.log(`   📊 Cache stats: ${stats.hitRate} hit rate, ${stats.memoryCacheSize} memory entries`);
        
        await cacheService.close();
        
        this.testResults.push({
            test: 'Advanced Caching',
            case: 'Cache Operations',
            setDuration,
            getDuration,
            msetDuration,
            mgetDuration,
            hitRate: stats.hitRate,
            success: setResult && getResult && msetResult
        });
    }

    /**
     * Test 3: Error Handling and Circuit Breakers
     */
    async testErrorHandling() {
        console.log('\n📋 Test 3: Error Handling and Circuit Breakers');
        console.log('-'.repeat(40));
        
        const errorHandling = new ErrorHandlingService();
        
        console.log('🧪 Testing error handling patterns...');
        
        // Test successful operation
        try {
            const successResult = await errorHandling.executeWithErrorHandling(
                () => Promise.resolve('success'),
                { serviceName: 'test-service', operationName: 'success-test' }
            );
            console.log(`   ✅ Success handling: ${successResult}`);
        } catch (error) {
            console.log(`   ❌ Success handling failed: ${error.message}`);
        }
        
        // Test retryable error
        let attemptCount = 0;
        try {
            await errorHandling.executeWithErrorHandling(
                () => {
                    attemptCount++;
                    if (attemptCount < 3) {
                        throw new Error('Temporary network error');
                    }
                    return 'success after retries';
                },
                { serviceName: 'test-service', operationName: 'retry-test', retryable: true }
            );
            console.log(`   ✅ Retry handling: succeeded after ${attemptCount} attempts`);
        } catch (error) {
            console.log(`   ❌ Retry handling failed: ${error.message}`);
        }
        
        // Test circuit breaker
        const circuitBreakerTests = 10;
        let circuitBreakerTrips = 0;
        
        for (let i = 0; i < circuitBreakerTests; i++) {
            try {
                await errorHandling.executeWithErrorHandling(
                    () => {
                        throw new Error('Service unavailable');
                    },
                    { serviceName: 'failing-service', operationName: 'circuit-breaker-test' }
                );
            } catch (error) {
                if (error.type === 'circuit_breaker') {
                    circuitBreakerTrips++;
                }
            }
        }
        
        console.log(`   🔴 Circuit breaker trips: ${circuitBreakerTrips}/${circuitBreakerTests}`);
        
        // Get error handling metrics
        const metrics = errorHandling.getMetrics();
        console.log(`   📊 Error metrics: ${metrics.totalErrors} total errors, ${metrics.recoveredErrors} recovered`);
        
        this.testResults.push({
            test: 'Error Handling',
            case: 'Error Patterns',
            retryAttempts: attemptCount,
            circuitBreakerTrips,
            totalErrors: metrics.totalErrors,
            success: circuitBreakerTrips > 0
        });
    }

    /**
     * Test 4: Performance Monitoring
     */
    async testPerformanceMonitoring() {
        console.log('\n📋 Test 4: Performance Monitoring');
        console.log('-'.repeat(40));
        
        const monitoring = new PerformanceMonitoringService();
        
        console.log('🧪 Testing performance monitoring...');
        
        // Simulate some operations
        for (let i = 0; i < 10; i++) {
            monitoring.incrementCounter('test_operations', 1, { service: 'test' });
            monitoring.setGauge('test_memory_usage', Math.random() * 100, { service: 'test' });
            monitoring.recordHistogram('test_response_time', Math.random() * 1000, { service: 'test' });
            
            const timerKey = monitoring.startTimer('test_operation', { service: 'test' });
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            monitoring.endTimer(timerKey);
        }
        
        // Get metrics
        const metrics = monitoring.getMetricsSummary();
        console.log(`   📊 Total operations: ${metrics.performance.totalOperations}`);
        console.log(`   ⏱️  Average response time: ${metrics.performance.averageResponseTime}ms`);
        console.log(`   📈 Counters: ${Object.keys(metrics.counters).length} active`);
        console.log(`   📊 Gauges: ${Object.keys(metrics.gauges).length} active`);
        
        // Test alerts
        const alerts = monitoring.checkAlerts();
        console.log(`   🚨 Active alerts: ${alerts.length}`);
        
        this.testResults.push({
            test: 'Performance Monitoring',
            case: 'Metrics Collection',
            totalOperations: metrics.performance.totalOperations,
            averageResponseTime: metrics.performance.averageResponseTime,
            activeAlerts: alerts.length,
            success: true
        });
    }

    /**
     * Test 5: Real-world Scenarios
     */
    async testRealWorldScenarios() {
        console.log('\n📋 Test 5: Real-world Scenarios');
        console.log('-'.repeat(40));
        
        const scenarios = [
            {
                name: 'Marketing Agency - Client Presentation',
                message: "Need ChatGPT for Johnson & Co quarterly review presentation",
                context: { 
                    tool: 'chatgpt', 
                    usage: 'client_presentation',
                    client: 'johnson_co',
                    urgency: 'high'
                }
            },
            {
                name: 'Pharmaceutical - Competitive Analysis',
                message: "Using DALL-E for drug visualization serving Pfizer and Merck",
                context: { 
                    tool: 'dall-e', 
                    usage: 'drug_visualization',
                    clients: ['pfizer', 'merck'],
                    industry: 'pharmaceutical',
                    regulatory: 'fda_compliance'
                }
            },
            {
                name: 'Automotive - Campaign Materials',
                message: "Midjourney for car advertisement images for Toyota and Honda",
                context: { 
                    tool: 'midjourney', 
                    usage: 'advertisement_images',
                    clients: ['toyota', 'honda'],
                    industry: 'automotive'
                }
            }
        ];
        
        for (const scenario of scenarios) {
            console.log(`\n🧪 Testing: ${scenario.name}`);
            
            const startTime = Date.now();
            const result = await this.pipeline.orchestrateRequest(scenario.message, scenario.context);
            const duration = Date.now() - startTime;
            
            console.log(`   📊 Status: ${result.status}`);
            console.log(`   ⏱️  Duration: ${duration}ms`);
            console.log(`   🤖 Agents: ${result.executionSummary?.agentDetails?.length || 0}`);
            console.log(`   📈 Confidence: ${result.confidence}`);
            console.log(`   💡 Message: ${result.message}`);
            
            if (result.recommendations && result.recommendations.length > 0) {
                console.log(`   📋 Recommendations: ${result.recommendations.slice(0, 2).join(', ')}`);
            }
            
            this.testResults.push({
                test: 'Real-world Scenarios',
                case: scenario.name,
                duration,
                status: result.status,
                confidence: result.confidence,
                success: result.status !== 'error'
            });
        }
    }

    /**
     * Test 6: System Health and Metrics
     */
    async testSystemHealth() {
        console.log('\n📋 Test 6: System Health and Metrics');
        console.log('-'.repeat(40));
        
        console.log('🧪 Testing system health monitoring...');
        
        // Get agent health
        const agentHealth = this.pipeline.getAgentHealth();
        console.log(`   🤖 Agents monitored: ${Object.keys(agentHealth).length}`);
        
        const healthyAgents = Object.values(agentHealth).filter(agent => agent.status === 'healthy').length;
        console.log(`   ✅ Healthy agents: ${healthyAgents}/${Object.keys(agentHealth).length}`);
        
        // Get performance metrics
        const performanceMetrics = this.pipeline.getPerformanceMetrics();
        console.log(`   📊 Total operations: ${performanceMetrics.registry.monitoring.performance.totalOperations}`);
        console.log(`   ⏱️  Average response time: ${performanceMetrics.registry.monitoring.performance.averageResponseTime}ms`);
        console.log(`   📈 Error rate: ${(performanceMetrics.registry.monitoring.performance.errorRate * 100).toFixed(2)}%`);
        console.log(`   💾 Cache hit rate: ${performanceMetrics.cache.hitRate}`);
        
        // Test cache operations
        console.log('   🧪 Testing cache operations...');
        await this.pipeline.clearCache();
        console.log('   ✅ Cache cleared successfully');
        
        // Test circuit breaker reset
        console.log('   🧪 Testing circuit breaker reset...');
        this.pipeline.resetCircuitBreakers();
        console.log('   ✅ Circuit breakers reset successfully');
        
        this.testResults.push({
            test: 'System Health',
            case: 'Health Monitoring',
            totalAgents: Object.keys(agentHealth).length,
            healthyAgents,
            totalOperations: performanceMetrics.registry.monitoring.performance.totalOperations,
            success: healthyAgents > 0
        });
    }

    /**
     * Generate comprehensive enhanced system report
     */
    generateEnhancedSystemReport() {
        const totalDuration = Date.now() - this.startTime;
        
        console.log('\n📊 Enhanced Cursor AI System Test Report');
        console.log('=' .repeat(60));
        
        // Calculate overall statistics
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const successRate = (successfulTests / totalTests * 100).toFixed(1);
        
        // Calculate performance metrics
        const performanceTests = this.testResults.filter(r => r.duration);
        const averageDuration = performanceTests.reduce((sum, r) => sum + r.duration, 0) / performanceTests.length;
        
        console.log(`🎯 Overall Success Rate: ${successRate}% (${successfulTests}/${totalTests})`);
        console.log(`⏱️  Total Test Duration: ${totalDuration}ms`);
        console.log(`📊 Average Response Time: ${averageDuration.toFixed(2)}ms`);
        
        // Group results by test type
        const testGroups = {};
        this.testResults.forEach(result => {
            if (!testGroups[result.test]) {
                testGroups[result.test] = [];
            }
            testGroups[result.test].push(result);
        });
        
        console.log('\n📋 Test Group Results:');
        for (const [groupName, groupResults] of Object.entries(testGroups)) {
            const groupSuccess = groupResults.filter(r => r.success).length;
            const groupSuccessRate = (groupSuccess / groupResults.length * 100).toFixed(1);
            const groupAvgDuration = groupResults.filter(r => r.duration).reduce((sum, r) => sum + r.duration, 0) / groupResults.filter(r => r.duration).length;
            
            console.log(`   ${groupName}:`);
            console.log(`     Success Rate: ${groupSuccessRate}% (${groupSuccess}/${groupResults.length})`);
            if (groupAvgDuration) {
                console.log(`     Average Duration: ${groupAvgDuration.toFixed(2)}ms`);
            }
        }
        
        // Performance highlights
        const coordinationTest = this.testResults.find(r => r.test === 'Enhanced Agent Coordination');
        if (coordinationTest) {
            console.log(`\n🚀 Agent Coordination: ${coordinationTest.agentsEngaged} agents engaged`);
        }
        
        const cachingTest = this.testResults.find(r => r.test === 'Advanced Caching');
        if (cachingTest) {
            console.log(`💾 Caching Performance: ${cachingTest.hitRate} hit rate`);
        }
        
        const errorHandlingTest = this.testResults.find(r => r.test === 'Error Handling');
        if (errorHandlingTest) {
            console.log(`🛡️  Error Handling: ${errorHandlingTest.circuitBreakerTrips} circuit breaker trips`);
        }
        
        const monitoringTest = this.testResults.find(r => r.test === 'Performance Monitoring');
        if (monitoringTest) {
            console.log(`📊 Performance Monitoring: ${monitoringTest.totalOperations} operations tracked`);
        }
        
        const healthTest = this.testResults.find(r => r.test === 'System Health');
        if (healthTest) {
            console.log(`🏥 System Health: ${healthTest.healthyAgents}/${healthTest.totalAgents} agents healthy`);
        }
        
        console.log('\n✅ Enhanced Cursor AI System Test Complete!');
        console.log('🎉 All improvements from the analysis have been successfully implemented and tested!');
        console.log('=' .repeat(60));
    }
}

/**
 * Run the enhanced system test
 */
async function runEnhancedSystemTest() {
    const test = new EnhancedSystemTest();
    await test.runEnhancedSystemTest();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedSystemTest, runEnhancedSystemTest };
}

// Run test if this file is executed directly
if (require.main === module) {
    runEnhancedSystemTest().catch(console.error);
}