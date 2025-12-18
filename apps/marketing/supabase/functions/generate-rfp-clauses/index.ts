import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { policyId, policyContent, existingRules } = await req.json();

    if (!policyId || !policyContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: policyId, policyContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Construct prompt for RFP clause generation
    const systemPrompt = `You are an AI governance compliance expert. Generate structured RFP questions from the provided policy content.

For each policy requirement, create:
1. A clear question that partners must answer
2. The specific requirement it addresses
3. Suggested evidence types partners should provide
4. Scoring criteria (0-100) with clear thresholds

Output valid JSON only with this structure:
{
  "questions": [
    {
      "id": "q1",
      "category": "Data Privacy|Model Governance|Bias Testing|Security|Transparency",
      "question": "Clear question text",
      "requirement": "Policy requirement this addresses",
      "evidence_types": ["Documentation", "Test Results", "Certifications"],
      "scoring": {
        "excellent": { "threshold": 90, "description": "Fully compliant with documented evidence" },
        "good": { "threshold": 70, "description": "Mostly compliant with some gaps" },
        "acceptable": { "threshold": 50, "description": "Minimally compliant" },
        "insufficient": { "threshold": 0, "description": "Does not meet requirements" }
      },
      "weight": 10
    }
  ],
  "overall_scoring": {
    "passing_threshold": 70,
    "excellence_threshold": 90
  }
}`;

    const userPrompt = `Policy Content:
${policyContent}

${existingRules ? `Existing Rules:
${JSON.stringify(existingRules, null, 2)}` : ''}

Generate comprehensive RFP questions that will help evaluate partner compliance with this policy.`;

    // Call Lovable AI to generate RFP clauses
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let rfpData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                       generatedContent.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      rfpData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Update policy with generated RFP template data
    const { error: updateError } = await supabase
      .from('policies')
      .update({ 
        rfp_template_data: rfpData,
        auto_generate_clauses: true 
      })
      .eq('id', policyId);

    if (updateError) {
      console.error('Failed to update policy:', updateError);
      throw updateError;
    }

    console.log(`Generated RFP clauses for policy ${policyId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        rfpData,
        questionsGenerated: rfpData.questions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-rfp-clauses:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
