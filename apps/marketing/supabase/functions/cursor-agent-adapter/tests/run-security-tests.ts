/**
 * Security Test Runner
 * 
 * Executes the adversarial security test suite and generates a report.
 * Run with: deno run --allow-read --allow-write run-security-tests.ts
 */

import { runAllSecurityTests } from './security-adversarial-tests.ts';

console.log('🚀 Starting Adversarial Security Test Suite...\n');

try {
  const results = await runAllSecurityTests();

  // Save results to JSON file for documentation
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./security-test-report-${timestamp}.json`;
  
  const reportData = {
    executionDate: new Date().toISOString(),
    testEnvironment: {
      denoVersion: Deno.version.deno,
      platform: Deno.build.os,
      arch: Deno.build.arch,
    },
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      critical: results.critical,
      passRate: ((results.passed / results.total) * 100).toFixed(2) + '%',
    },
    results: results.results,
  };

  await Deno.writeTextFile(
    reportPath,
    JSON.stringify(reportData, null, 2)
  );

  console.log(`\n📄 Test report saved to: ${reportPath}`);

  // Exit with error code based on results
  if (results.critical > 0) {
    console.error('\n❌ CRITICAL FAILURES DETECTED - DO NOT DEPLOY');
    Deno.exit(1);
  } else if (results.failed > 0) {
    console.warn('\n⚠️  Some tests failed - review before deployment');
    Deno.exit(2);
  } else {
    console.log('\n✅ All security tests passed - ready for deployment');
    Deno.exit(0);
  }
} catch (error) {
  console.error('❌ Test execution failed:', error);
  Deno.exit(1);
}

