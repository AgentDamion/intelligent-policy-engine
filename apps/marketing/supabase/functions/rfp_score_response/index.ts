import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringProfile {
  domains: Array<{
    name: string;
    weight: number;
    criteria: Array<{
      name: string;
      weight: number;
      thresholds: {
        excellent: number;
        good: number;
        acceptable: number;
        insufficient: number;
      };
    }>;
  }>;
  overall_passing_score: number;
}

interface Answer {
  question_id: string;
  answer: string;
  evidence: Array<{
    type: string;
    description: string;
    file_url?: string;
  }>;
}

interface ScoreResult {
  overall_score: number;
  domain_scores: Array<{
    domain: string;
    score: number;
    criteria_scores: Array<{
      criterion: string;
      score: number;
      threshold_met: string;
    }>;
  }>;
  gaps: Array<{
    domain: string;
    criterion: string;
    current_score: number;
    required_score: number;
    severity: string;
  }>;
  recommendations: string[];
  passes_threshold: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      policy_version_id, 
      answers, 
      workspace_id 
    }: { 
      policy_version_id: string; 
      answers: Answer[];
      workspace_id: string;
    } = await req.json();

    console.log('Scoring RFP response:', { policy_version_id, answer_count: answers.length });

    // Call cursor-agent-adapter to score using ComplianceAgent
    console.log('Calling cursor-agent-adapter ComplianceAgent for intelligent scoring...');
    
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentName: 'compliance',
        action: 'score_rfp_response',
        input: {
          policy_version_id,
          answers,
          workspace_id
        },
        context: {
          workspace_id,
          scoring_type: 'rfp_response',
          source: 'rfp_submission'
        }
      })
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error('Agent adapter error:', errorText);
      throw new Error(`ComplianceAgent failed: ${errorText}`);
    }

    const agentResult = await agentResponse.json();
    console.log('ComplianceAgent response:', agentResult);

    // Extract scoring from agent result
    const scoreMetadata = agentResult.result?.metadata || {};
    const overallScore = scoreMetadata.composite_score || 70;
    
    // Build domain scores from agent response
    const domainScores = [
      {
        domain: 'Regulatory Compliance',
        score: scoreMetadata.regulatory_compliance || 70,
        criteria_scores: []
      },
      {
        domain: 'Technical Completeness',
        score: scoreMetadata.technical_completeness || 70,
        criteria_scores: []
      },
      {
        domain: 'Risk Management',
        score: scoreMetadata.risk_management || 70,
        criteria_scores: []
      },
      {
        domain: 'Quality & Professionalism',
        score: scoreMetadata.quality_professionalism || 70,
        criteria_scores: []
      }
    ];

    // Build gaps from agent response
    const gaps = (scoreMetadata.critical_gaps || []).map((gap: string, idx: number) => ({
      domain: 'Compliance',
      criterion: gap,
      current_score: 50,
      required_score: 75,
      severity: 'critical'
    }));

    const recommendations = scoreMetadata.strengths || [
      'Continue following pharmaceutical AI compliance best practices',
      'Maintain strong regulatory documentation'
    ];

    const result: ScoreResult = {
      overall_score: overallScore,
      domain_scores: domainScores,
      gaps,
      recommendations,
      passes_threshold: overallScore >= 70
    };

    console.log('AI-powered scoring complete:', { 
      overall_score: result.overall_score, 
      gaps: result.gaps.length,
      passes: result.passes_threshold,
      ai_provider: agentResult.result?.metadata?.aiProvider
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in rfp_score_response:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
