import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import {
  AgentPrompt,
  AgentActivity,
  TrainingExample,
  OptimizationConfig,
  OptimizationResult,
  PromptReflection,
  EvaluationResult
} from '../types/index.js'
import { DataExtractor } from '../utils/data-extractor.js'

export class PromptOptimizer {
  private openai: OpenAI

  constructor(
    private supabase: SupabaseClient,
    openaiApiKey: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey })
  }

  /**
   * Main optimization entry point
   */
  async optimizeAgent(config: OptimizationConfig): Promise<OptimizationResult> {
    console.log(`\n🚀 Starting optimization for ${config.agent_type} agent...`)

    // 1. Create optimization run
    const { data: run, error: runError } = await this.supabase
      .from('optimization_runs_v2')
      .insert({
        agent_type: config.agent_type,
        status: 'running',
        training_examples_count: config.training_examples_limit,
        test_examples_count: config.test_examples_limit
      })
      .select()
      .single()

    if (runError || !run) {
      throw new Error(`Failed to create optimization run: ${runError?.message}`)
    }

    console.log(`📝 Created optimization run: ${run.id}`)

    try {
      // 2. Get current prompt
      const currentPrompt = await this.getCurrentPrompt(config.agent_type)
      console.log(`✅ Loaded current prompt (version ${currentPrompt.prompt_version})`)

      // 3. Get training data from agent_activities
      console.log(`📊 Extracting training data from agent_activities...`)
      const trainingData = await this.getTrainingData(
        config.agent_type,
        config.training_examples_limit
      )
      
      console.log(`   Found ${trainingData.length} examples with human feedback`)

      // Validate training data
      const validation = DataExtractor.validateTrainingData(trainingData)
      if (!validation.valid) {
        throw new Error(`Training data validation failed: ${validation.errors.join(', ')}`)
      }
      
      validation.warnings.forEach(warning => console.warn(`   ⚠️  ${warning}`))

      // Show summary statistics
      const stats = DataExtractor.getSummaryStats(trainingData)
      console.log(`   Distribution: ${JSON.stringify(stats.decision_distribution)}`)
      console.log(`   Failures: ${stats.failures} (${(stats.failures/stats.total*100).toFixed(1)}%)`)
      console.log(`   Avg Score: ${(stats.avg_score * 100).toFixed(1)}%`)

      // Split train/test
      const splitPoint = Math.floor(trainingData.length * 0.8)
      const trainSet = trainingData.slice(0, splitPoint)
      const testSet = trainingData.slice(splitPoint)
      console.log(`   Split: ${trainSet.length} train, ${testSet.length} test`)

      // 4. Evaluate baseline
      console.log(`\n📈 Evaluating baseline prompt...`)
      const baselineScore = await this.evaluatePrompt(currentPrompt, testSet)
      console.log(`   Baseline accuracy: ${(baselineScore * 100).toFixed(1)}%`)

      // 5. Identify failure cases
      console.log(`\n🔍 Analyzing failure cases...`)
      const failures = trainSet.filter(ex => ex.score < config.failure_threshold)
      console.log(`   Found ${failures.length} failures to analyze`)

      if (failures.length === 0) {
        console.log(`   ℹ️  No failures found - current prompt is performing well!`)
        await this.updateRunStatus(run.id, 'completed', {
          baseline_score: baselineScore,
          improved_score: baselineScore,
          improvement_percentage: 0
        })
        
        return {
          run_id: run.id,
          agent_type: config.agent_type,
          baseline_score: baselineScore,
          improved_score: baselineScore,
          improvement_percentage: 0,
          prompt_id: currentPrompt.id!,
          cost_estimate: 0,
          reflection: {
            diagnosis: 'No failures detected',
            key_issues: [],
            proposed_changes: 'No changes needed',
            reasoning: 'Current prompt is performing well',
            failure_examples: [],
            success_examples: []
          }
        }
      }

      // 6. Generate reflection and improved prompt
      console.log(`\n🤔 Generating GPT-4 reflection...`)
      const reflection = await this.generateReflection(
        currentPrompt,
        failures.slice(0, 5), // Analyze top 5 failures
        config.model
      )
      console.log(`   Diagnosis: ${reflection.diagnosis.substring(0, 100)}...`)

      // 7. Save reflection
      const { data: savedReflection } = await this.supabase
        .from('prompt_reflections_v2')
        .insert({
          optimization_run_id: run.id,
          parent_prompt_id: currentPrompt.id,
          diagnosis: reflection.diagnosis,
          key_issues: reflection.key_issues,
          proposed_changes: reflection.proposed_changes,
          reasoning: reflection.reasoning,
          failure_examples: reflection.failure_examples,
          success_examples: reflection.success_examples
        })
        .select()
        .single()

      // 8. Create improved prompt
      const improvedPrompt: AgentPrompt = {
        agent_type: config.agent_type,
        prompt_version: currentPrompt.prompt_version + 1,
        system_prompt: reflection.improved_system_prompt || currentPrompt.system_prompt,
        user_prompt_template: reflection.improved_user_template || currentPrompt.user_prompt_template,
        is_active: false, // Requires approval
        parent_prompt_id: currentPrompt.id,
        optimization_run_id: run.id
      }

      // 9. Evaluate improved prompt
      console.log(`\n📈 Evaluating improved prompt...`)
      const improvedScore = await this.evaluatePrompt(improvedPrompt, testSet)
      console.log(`   Improved accuracy: ${(improvedScore * 100).toFixed(1)}%`)

      const improvement = ((improvedScore - baselineScore) / baselineScore) * 100

      // 10. Save improved prompt
      const { data: savedPrompt, error: saveError } = await this.supabase
        .from('agent_prompts_v2')
        .insert({
          ...improvedPrompt,
          improvement_percentage: improvement,
          performance_metrics: {
            baseline_score: baselineScore,
            improved_score: improvedScore,
            improvement_percentage: improvement,
            test_cases_total: testSet.length
          }
        })
        .select()
        .single()

      if (saveError || !savedPrompt) {
        throw new Error(`Failed to save improved prompt: ${saveError?.message}`)
      }

      // Link reflection to resulting prompt
      await this.supabase
        .from('prompt_reflections_v2')
        .update({ resulting_prompt_id: savedPrompt.id })
        .eq('id', savedReflection.id)

      // 11. Update run with results
      await this.updateRunStatus(run.id, 'completed', {
        baseline_score: baselineScore,
        improved_score: improvedScore,
        improvement_percentage: improvement,
        best_prompt_id: savedPrompt.id,
        cost_estimate_usd: this.estimateCost(trainingData.length)
      })

      console.log(`\n✅ Optimization complete!`)
      console.log(`   Improvement: ${improvement.toFixed(1)}%`)
      console.log(`   New prompt ID: ${savedPrompt.id}`)
      console.log(`   Status: Awaiting human approval`)

      return {
        run_id: run.id,
        agent_type: config.agent_type,
        baseline_score: baselineScore,
        improved_score: improvedScore,
        improvement_percentage: improvement,
        prompt_id: savedPrompt.id,
        cost_estimate: this.estimateCost(trainingData.length),
        reflection
      }

    } catch (error) {
      console.error(`\n❌ Optimization failed:`, error)
      await this.updateRunStatus(run.id, 'failed', {})
      throw error
    }
  }

  /**
   * Get current active prompt
   */
  private async getCurrentPrompt(agentType: string): Promise<AgentPrompt> {
    const { data, error } = await this.supabase
      .from('agent_prompts_v2')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      throw new Error(`No active prompt found for ${agentType}. Run seed-policy-prompt script first.`)
    }

    return data as AgentPrompt
  }

  /**
   * Extract training examples from agent_activities using JSONB details column
   */
  private async getTrainingData(
    agentType: string,
    limit: number
  ): Promise<TrainingExample[]> {
    // Query agent activities for this agent
    const { data: activities, error } = await this.supabase
      .from('agent_activities')
      .select('*')
      .eq('agent', agentType)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching training data:', error)
      throw new Error(`Failed to fetch training data: ${error.message}`)
    }

    if (!activities || activities.length === 0) {
      throw new Error(`No agent activities found for ${agentType}. Run generate-synthetic-data script first.`)
    }

    // Use DataExtractor to parse activities into training examples
    const examples = DataExtractor.extractTrainingExamples(activities as AgentActivity[])

    if (examples.length === 0) {
      throw new Error(`No valid training examples extracted. Ensure activities have input, output, and human_review in details.metadata`)
    }

    return examples
  }

  /**
   * Evaluate prompt on test examples
   */
  private async evaluatePrompt(
    prompt: AgentPrompt,
    examples: TrainingExample[]
  ): Promise<number> {
    const scores: number[] = []

    // Test on sample to save costs (max 10 examples)
    const sampleSize = Math.min(10, examples.length)
    const sample = examples.slice(0, sampleSize)

    for (const example of sample) {
      try {
        const result = await this.testPromptOnExample(prompt, example)
        scores.push(result.score)
      } catch (error) {
        console.error(`  Error testing example ${example.id}:`, error)
        scores.push(0)
      }
    }

    if (scores.length === 0) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }

  /**
   * Test prompt on single example
   */
  private async testPromptOnExample(
    prompt: AgentPrompt,
    example: TrainingExample
  ): Promise<EvaluationResult> {
    // Fill template with example input
    const userMessage = this.fillTemplate(prompt.user_prompt_template, example.input)

    // Run through OpenAI
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt.system_prompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const agentResponse = response.choices[0]?.message?.content || ''

    // Extract decision from response
    const decision = this.extractDecision(agentResponse)

    // Compare to human feedback
    const humanDecision = example.human_feedback?.final_decision

    if (!humanDecision) {
      return { score: 0.5, passed: false, details: { error: 'No human feedback' } }
    }

    const passed = decision === humanDecision

    return {
      score: passed ? 1.0 : 0.0,
      passed,
      details: { decision, humanDecision, response: agentResponse.substring(0, 200) }
    }
  }

  /**
   * Generate improved prompt via GPT-4 reflection
   */
  private async generateReflection(
    currentPrompt: AgentPrompt,
    failures: TrainingExample[],
    model: string
  ): Promise<PromptReflection & { improved_system_prompt: string, improved_user_template: string }> {
    const reflectionPrompt = `You are an expert AI prompt engineer specializing in compliance and governance systems.

CURRENT SYSTEM PROMPT:
"""
${currentPrompt.system_prompt}
"""

CURRENT USER TEMPLATE:
"""
${currentPrompt.user_prompt_template}
"""

FAILURE CASES:
The current prompt produced incorrect results in these cases:

${failures.map((f, i) => `
CASE ${i + 1}:
Input: ${JSON.stringify(f.input, null, 2).substring(0, 500)}
Agent Output: ${JSON.stringify(f.agent_output, null, 2).substring(0, 300)}
Expected (Human Feedback): ${JSON.stringify(f.human_feedback, null, 2).substring(0, 300)}
Score: ${(f.score * 100).toFixed(0)}%
`).join('\n---\n')}

TASK:
Analyze these failure patterns and generate an improved prompt that:
1. Addresses the specific issues causing failures
2. Maintains the original structure and compliance focus
3. Adds clear, actionable guidance
4. Stays concise and professional

Respond with valid JSON matching this exact structure:
{
  "diagnosis": "A clear explanation of what patterns of failure you observe",
  "key_issues": ["specific issue 1", "specific issue 2", "specific issue 3"],
  "proposed_changes": "Detailed description of how to fix the issues",
  "improved_system_prompt": "The complete new system prompt with improvements",
  "improved_user_template": "The complete new user template with improvements",
  "reasoning": "Why these specific changes will improve performance"
}

IMPORTANT: 
- The improved prompts must be complete, not diffs
- Keep the compliance and governance focus
- Be specific about what to look for in evaluations
- Add examples or criteria where helpful`

    const response = await this.openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: reflectionPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000
    })

    const reflection = JSON.parse(response.choices[0]?.message?.content || '{}')

    return {
      diagnosis: reflection.diagnosis || 'No diagnosis provided',
      key_issues: reflection.key_issues || [],
      proposed_changes: reflection.proposed_changes || 'No changes proposed',
      reasoning: reflection.reasoning || 'No reasoning provided',
      improved_system_prompt: reflection.improved_system_prompt || currentPrompt.system_prompt,
      improved_user_template: reflection.improved_user_template || currentPrompt.user_prompt_template,
      failure_examples: failures.map(f => ({
        input: f.input,
        agent_output: f.agent_output,
        expected: f.human_feedback
      })),
      success_examples: []
    }
  }

  /**
   * Fill template placeholders with data
   */
  private fillTemplate(template: string, data: Record<string, any>): string {
    let filled = template

    // Replace {key} placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`
      const replacement = typeof value === 'object' 
        ? JSON.stringify(value, null, 2)
        : String(value)
      filled = filled.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement)
    }

    return filled
  }

  /**
   * Extract decision from agent response text
   */
  private extractDecision(response: string): string {
    const lower = response.toLowerCase()
    
    if (lower.includes('approved') || lower.includes('approve')) {
      return 'approved'
    }
    if (lower.includes('rejected') || lower.includes('reject')) {
      return 'rejected'
    }
    if (lower.includes('needs review') || lower.includes('needs_review')) {
      return 'needs_review'
    }
    
    return 'unknown'
  }

  /**
   * Update optimization run status
   */
  private async updateRunStatus(
    runId: string,
    status: string,
    updates: Record<string, any>
  ) {
    await this.supabase
      .from('optimization_runs_v2')
      .update({
        status,
        completed_at: status !== 'running' ? new Date().toISOString() : undefined,
        ...updates
      })
      .eq('id', runId)
  }

  /**
   * Estimate API cost
   */
  private estimateCost(exampleCount: number): number {
    // Rough estimate: 
    // - Evaluation: ~10 examples × $0.02 per call = $0.20
    // - Reflection: 1 call with context ~$0.50
    // - Total: ~$0.70 per optimization run
    return (10 * 0.02) + 0.50
  }
}

