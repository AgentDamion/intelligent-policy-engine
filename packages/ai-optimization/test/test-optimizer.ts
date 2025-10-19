import { createClient } from '@supabase/supabase-js'
import { PromptOptimizer } from '../src/services/prompt-optimizer'
import * as dotenv from 'dotenv'

dotenv.config()

async function runTest() {
  console.log('🧪 GEPA Optimization Test\n')

  // Initialize clients
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const optimizer = new PromptOptimizer(
    supabase,
    process.env.OPENAI_API_KEY!
  )

  try {
    // Run optimization
    const result = await optimizer.optimizeAgent({
      agent_type: 'policy',  // Change to your actual agent name
      training_examples_limit: 50,
      test_examples_limit: 10,
      failure_threshold: 0.7,
      model: 'gpt-4-turbo-preview'
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ OPTIMIZATION RESULTS')
    console.log('='.repeat(60))
    console.log(`Agent Type: ${result.agent_type}`)
    console.log(`Run ID: ${result.run_id}`)
    console.log(`Baseline Score: ${(result.baseline_score * 100).toFixed(1)}%`)
    console.log(`Improved Score: ${(result.improved_score * 100).toFixed(1)}%`)
    console.log(`Improvement: ${result.improvement_percentage.toFixed(1)}%`)
    console.log(`Cost Estimate: $${result.cost_estimate.toFixed(2)}`)
    console.log(`\nNew Prompt ID: ${result.prompt_id}`)
    console.log(`Status: Awaiting approval\n`)

    console.log('💡 REFLECTION INSIGHTS:')
    console.log(`Diagnosis: ${result.reflection.diagnosis}`)
    console.log(`Key Issues:`)
    result.reflection.key_issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('Next step: Review and approve the new prompt')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

runTest()
