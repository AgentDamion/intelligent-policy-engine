import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import {
  AgentPrompt,
  TrainingExample,
  OptimizationConfig,
  OptimizationResult,
  PromptReflection,
  EvaluationResult
} from '../types'

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
      .from('optimization_runs')
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

      // 3. Get training data
      console.log(`📊 Extracting training data...`)
      const trainingData = await this.getTrainingData(
        config.agent_type,
        config.training_examples_limit
      )
      console.log(`   Found ${trainingData.length} examples`)

      if (trainingData.length < 10) {
        throw new Error('Insufficient training data (need at least 10 examples)')
      }

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
        .from('prompt_reflections')
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
        system_prompt: reflection.improved_system_prompt,
        user_prompt_template: reflection.improved_user_template,
        is_active: false, // Requires approval
        parent_prompt_id: currentPrompt.id
      }

      // 9. Evaluate improved prompt
      console.log(`\n📈 Evaluating improved prompt...`)
      const improvedScore = await this.evaluatePrompt(improvedPrompt, testSet)
      console.log(`   Improved accuracy: ${(improvedScore * 100).toFixed(1)}%`)

      const improvement = ((improvedScore - baselineScore) / baselineScore) * 100

      // 10. Save improved prompt
      const { data: savedPrompt, error: saveError } = await this.supabase
        .from('agent_prompts')
        .insert({
          ...improvedPrompt,
          optimization_run_id: run.id,
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
        .from('prompt_reflections')
        .update({ resulting_prompt_id: savedPrompt.id })
        .eq('id', savedReflection.id)

      // 11. Update run with results
      await this.updateRunStatus(run.id, 'completed', {
        baseline_score: baselineScore,
        improved_score: improvedScore,
        improvement_percentage: improvement,
        best_prompt_id: savedPrompt.id,
        cost_estimate: this.estimateCost(trainingData.length)
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
      .from('agent_prompts')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      throw new Error(`No active prompt found for ${agentType}`)
    }

    return data as AgentPrompt
  }

  /**
   * Extract training examples from agent_activities
   */
  private async getTrainingData(
    agentType: string,
    limit: number
  ): Promise<TrainingExample[]> {
    // Query agent activities with human review
    const { data: activities, error } = await this.supabase
      .from('agent_activities')
      .select(`
        id,
        input,
        output,
        metadata,
        audit_entries!inner (
          event_type,
          metadata
        )
      `)
      .eq('agent_name', agentType)
      .in('audit_entries.event_type', ['human_review_completed', 'decision_override'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching training data:', error)
      return []
    }

    if (!activities || activities.length === 0) {
      console.warn(`No training data found for ${agentType}`)
      return []
    }

    // Transform to training examples
    return activities
      .map(activity => {
        const reviewEvent = activity.audit_entries?.[0]
        
        return {
          id: activity.id,
          input: activity.input || {},
          agent_output: activity.output || {},
          human_feedback: reviewEvent?.metadata || {},
          score: this.calculateScore(activity.output, reviewEvent?.metadata)
        }
      })
      .filter(ex => ex.input && ex.agent_output)
      .map(ex => ({
        ...ex,
        is_failure: ex.score < 0.7
      }))
  }

  /**
   * Calculate score by comparing agent output to human feedback
   */
  private calculateScore(agentOutput: any, humanFeedback: any): number {
    if (!humanFeedback) return 0.5

    // Compare decisions
    const agentDecision = agentOutput?.decision || agentOutput?.status
    const humanDecision = humanFeedback?.final_decision || humanFeedback?.correct_decision

    if (!agentDecision || !humanDecision) return 0.5

    // Simple binary comparison
    return agentDecision.toLowerCase() === humanDecision.toLowerCase() ? 1.0 : 0.0
  }

  /**
   * Evaluate prompt on test examples
   */
  private async evaluatePrompt(
    prompt: AgentPrompt,
    examples: TrainingExample[]
  ): Promise<number> {
    const scores: number[] = []

    // Test on sample to save costs
    const sampleSize = Math.min(10, examples.length)
    const sample = examples.slice(0, sampleSize)

    for (const example of sample) {
      try {
        const result = await this.testPromptOnExample(prompt, example)
        scores.push(result.score)
      } catch (error) {
        console.error(`  Error testing example:`, error)
        scores.push(0)
      }
    }

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
    const humanDecision = example.human_feedback?.final_decision || 
                         example.human_feedback?.correct_decision

    const passed = decision.toLowerCase() === humanDecision?.toLowerCase()

    return {
      score: passed ? 1.0 : 0.0,
      passed,
      details: { decision, humanDecision, response: agentResponse }
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
      filled = filled.replace(new RegExp(placeholder, 'g'), replacement)
    }

    return filled
  }

  /**
   * Extract decision from agent response
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
      .from('optimization_runs')
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
    // - Training examples: $0.01 per example
    // - Reflection: $0.50
    // - Evaluation: $0.20 per test case
    return (exampleCount * 0.01) + 0.50 + (10 * 0.20)
  }
}
