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
  optimization_run_id?: string
  improvement_percentage?: number
  created_at?: string
  activated_at?: string
  deprecated_at?: string
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
  human_feedback?: HumanFeedback
  score: number
  is_failure?: boolean
}

export interface HumanFeedback {
  final_decision: 'approved' | 'rejected' | 'needs_review'
  reasoning: string
  correct_risk_level?: string
  suggested_mitigations?: string[]
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
  improved_system_prompt?: string
  improved_user_template?: string
}

export interface EvaluationResult {
  score: number
  passed: boolean
  details?: any
}

// Agent Activities schema (from existing database)
export interface AgentActivity {
  id: number
  agent: string
  action: string
  status: string
  workspace_id?: string
  enterprise_id?: string
  details: {
    input?: any
    output?: any
    metadata?: {
      human_review?: HumanFeedback
      [key: string]: any
    }
    [key: string]: any
  }
  created_at: string
}

export interface OptimizationRun {
  id: string
  agent_type: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  training_examples_count?: number
  test_examples_count?: number
  baseline_score?: number
  improved_score?: number
  improvement_percentage?: number
  best_prompt_id?: string
  failure_analysis?: any
  cost_estimate_usd?: number
  created_by?: string
}

