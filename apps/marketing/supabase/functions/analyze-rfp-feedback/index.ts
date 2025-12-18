import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { enterprise_id, policy_version_id } = await req.json();

    console.log(`Analyzing RFP feedback for enterprise ${enterprise_id}`);

    // Get all RFP responses for this policy version
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        id,
        rfp_response_data,
        compliance_score,
        compliance_breakdown,
        workspace_id,
        created_at
      `)
      .eq('submission_type', 'rfp_response')
      .eq('policy_version_id', policy_version_id)
      .eq('status', 'submitted');

    if (fetchError) {
      throw new Error(`Failed to fetch submissions: ${fetchError.message}`);
    }

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No RFP responses found for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate compliance gaps
    const gapAnalysis: Record<string, { count: number; partners: string[]; avg_score: number }> = {};
    let totalScore = 0;

    submissions.forEach(sub => {
      totalScore += sub.compliance_score || 0;
      
      if (sub.compliance_breakdown?.gaps) {
        sub.compliance_breakdown.gaps.forEach((gap: any) => {
          if (!gapAnalysis[gap.area]) {
            gapAnalysis[gap.area] = { count: 0, partners: [], avg_score: 0 };
          }
          gapAnalysis[gap.area].count++;
          gapAnalysis[gap.area].partners.push(sub.workspace_id);
        });
      }
    });

    const avgScore = totalScore / submissions.length;

    // Identify recurring gaps (mentioned by >50% of partners)
    const recurringGaps = Object.entries(gapAnalysis)
      .filter(([_, data]) => data.count > submissions.length * 0.5)
      .map(([area, data]) => ({
        compliance_area: area,
        frequency: data.count,
        affected_partners: data.partners.length,
        percentage: (data.count / submissions.length) * 100
      }));

    // Generate AI recommendations using Lovable AI
    let recommendations = [];
    
    if (lovableApiKey && recurringGaps.length > 0) {
      const prompt = `You are a policy governance advisor analyzing RFP compliance feedback.

RFP Response Summary:
- Total Responses: ${submissions.length}
- Average Compliance Score: ${avgScore.toFixed(1)}%
- Recurring Compliance Gaps:
${recurringGaps.map(g => `  • ${g.compliance_area}: ${g.percentage.toFixed(1)}% of partners struggled`).join('\n')}

Based on this data, provide 3-5 specific, actionable policy refinement recommendations.

Format each as:
{
  "title": "Brief recommendation title",
  "priority": "high|medium|low",
  "rationale": "Why this matters based on the data",
  "suggested_action": "Specific change to make to policy"
}

Return valid JSON array only.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a policy governance expert.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices[0]?.message?.content;
          recommendations = JSON.parse(content);
        }
      } catch (error) {
        console.error('AI recommendation generation failed:', error);
      }
    }

    // Fallback recommendations if AI fails
    if (recommendations.length === 0 && recurringGaps.length > 0) {
      recommendations = recurringGaps.slice(0, 3).map(gap => ({
        title: `Clarify ${gap.compliance_area} requirements`,
        priority: 'high',
        rationale: `${gap.percentage.toFixed(0)}% of partners struggled with this area`,
        suggested_action: `Review and simplify ${gap.compliance_area} policy language or provide clearer examples`
      }));
    }

    // Store Meta-Loop insight as AI agent decision
    const { error: decisionError } = await supabase
      .from('ai_agent_decisions')
      .insert({
        agent: 'Meta-Loop Analyzer',
        action: 'RFP Feedback Analysis',
        outcome: avgScore >= 80 ? 'Policy performing well' : 'Policy refinement needed',
        enterprise_id,
        details: {
          analysis_date: new Date().toISOString(),
          policy_version_id,
          total_responses: submissions.length,
          average_score: avgScore,
          recurring_gaps: recurringGaps,
          recommendations,
          threshold_met: avgScore >= 80
        }
      });

    if (decisionError) {
      console.error('Error logging Meta-Loop decision:', decisionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          total_responses: submissions.length,
          average_score: avgScore,
          recurring_gaps: recurringGaps,
          recommendations
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rfp-feedback:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
