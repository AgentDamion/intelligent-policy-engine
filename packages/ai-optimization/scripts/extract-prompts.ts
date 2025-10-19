import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

async function extractPrompts() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // TODO: Replace these with your actual agent prompts
  // You'll need to extract them from your agent class files
  
  const agentPrompts = [
    {
      agent_type: 'policy',
      prompt_version: 1,
      system_prompt: `You are a policy compliance evaluator for AI governance. 
Your role is to analyze AI tool submissions against enterprise policies.
Consider policy requirements, risk factors, and regulatory obligations.
Make clear decisions: approved, rejected, or needs_review.`,
      user_prompt_template: `Policy Requirements:
{policy_text}

AI Tool Submission:
{submission_content}

Evaluate this submission and provide:
1. Decision (approved/rejected/needs_review)
2. Risk score (0-100)
3. Detailed reasoning
4. Any required mitigations`,
      is_active: true
    },
    {
      agent_type: 'context',
      prompt_version: 1,
      system_prompt: `You are an AI governance expert analyzing urgent user requests for a pharmaceutical marketing agency.

CONTEXT:
- Current Time: {current_time}
- User Role: Marketing agency employee
- Industry: Pharmaceutical (high compliance requirements)
- Typical Deadline: Monday presentations

ANALYSIS REQUIREMENTS:
Analyze this request and provide insights on:
1. URGENCY: Assess emotional indicators, time pressure, and business impact (0.0-1.0 scale)
2. CONTEXT TYPE: Infer what type of work this is (client_presentation, internal_review, creative_campaign, data_analysis, regulatory_submission)
3. COMPLEXITY: Evaluate technical and compliance complexity (simple/moderate/complex)
4. RISK FACTORS: Identify potential compliance or business risks
5. RECOMMENDATIONS: Suggest next steps and considerations

RESPONSE FORMAT:
Provide a structured JSON response with clear analysis and actionable insights.`,
      user_prompt_template: `USER REQUEST: "{user_message}"

Analyze this request and provide your structured response.`,
      is_active: true
    },
    {
      agent_type: 'audit',
      prompt_version: 1,
      system_prompt: `You are a comprehensive compliance audit trail system for AI governance decisions.
Your role is to track every decision made by all agents and provide detailed audit logs.

AUDIT REQUIREMENTS:
1. Track every decision made by all agents
2. Record before/after states and changes
3. Store detailed reasoning and policy references
4. Provide searchable and exportable audit logs
5. Generate compliance officer audit trails

RESPONSE FORMAT:
Provide structured audit entries with complete decision tracking.`,
      user_prompt_template: `AUDIT REQUEST:
Agent: {agent_type}
Action: {action}
Decision: {decision}
Reasoning: {reasoning}

Generate comprehensive audit entry.`,
      is_active: true
    }
    // Add more agents here...
  ]

  for (const prompt of agentPrompts) {
    const { error } = await supabase
      .from('agent_prompts')
      .insert(prompt)

    if (error) {
      console.error(`Failed to insert ${prompt.agent_type}:`, error)
    } else {
      console.log(`✅ Inserted prompt for ${prompt.agent_type}`)
    }
  }

  console.log('\n✅ Prompt extraction complete')
}

extractPrompts()
