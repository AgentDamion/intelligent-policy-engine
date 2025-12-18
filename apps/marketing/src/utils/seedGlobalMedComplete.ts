import { toast } from "sonner";
import { seedGlobalMedFoundation } from "./seedGlobalMedFoundation";
import { seedAITools } from "./seedAITools";
import { seedGlobalMedPolicies } from "./seedGlobalMedPolicies";
import {
  seedGlobalMedMiddlewareData,
  seedGlobalMedInboxTask,
  seedGlobalMedSimulation,
  seedGlobalMedDecision
} from "./seedGlobalMedMiddlewareData";

/**
 * Master function to seed complete GlobalMed ONCAVEX–Persado scenario
 * Orchestrates all seeding phases in correct sequence
 */
export async function seedGlobalMedComplete() {
  console.log('='.repeat(60));
  console.log('🏥 Starting GlobalMed Complete Scenario Seeding');
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Phase 1: Foundation (Enterprises, Workspaces, Partners)
    console.log('\n📍 PHASE 1: Foundation Data');
    toast.info('Seeding GlobalMed foundation...');
    const { enterpriseId, workspaceIds, partnerIds } = await seedGlobalMedFoundation();
    
    // Phase 2: Tools & Policies
    console.log('\n📍 PHASE 2: AI Tools & Policies');
    toast.info('Seeding AI tools...');
    await seedAITools();
    
    toast.info('Seeding GlobalMed policies...');
    await seedGlobalMedPolicies(enterpriseId, workspaceIds);
    
    // Phase 3: ONCAVEX Violation Data
    console.log('\n📍 PHASE 3: ONCAVEX–Persado Violation Data');
    toast.info('Seeding middleware requests (430 total, 17 violations)...');
    await seedGlobalMedMiddlewareData(enterpriseId, partnerIds, workspaceIds);
    
    toast.info('Creating inbox task...');
    await seedGlobalMedInboxTask(enterpriseId, workspaceIds.oncavex);
    
    toast.info('Creating simulation run...');
    await seedGlobalMedSimulation(enterpriseId, workspaceIds.oncavex);
    
    toast.info('Creating agent decision...');
    await seedGlobalMedDecision(enterpriseId);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ GlobalMed Complete Scenario Seeded Successfully');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`🏢 Enterprise ID: ${enterpriseId}`);
    console.log(`📦 Workspaces: ${Object.keys(workspaceIds).length}`);
    console.log(`🤝 Partners: ${Object.keys(partnerIds).length}`);
    console.log(`📧 Middleware Requests: 430 (17 violations)`);
    console.log(`📬 Inbox Tasks: 1`);
    console.log(`🧪 Simulations: 1`);
    console.log(`⚖️  Decisions: 1`);
    console.log('='.repeat(60));

    toast.success('GlobalMed demo data loaded successfully!', {
      description: `Complete ONCAVEX–Persado scenario ready (${duration}s)`
    });

    return {
      success: true,
      enterpriseId,
      workspaceIds,
      partnerIds,
      scenario: 'ONCAVEX–Persado violation',
      duration: parseFloat(duration)
    };
  } catch (error) {
    console.error('\n❌ GlobalMed Seeding Failed:', error);
    toast.error('Failed to seed GlobalMed data', {
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
