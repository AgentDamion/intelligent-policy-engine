export interface AgentPrompt {
  id?: string
  agent_type: string
  prompt_version: number
  system_prompt: string
  user_prompt_template: string
  few_shot_examples?: any[]
  performance_metrics?: PerformanceMetrics
  is_active: boolean
  parent_prompt_id?: string
}

export interface PerformanceMetrics {
  accuracy?: number
  baseline_score?: number
  improved_score?: number
  improvement_percentage?: number
  test_cases_passed?: number
  test_cases_total?: number
}

export interface TrainingExample {
  id: string
  input: Record<string, any>
  agent_output: any
  human_feedback?: any
  score: number
  is_failure?: boolean
}

export interface OptimizationConfig {
  agent_type: string
  training_examples_limit: number
  test_examples_limit: number
  failure_threshold: number  // 0-1, below this is "failure"
  model: string
}

export interface OptimizationResult {
  run_id: string
  agent_type: string
  baseline_score: number
  improved_score: number
  improvement_percentage: number
  prompt_id: string
  cost_estimate: number
  reflection: PromptReflection
}

export interface PromptReflection {
  diagnosis: string
  key_issues: string[]
  proposed_changes: string
  reasoning: string
  failure_examples: any[]
  success_examples: any[]
}

export interface EvaluationResult {
  score: number
  passed: boolean
  details?: any
}
