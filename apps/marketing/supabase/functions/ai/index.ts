import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, enterpriseId, workspaceId, documentType, analysisContext } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get enterprise context if provided
    let enterpriseContext = "";
    if (enterpriseId) {
      try {
        // Query enterprise policies and compliance frameworks
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Get enterprise policies
          const { data: policies } = await supabase
            .from('policies')
            .select('title, description, requirements')
            .eq('enterprise_id', enterpriseId)
            .eq('status', 'active');
            
          // Get enterprise compliance frameworks
          const { data: enterprise } = await supabase
            .from('enterprises')
            .select('name, domain, subscription_tier')
            .eq('id', enterpriseId)
            .single();
            
          if (policies && policies.length > 0) {
            enterpriseContext = `\n\nENTERPRISE CONTEXT for ${enterprise?.name || 'Enterprise'}:
Active Policies: ${policies.map(p => `${p.title}: ${p.description}`).join('; ')}
Compliance Requirements: ${policies.map(p => p.requirements).filter(r => r).join('; ')}
Subscription Tier: ${enterprise?.subscription_tier || 'foundation'}`;
          }
        }
      } catch (contextError) {
        console.error("Failed to fetch enterprise context:", contextError);
      }
    }

    // Get the LOVABLE_API_KEY from environment (automatically provided)
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      console.error("LOVABLE_API_KEY not found in environment, please enable the AI gateway");
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
				
				model: "google/gemini-2.5-flash",
				
        messages: [
					
          {
            role: "system",
            content: `You are an AI compliance agent that analyzes documents for policy violations, security risks, and regulatory compliance. Analyze the provided document content and return a structured response with: document type recognition, compliance assessment, risk level evaluation, confidence score, detailed reasoning, and actionable recommendations. Focus on identifying potential issues with data privacy, security vulnerabilities, regulatory compliance, and policy violations.${enterpriseContext}

${analysisContext ? `\nANALYSIS CONTEXT: ${analysisContext}` : ''}
${documentType ? `\nDOCUMENT TYPE: ${documentType}` : ''}

When analyzing, prioritize the enterprise's specific policies and compliance requirements listed above.`,
          },
					
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", await response.text());
			if (response.status === 429) {
				console.error("Rate limit exceeded");
				return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
					status: 429,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      console.error("No response from AI", data);
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ response: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI call:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
