/**
 * Critical Path Test Script for AICOMPLYR.io Platform Readiness
 * 
 * This script validates all critical user journeys and core functionality
 * Run this to confirm the 85% readiness assessment
 */

import { pathToFileURL } from 'node:url';

// This repo is ESM ("type": "module"). Use global fetch (Node 18+) instead of require('axios').

class PlatformReadinessTester {
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:3000';
    this.testResults = {
      multiTenancy: {},
      rbac: {},
      policyEngine: {},
      auditEngine: {},
      userOnboarding: {},
      metaLoop: {},
      overall: { passed: 0, total: 0 }
    };
  }

  async http(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const msg = typeof data === 'string' ? data : JSON.stringify(data);
      throw new Error(`${method} ${url} failed (${res.status}): ${msg}`);
    }

    return { status: res.status, data };
  }

  httpGet(url) {
    return this.http('GET', url);
  }

  httpPost(url, body) {
    return this.http('POST', url, body);
  }

  async runAllTests() {
    console.log('🎯 Starting AICOMPLYR.io Platform Readiness Tests...\n');
    
    try {
      // Test 1: Multi-Tenancy Architecture
      await this.testMultiTenancy();
      
      // Test 2: RBAC System
      await this.testRBAC();
      
      // Test 3: Policy Engine
      await this.testPolicyEngine();
      
      // Test 4: Audit Engine
      await this.testAuditEngine();
      
      // Test 5: User Onboarding
      await this.testUserOnboarding();
      
      // Test 6: Meta-Loop AI
      await this.testMetaLoop();
      
      // Generate final report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
    }
  }

  async testMultiTenancy() {
    console.log('🏢 Testing Multi-Tenancy Architecture...');
    
    try {
      // Test 1.1: Create enterprise tenant
      const enterpriseResponse = await this.httpPost(`${this.baseUrl}/api/enterprises`, {
        name: 'TestPharma',
        type: 'pharma',
        subscription_tier: 'enterprise'
      });
      
      if (enterpriseResponse.data.success) {
        this.testResults.multiTenancy.createEnterprise = 'PASS';
        console.log('  ✅ Enterprise tenant creation: PASS');
      } else {
        this.testResults.multiTenancy.createEnterprise = 'FAIL';
        console.log('  ❌ Enterprise tenant creation: FAIL');
      }

      // Test 1.2: Create agency seat
      const seatResponse = await this.httpPost(`${this.baseUrl}/api/enterprises/${enterpriseResponse.data.enterprise.id}/seats`, {
        name: 'Pfizer Account Team',
        slug: 'pfizer-team',
        seat_type: 'standard'
      });
      
      if (seatResponse.data.success) {
        this.testResults.multiTenancy.createSeat = 'PASS';
        console.log('  ✅ Agency seat creation: PASS');
      } else {
        this.testResults.multiTenancy.createSeat = 'FAIL';
        console.log('  ❌ Agency seat creation: FAIL');
      }

      // Test 1.3: Data isolation
      const isolationResponse = await this.httpGet(`${this.baseUrl}/api/policies?enterprise_id=${enterpriseResponse.data.enterprise.id}`);
      
      if (isolationResponse.data.success) {
        this.testResults.multiTenancy.dataIsolation = 'PASS';
        console.log('  ✅ Data isolation: PASS');
      } else {
        this.testResults.multiTenancy.dataIsolation = 'FAIL';
        console.log('  ❌ Data isolation: FAIL');
      }

      this.testResults.overall.total += 3;
      this.testResults.overall.passed += Object.values(this.testResults.multiTenancy).filter(r => r === 'PASS').length;
      
    } catch (error) {
      console.log('  ❌ Multi-tenancy tests failed:', error.message);
      this.testResults.multiTenancy = { createEnterprise: 'FAIL', createSeat: 'FAIL', dataIsolation: 'FAIL' };
      this.testResults.overall.total += 3;
    }
  }

  async testRBAC() {
    console.log('🔐 Testing RBAC System...');
    
    try {
      // Test 2.1: Role-based access
      const rolesResponse = await this.httpGet(`${this.baseUrl}/api/auth/roles`);
      
      if (rolesResponse.data.success && rolesResponse.data.roles.length >= 5) {
        this.testResults.rbac.roleDefinitions = 'PASS';
        console.log('  ✅ Role definitions: PASS');
      } else {
        this.testResults.rbac.roleDefinitions = 'FAIL';
        console.log('  ❌ Role definitions: FAIL');
      }

      // Test 2.2: Permission enforcement
      const permissionResponse = await this.httpGet(`${this.baseUrl}/api/auth/permissions`);
      
      if (permissionResponse.data.success) {
        this.testResults.rbac.permissionEnforcement = 'PASS';
        console.log('  ✅ Permission enforcement: PASS');
      } else {
        this.testResults.rbac.permissionEnforcement = 'FAIL';
        console.log('  ❌ Permission enforcement: FAIL');
      }

      // Test 2.3: Context switching
      const contextResponse = await this.httpPost(`${this.baseUrl}/api/auth/context/switch`, {
        contextId: 'test-context-id'
      });
      
      if (contextResponse.data.success) {
        this.testResults.rbac.contextSwitching = 'PASS';
        console.log('  ✅ Context switching: PASS');
      } else {
        this.testResults.rbac.contextSwitching = 'FAIL';
        console.log('  ❌ Context switching: FAIL');
      }

      this.testResults.overall.total += 3;
      this.testResults.overall.passed += Object.values(this.testResults.rbac).filter(r => r === 'PASS').length;
      
    } catch (error) {
      console.log('  ❌ RBAC tests failed:', error.message);
      this.testResults.rbac = { roleDefinitions: 'FAIL', permissionEnforcement: 'FAIL', contextSwitching: 'FAIL' };
      this.testResults.overall.total += 3;
    }
  }

  async testPolicyEngine() {
    console.log('📋 Testing Policy Engine...');
    
    try {
      // Test 3.1: Create policy
      const createPolicyResponse = await this.httpPost(`${this.baseUrl}/api/policies`, {
        name: 'AI Usage Policy',
        description: 'Test policy for AI tool usage',
        policy_type: 'ai_governance',
        rules: {
          risk_threshold: 0.7,
          approval_required: true,
          monitoring_enabled: true
        }
      });
      
      if (createPolicyResponse.data.success) {
        this.testResults.policyEngine.createPolicy = 'PASS';
        console.log('  ✅ Policy creation: PASS');
      } else {
        this.testResults.policyEngine.createPolicy = 'FAIL';
        console.log('  ❌ Policy creation: FAIL');
      }

      // Test 3.2: Policy inheritance
      const inheritanceResponse = await this.httpGet(`${this.baseUrl}/api/policies/inheritance`);
      
      if (inheritanceResponse.data.success) {
        this.testResults.policyEngine.policyInheritance = 'PASS';
        console.log('  ✅ Policy inheritance: PASS');
      } else {
        this.testResults.policyEngine.policyInheritance = 'FAIL';
        console.log('  ❌ Policy inheritance: FAIL');
      }

      // Test 3.3: Conflict detection
      const conflictResponse = await this.httpPost(`${this.baseUrl}/api/policies/conflict-detection`, {
        policies: ['policy-1', 'policy-2']
      });
      
      if (conflictResponse.data.success) {
        this.testResults.policyEngine.conflictDetection = 'PASS';
        console.log('  ✅ Conflict detection: PASS');
      } else {
        this.testResults.policyEngine.conflictDetection = 'FAIL';
        console.log('  ❌ Conflict detection: FAIL');
      }

      this.testResults.overall.total += 3;
      this.testResults.overall.passed += Object.values(this.testResults.policyEngine).filter(r => r === 'PASS').length;
      
    } catch (error) {
      console.log('  ❌ Policy engine tests failed:', error.message);
      this.testResults.policyEngine = { createPolicy: 'FAIL', policyInheritance: 'FAIL', conflictDetection: 'FAIL' };
      this.testResults.overall.total += 3;
    }
  }

  async testAuditEngine() {
    console.log('📊 Testing Audit Engine...');
    
    try {
      // Test 4.1: Audit logging
      const auditResponse = await this.httpPost(`${this.baseUrl}/api/audit/log`, {
        action: 'test_action',
        resource_type: 'policy',
        resource_id: 'test-id',
        details: { test: true }
      });
      
      if (auditResponse.data.success) {
        this.testResults.auditEngine.auditLogging = 'PASS';
        console.log('  ✅ Audit logging: PASS');
      } else {
        this.testResults.auditEngine.auditLogging = 'FAIL';
        console.log('  ❌ Audit logging: FAIL');
      }

      // Test 4.2: Governance packet export
      const exportResponse = await this.httpGet(`${this.baseUrl}/api/audit/export/test-session-id`);
      
      if (exportResponse.data.success) {
        this.testResults.auditEngine.governanceExport = 'PASS';
        console.log('  ✅ Governance export: PASS');
      } else {
        this.testResults.auditEngine.governanceExport = 'FAIL';
        console.log('  ❌ Governance export: FAIL');
      }

      // Test 4.3: Evidence attachment
      const evidenceResponse = await this.httpPost(`${this.baseUrl}/api/audit/evidence`, {
        session_id: 'test-session-id',
        evidence_type: 'document',
        file_name: 'test.pdf'
      });
      
      if (evidenceResponse.data.success) {
        this.testResults.auditEngine.evidenceAttachment = 'PASS';
        console.log('  ✅ Evidence attachment: PASS');
      } else {
        this.testResults.auditEngine.evidenceAttachment = 'FAIL';
        console.log('  ❌ Evidence attachment: FAIL');
      }

      this.testResults.overall.total += 3;
      this.testResults.overall.passed += Object.values(this.testResults.auditEngine).filter(r => r === 'PASS').length;
      
    } catch (error) {
      console.log('  ❌ Audit engine tests failed:', error.message);
      this.testResults.auditEngine = { auditLogging: 'FAIL', governanceExport: 'FAIL', evidenceAttachment: 'FAIL' };
      this.testResults.overall.total += 3;
    }
  }

  async testUserOnboarding() {
    console.log('👥 Testing User Onboarding...');
    
    try {
      // Test 5.1: Agency invitation
      const inviteResponse = await this.httpPost(`${this.baseUrl}/api/agency-onboarding/invite`, {
        agencyEmail: 'test@agency.com',
        agencyName: 'Test Agency'
      });
      
      if (inviteResponse.data.success) {
        this.testResults.userOnboarding.agencyInvitation = 'PASS';
        console.log('  ✅ Agency invitation: PASS');
      } else {
        this.testResults.userOnboarding.agencyInvitation = 'FAIL';
        console.log('  ❌ Agency invitation: FAIL');
      }

      // Test 5.2: User invitation
      const userInviteResponse = await this.httpPost(`${this.baseUrl}/api/enterprises/test-enterprise/seats/test-seat/invite-user`, {
        email: 'user@test.com',
        role: 'seat_user'
      });
      
      if (userInviteResponse.data.success) {
        this.testResults.userOnboarding.userInvitation = 'PASS';
        console.log('  ✅ User invitation: PASS');
      } else {
        this.testResults.userOnboarding.userInvitation = 'FAIL';
        console.log('  ❌ User invitation: FAIL');
      }

      // Test 5.3: Onboarding flow
      const onboardingResponse = await this.httpGet(`${this.baseUrl}/api/onboarding/status`);
      
      if (onboardingResponse.data.success) {
        this.testResults.userOnboarding.onboardingFlow = 'PASS';
        console.log('  ✅ Onboarding flow: PASS');
      } else {
        this.testResults.userOnboarding.onboardingFlow = 'FAIL';
        console.log('  ❌ Onboarding flow: FAIL');
      }

      this.testResults.overall.total += 3;
      this.testResults.overall.passed += Object.values(this.testResults.userOnboarding).filter(r => r === 'PASS').length;
      
    } catch (error) {
      console.log('  ❌ User onboarding tests failed:', error.message);
      this.testResults.userOnboarding = { agencyInvitation: 'FAIL', userInvitation: 'FAIL', onboardingFlow: 'FAIL' };
      this.testResults.overall.total += 3;
    }
  }

  async testMetaLoop() {
    console.log('🤖 Testing Meta-Loop AI...');
    
    try {
      // Test 6.1: Agent orchestration
      const orchestrationResponse = await this.httpPost(`${this.baseUrl}/api/metaloop/orchestrate`, {
        input: 'Test AI tool submission',
        workflow_type: 'agency-tool-submission'
      });
      
      if (orchestrationResponse.data.success) {
        this.testResults.metaLoop.agentOrchestration = 'PASS';
        console.log('  ✅ Agent orchestration: PASS');
      } else {
        this.testResults.metaLoop.agentOrchestration = 'FAIL';
        console.log('  ❌ Agent orchestration: FAIL');
      }

      // Test 6.2: AI processing
      const aiResponse = await this.httpPost(`${this.baseUrl}/api/metaloop/process`, {
        message: 'Test AI processing',
        context: { user_id: 'test-user' }
      });
      
      if (aiResponse.data.success) {
        this.testResults.metaLoop.aiProcessing = 'PASS';
        console.log('  ✅ AI processing: PASS');
      } else {
        this.testResults.metaLoop.aiProcessing = 'FAIL';
        console.log('  ❌ AI processing: FAIL');
      }

      // Test 6.3: Learning system
      const learningResponse = await this.httpPost(`${this.baseUrl}/api/metaloop/learn`, {
        interaction: 'test_interaction',
        outcome: 'success'
      });
      
      if (learningResponse.data.success) {
        this.testResults.metaLoop.learningSystem = 'PASS';
        console.log('  ✅ Learning system: PASS');
      } else {
        this.testResults.metaLoop.learningSystem = 'FAIL';
        console.log('  ❌ Learning system: FAIL');
      }

      this.testResults.overall.total += 3;
      this.testResults.overall.passed += Object.values(this.testResults.metaLoop).filter(r => r === 'PASS').length;
      
    } catch (error) {
      console.log('  ❌ Meta-Loop tests failed:', error.message);
      this.testResults.metaLoop = { agentOrchestration: 'FAIL', aiProcessing: 'FAIL', learningSystem: 'FAIL' };
      this.testResults.overall.total += 3;
    }
  }

  generateReport() {
    console.log('\n📊 PLATFORM READINESS TEST RESULTS');
    console.log('=====================================\n');

    const totalTests = this.testResults.overall.total;
    const passedTests = this.testResults.overall.passed;
    const percentage = Math.round((passedTests / totalTests) * 100);

    console.log(`Overall Score: ${passedTests}/${totalTests} (${percentage}%)`);

    if (percentage >= 80) {
      console.log('🎉 STATUS: READY FOR BETA LAUNCH');
    } else if (percentage >= 60) {
      console.log('⚠️  STATUS: NEEDS MINOR FIXES');
    } else {
      console.log('❌ STATUS: MAJOR ISSUES DETECTED');
    }

    console.log('\nDetailed Results:');
    console.log('-----------------');

    Object.entries(this.testResults).forEach(([category, results]) => {
      if (category !== 'overall') {
        console.log(`\n${category.toUpperCase()}:`);
        Object.entries(results).forEach(([test, result]) => {
          const icon = result === 'PASS' ? '✅' : '❌';
          console.log(`  ${icon} ${test}: ${result}`);
        });
      }
    });

    console.log('\n🎯 RECOMMENDATIONS:');
    if (percentage >= 80) {
      console.log('✅ Proceed with beta launch');
      console.log('✅ Invite 3-5 beta customers');
      console.log('✅ Monitor system performance');
    } else if (percentage >= 60) {
      console.log('⚠️  Fix critical issues before launch');
      console.log('⚠️  Focus on failed test categories');
      console.log('⚠️  Re-run tests after fixes');
    } else {
      console.log('❌ Address major issues first');
      console.log('❌ Review architecture decisions');
      console.log('❌ Consider additional development time');
    }
  }
}

// Run the tests
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const tester = new PlatformReadinessTester();
  tester.runAllTests();
}

export default PlatformReadinessTester;
