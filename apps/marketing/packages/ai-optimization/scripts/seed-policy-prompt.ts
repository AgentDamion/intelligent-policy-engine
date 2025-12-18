#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment from root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../../../.env.local') })
dotenv.config({ path: resolve(__dirname, '../../../.env') })

/**
 * Current PolicyAgent prompt extracted from:
 * supabase/functions/cursor-agent-adapter/agents/policy-agent.ts
 */
const POLICY_AGENT_PROMPT = {
  agent_type: 'PolicyAgent',
  prompt_version: 1,
  system_prompt: `You are a policy compliance evaluator for AI governance and enterprise risk management.

Your role is to analyze AI tool and service requests against enterprise policies, regulatory requirements, and risk frameworks.

Key Responsibilities:
- Evaluate regulatory compliance (GDPR, HIPAA, FDA, PCI-DSS, SOC2)
- Assess data privacy and security risks
- Identify potential legal and ethical concerns
- Consider vendor reputation and trustworthiness
- Evaluate business impact and operational risks

Decision Framework:
- APPROVED: Low risk tools from trusted vendors with appropriate safeguards
- REJECTED: High risk tools with clear compliance violations or security threats
- NEEDS_REVIEW: Medium risk scenarios requiring human judgment (regulated industries, sensitive data, new vendors)

Be thorough in your analysis but err on the side of caution for sensitive use cases.
Provide clear reasoning for all decisions with specific risk factors identified.`,

  user_prompt_template: `Analyze this policy request for compliance and risk:

Tool: {tool}
Vendor: {vendor}
Usage: {usage}
Data Handling: {dataHandling}
Additional Context: {content}

Assess the following:
1. Regulatory compliance (GDPR, HIPAA, FDA, PCI-DSS, etc.)
2. Data privacy risks and sensitive data handling
3. Security implications and vendor trustworthiness
4. Business risk factors and reputational concerns
5. Recommended approval status

Provide your evaluation in JSON format:
{
  "compliance_status": "compliant" | "non_compliant" | "needs_review",
  "risk_level": "low" | "medium" | "high",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "key_factors": ["factor1", "factor2"],
  "metadata": {
    "regulatory_concerns": [],
    "data_risks": [],
    "vendor_assessment": ""
  }
}`,

  few_shot_examples: [],
  performance_metrics: {},
  is_active: true,
  created_by: 'system'
}

async function seedPolicyPrompt() {
  console.log('🌱 Seeding PolicyAgent prompt to database\n')

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   Required: VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Debug: Show what we're using (first 20 chars only for security)
  console.log(`📍 Using Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Using key starting with: ${supabaseKey.substring(0, 20)}...`)
  console.log(`   Key length: ${supabaseKey.length} characters`)

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Check if prompt already exists
  const { data: existing, error: checkError } = await supabase
    .from('agent_prompts_v2')
    .select('*')
    .eq('agent_type', 'PolicyAgent')
    .eq('is_active', true)
    .maybeSingle()

  if (checkError) {
    console.error('❌ Error checking existing prompts:', checkError)
    process.exit(1)
  }

  if (existing) {
    console.log('⚠️  Active PolicyAgent prompt already exists:')
    console.log(`   ID: ${existing.id}`)
    console.log(`   Version: ${existing.prompt_version}`)
    console.log(`   Created: ${existing.created_at}`)
    console.log('\n✅ No action needed - prompt already seeded')
    return
  }

  // Insert the prompt
  const { data: inserted, error: insertError } = await supabase
    .from('agent_prompts_v2')
    .insert(POLICY_AGENT_PROMPT)
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error inserting prompt:', insertError)
    process.exit(1)
  }

  console.log('✅ PolicyAgent prompt successfully seeded!')
  console.log(`   ID: ${inserted.id}`)
  console.log(`   Agent Type: ${inserted.agent_type}`)
  console.log(`   Version: ${inserted.prompt_version}`)
  console.log(`   Active: ${inserted.is_active}`)
  console.log(`\n📋 System Prompt Preview:`)
  console.log(`   ${inserted.system_prompt.substring(0, 150)}...`)
  console.log(`\n🎯 Ready for optimization! Next steps:`)
  console.log(`   1. Run: npm run generate-data (to create training examples)`)
  console.log(`   2. Run: npm run test (to start optimization)`)
}

seedPolicyPrompt()

