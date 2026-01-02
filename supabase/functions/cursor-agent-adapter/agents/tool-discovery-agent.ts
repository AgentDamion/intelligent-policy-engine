import { Agent } from '../cursor-agent-registry.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

export class ToolDiscoveryAgent implements Agent {
  private supabase: any

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  async process(input: any, context: any): Promise<any> {
    const { action, input: actionInput } = input

    switch (action) {
      case 'lookup':
        return await this.lookupTool(actionInput)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  async lookupTool(input: { toolName: string; enterpriseId: string }): Promise<any> {
    const { toolName, enterpriseId } = input

    console.log(`🔍 ToolDiscoveryAgent looking up: ${toolName} for enterprise: ${enterpriseId}`)

    try {
      // 1. Try exact match first
      const { data: exactMatch, error: exactError } = await this.supabase
        .from('ai_tool_registry')
        .select('*')
        .ilike('name', toolName)
        .limit(1)
        .single()

      if (exactMatch && !exactError) {
        console.log(`✅ Found exact match: ${exactMatch.name}`)

        // Get policy evaluation for this tool
        const policyResult = await this.getToolPolicyEvaluation(exactMatch.id, enterpriseId)

        return {
          status: 'found',
          tool: {
            id: exactMatch.id,
            name: exactMatch.name,
            category: exactMatch.category,
            risk_tier: exactMatch.risk_tier,
            deployment_status: exactMatch.deployment_status
          },
          policyStatus: policyResult.status,
          requirements: policyResult.requirements || [],
          confidence: 1.0
        }
      }

      // 2. Try fuzzy search
      const { data: fuzzyResults, error: fuzzyError } = await this.supabase
        .rpc('fuzzy_tool_search', {
          search_term: toolName,
          enterprise_id: enterpriseId
        })

      // Filter for meaningful matches (similarity > 0.1)
      const meaningfulMatches = fuzzyResults?.filter(r => r.similarity_score > 0.1) || [];

      if (meaningfulMatches && meaningfulMatches.length > 0 && !fuzzyError) {
        console.log(`🔍 Found ${meaningfulMatches.length} meaningful fuzzy matches`)

        const bestMatch = meaningfulMatches[0]

        // Get policy evaluation for best match
        const policyResult = await this.getToolPolicyEvaluation(bestMatch.tool_id, enterpriseId)

        return {
          status: 'found',
          tool: {
            id: bestMatch.tool_id,
            name: bestMatch.tool_name,
            category: bestMatch.category,
            similarity_score: bestMatch.similarity_score
          },
          policyStatus: policyResult.status,
          requirements: policyResult.requirements || [],
          fuzzyMatches: meaningfulMatches.slice(1).map(r => ({
            name: r.tool_name,
            category: r.category,
            similarity: r.similarity_score
          })),
          confidence: bestMatch.similarity_score
        }
      }

      // 3. No matches found - try category inference
      console.log(`❌ No matches found, attempting category inference`)

      const { data: inferredCategory, error: inferError } = await this.supabase
        .rpc('infer_tool_category', { tool_name: toolName })

      let categoryInfo = null
      if (inferredCategory && inferredCategory.length > 0 && !inferError) {
        const category = inferredCategory[0]
        console.log(`🎯 Inferred category: ${category.category} (${category.confidence})`)

        // Get category policy
        const categoryPolicy = await this.getCategoryPolicy(category.category, enterpriseId)

        categoryInfo = {
          category: category.category,
          confidence: category.confidence,
          policy: categoryPolicy
        }
      }

      // 4. Get approved alternatives in inferred category
      let alternatives = []
      if (categoryInfo?.category) {
        const { data: altResults } = await this.supabase
          .from('ai_tool_registry')
          .select('id, name, category')
          .eq('category', categoryInfo.category)
          .eq('deployment_status', 'approved')
          .limit(3)

        alternatives = altResults || []
      }

      return {
        status: 'unknown',
        toolName,
        inferredCategory: categoryInfo,
        alternatives: alternatives.map(alt => ({
          id: alt.id,
          name: alt.name,
          category: alt.category,
          status: 'approved'
        })),
        confidence: categoryInfo?.confidence || 0.0
      }

    } catch (error) {
      console.error('Tool lookup error:', error)
      throw new Error(`Tool lookup failed: ${error.message}`)
    }
  }

  private async getToolPolicyEvaluation(toolId: string, enterpriseId: string) {
    try {
      // Use existing validateToolDeclaration from audit agent
      const auditAgent = new (await import('./audit-agent.ts')).AuditAgent(this.supabase)
      return await auditAgent.validateToolDeclaration([toolId], enterpriseId)
    } catch (error) {
      console.warn('Policy evaluation failed, returning defaults:', error)
      return {
        approved: false,
        violations: [{ tool_id: toolId, reason: 'Policy evaluation unavailable' }],
        aggregated_risk: 'MEDIUM'
      }
    }
  }

  private async getCategoryPolicy(category: string, enterpriseId: string) {
    try {
      // Look for policies that apply to this category
      const { data: policies } = await this.supabase
        .from('policy_master')
        .select('title, tool_identity, classification')
        .eq('enterprise_id', enterpriseId)
        .eq('status', 'approved')
        .or(`tool_identity->>'categories' ? '${category}', classification->>'categories' ? '${category}'`)
        .limit(1)

      if (policies && policies.length > 0) {
        const policy = policies[0]
        return {
          name: policy.title,
          requirements: this.extractPolicyRequirements(policy)
        }
      }
    } catch (error) {
      console.warn('Category policy lookup failed:', error)
    }

    return null
  }

  private extractPolicyRequirements(policy: any): string[] {
    // Extract requirements from policy JSON
    const requirements = []

    if (policy.tool_identity?.requirements) {
      requirements.push(...policy.tool_identity.requirements)
    }

    if (policy.classification?.controls) {
      requirements.push(...policy.classification.controls)
    }

    return requirements.length > 0 ? requirements : ['Human review required']
  }

  getInfo() {
    return { name: 'ToolDiscoveryAgent', type: 'ToolDiscovery' }
  }
}
