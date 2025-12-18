import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScoringRequest {
  submission_id: string
  question_id: string
  response_text: string
  policy_profile_id?: string
  organization_id: string
}

interface ScoringResult {
  score: number
  max_score: number
  percentage: number
  feedback: string[]
  compliance_gaps: string[]
  recommendations: string[]
  confidence: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { submission_id, question_id, response_text, policy_profile_id, organization_id }: ScoringRequest = await req.json()

    if (!submission_id || !question_id || !response_text || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the question details
    const { data: questionData, error: questionError } = await supabaseClient
      .from('rfp_question_library')
      .select('questions')
      .eq('organization_id', organization_id)
      .single()

    if (questionError || !questionData) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const question = questionData.questions.find((q: any) => q.id === question_id)
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question not found in library' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get policy profile if provided
    let policyProfile = null
    if (policy_profile_id) {
      const { data: profileData, error: profileError } = await supabaseClient
        .from('policy_versions')
        .select('*')
        .eq('id', policy_profile_id)
        .eq('organization_id', organization_id)
        .single()

      if (!profileError && profileData) {
        policyProfile = profileData
      }
    }

    // Score the response using ComplianceScoringAgent logic
    const scoringResult = await scoreResponse(response_text, question, policyProfile)

    // Store the scoring result
    const { data: scoringData, error: scoringError } = await supabaseClient
      .from('submissions')
      .update({
        scoring_results: {
          ...scoringResult,
          scored_at: new Date().toISOString(),
          question_id,
          policy_profile_id
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', submission_id)
      .eq('organization_id', organization_id)
      .select()
      .single()

    if (scoringError) {
      console.error('Error storing scoring result:', scoringError)
      return new Response(
        JSON.stringify({ error: 'Failed to store scoring result' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the scoring activity for audit
    await supabaseClient
      .from('agent_activities')
      .insert({
        organization_id,
        agent_type: 'compliance_scoring_agent',
        activity_type: 'rfp_scoring',
        activity_data: {
          submission_id,
          question_id,
          score: scoringResult.score,
          percentage: scoringResult.percentage,
          confidence: scoringResult.confidence
        },
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        scoring_result: scoringResult,
        submission_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error scoring RFP response:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function scoreResponse(
  responseText: string, 
  question: any, 
  policyProfile: any
): Promise<ScoringResult> {
  // This is a simplified scoring implementation
  // In production, this would use the actual ComplianceScoringAgent
  
  const requirements = question.requirements || []
  const maxScore = requirements.length * 10 // 10 points per requirement
  
  let score = 0
  const feedback: string[] = []
  const complianceGaps: string[] = []
  const recommendations: string[] = []
  
  // Simple keyword-based scoring (in production, use AI/ML)
  const responseLower = responseText.toLowerCase()
  
  for (const requirement of requirements) {
    const requirementLower = requirement.toLowerCase()
    
    // Check if requirement is mentioned
    if (responseLower.includes(requirementLower)) {
      score += 10
      feedback.push(`✓ Addressed: ${requirement}`)
    } else {
      complianceGaps.push(requirement)
      recommendations.push(`Consider addressing: ${requirement}`)
    }
  }
  
  // Check for policy alignment if profile provided
  if (policyProfile) {
    const policyKeywords = extractPolicyKeywords(policyProfile)
    let policyAlignment = 0
    
    for (const keyword of policyKeywords) {
      if (responseLower.includes(keyword.toLowerCase())) {
        policyAlignment += 1
      }
    }
    
    // Add bonus points for policy alignment
    const policyBonus = Math.min(policyAlignment * 2, 10)
    score += policyBonus
    
    if (policyBonus > 0) {
      feedback.push(`✓ Policy alignment bonus: +${policyBonus} points`)
    }
  }
  
  // Calculate confidence based on response length and detail
  const confidence = Math.min(
    (responseText.length / 100) * 0.3 + 
    (feedback.length / requirements.length) * 0.7,
    1.0
  )
  
  const percentage = Math.round((score / maxScore) * 100)
  
  return {
    score: Math.min(score, maxScore),
    max_score: maxScore,
    percentage,
    feedback,
    compliance_gaps: complianceGaps,
    recommendations,
    confidence: Math.round(confidence * 100) / 100
  }
}

function extractPolicyKeywords(policyProfile: any): string[] {
  // Extract keywords from policy content for alignment checking
  const content = policyProfile.content || ''
  const keywords: string[] = []
  
  // Simple keyword extraction (in production, use NLP)
  const commonTerms = [
    'security', 'privacy', 'compliance', 'data', 'access', 'control',
    'encryption', 'authentication', 'authorization', 'audit', 'monitoring',
    'backup', 'recovery', 'incident', 'response', 'governance', 'risk'
  ]
  
  for (const term of commonTerms) {
    if (content.toLowerCase().includes(term)) {
      keywords.push(term)
    }
  }
  
  return keywords
}

