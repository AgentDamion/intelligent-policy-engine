#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { PromptOptimizer } from '../src/services/prompt-optimizer.js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment from root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../../../.env.local') })
dotenv.config({ path: resolve(__dirname, '../../../.env') })

async function runTest() {
  console.log('🧪 GEPA Policy Agent Optimization Test\n')
  console.log('='.repeat(70))

  // Verify environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !supabaseKey || !openaiKey) {
    console.error('❌ Missing required environment variables:')
    if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL (or SUPABASE_URL)')
    if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    if (!openaiKey) console.error('   - OPENAI_API_KEY')
    console.error('\nPlease configure these in .env.local or .env')
    process.exit(1)
  }

  console.log('✅ Environment configured')
  console.log(`   Supabase: ${supabaseUrl.substring(0, 30)}...`)
  console.log(`   OpenAI: ${openaiKey.substring(0, 10)}...`)

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseKey)
  const optimizer = new PromptOptimizer(supabase, openaiKey)

  console.log('\n' + '='.repeat(70))
  console.log('Pre-flight Checks')
  console.log('='.repeat(70))

  // Check if prompt exists
  const { data: prompt, error: promptError } = await supabase
    .from('agent_prompts_v2')
    .select('*')
    .eq('agent_type', 'PolicyAgent')
    .eq('is_active', true)
    .maybeSingle()

  if (promptError || !prompt) {
    console.error('❌ No active PolicyAgent prompt found')
    console.error('   Run: npm run seed-prompt')
    process.exit(1)
  }
  console.log(`✅ Active prompt found (version ${prompt.prompt_version})`)

  // Check if training data exists
  const { data: activities, error: activitiesError } = await supabase
    .from('agent_activities')
    .select('id')
    .eq('agent', 'PolicyAgent')

  if (activitiesError || !activities || activities.length === 0) {
    console.error('❌ No PolicyAgent activities found for training')
    console.error('   Run: npm run generate-data')
    process.exit(1)
  }
  console.log(`✅ Training data available (${activities.length} activities)`)

  console.log('\n' + '='.repeat(70))
  console.log('Starting Optimization')
  console.log('='.repeat(70))

  try {
    // Run optimization
    const result = await optimizer.optimizeAgent({
      agent_type: 'PolicyAgent',
      training_examples_limit: 50,
      test_examples_limit: 10,
      failure_threshold: 0.7,
      model: process.env.OPTIMIZATION_MODEL || 'gpt-4-turbo-preview'
    })

    // Display results
    console.log('\n' + '='.repeat(70))
    console.log('✅ OPTIMIZATION RESULTS')
    console.log('='.repeat(70))
    
    console.log(`\n📊 Performance Metrics:`)
    console.log(`   Agent Type:         ${result.agent_type}`)
    console.log(`   Run ID:             ${result.run_id}`)
    console.log(`   Baseline Score:     ${(result.baseline_score * 100).toFixed(1)}%`)
    console.log(`   Improved Score:     ${(result.improved_score * 100).toFixed(1)}%`)
    console.log(`   Improvement:        ${result.improvement_percentage.toFixed(1)}%`)
    console.log(`   Cost Estimate:      $${result.cost_estimate.toFixed(2)}`)

    console.log(`\n🆕 New Prompt:`)
    console.log(`   Prompt ID:          ${result.prompt_id}`)
    console.log(`   Status:             Awaiting approval`)
    console.log(`   Version:            ${prompt.prompt_version + 1}`)

    console.log(`\n💡 GPT-4 Reflection:`)
    console.log(`   Diagnosis:`)
    console.log(`   ${result.reflection.diagnosis}`)
    console.log(`\n   Key Issues:`)
    result.reflection.key_issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`)
    })
    console.log(`\n   Proposed Changes:`)
    console.log(`   ${result.reflection.proposed_changes.substring(0, 200)}...`)

    console.log('\n' + '='.repeat(70))
    console.log('Next Steps')
    console.log('='.repeat(70))
    console.log('\n1. Review the improved prompt in Supabase dashboard:')
    console.log(`   • Open agent_prompts table`)
    console.log(`   • Find ID: ${result.prompt_id}`)
    console.log(`   • Compare system_prompt to current version`)
    
    console.log('\n2. Review the optimization run details:')
    console.log(`   • Open optimization_runs table`)
    console.log(`   • Find ID: ${result.run_id}`)
    console.log(`   • Check baseline_score and improved_score`)

    console.log('\n3. Review the GPT-4 reflection:')
    console.log(`   • Open prompt_reflections table`)
    console.log(`   • Filter by optimization_run_id: ${result.run_id}`)
    console.log(`   • Read diagnosis and proposed_changes`)

    console.log('\n4. Activate the improved prompt (if satisfied):')
    console.log(`   • Run: SELECT activate_prompt('${result.prompt_id}');`)
    console.log(`   • Or use Supabase SQL Editor`)

    console.log('\n' + '='.repeat(70))
    console.log('✅ Test Complete!')
    console.log('='.repeat(70) + '\n')

  } catch (error) {
    console.error('\n' + '='.repeat(70))
    console.error('❌ Optimization Failed')
    console.error('='.repeat(70))
    console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`)
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

runTest()

