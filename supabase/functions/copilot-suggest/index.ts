import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
const ViolationSchema = z.object({
  rule_id: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  field: z.string().optional(),
});

const VerdictSchema = z.object({
  allowed: z.boolean(),
  violations: z.array(ViolationSchema),
  warnings: z.array(ViolationSchema),
  confidence: z.number(),
  evaluated_at: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ToolUsageEventSchema = z.object({
  tool_id: z.string().uuid(),
  tool_version: z.string(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  timestamp: z.string(),
  usage_context: z.object({
    use_case: z.string().optional(),
    jurisdiction: z.array(z.string()).optional(),
    data_classification: z.array(z.string()).optional(),
    therapeutic_area: z.string().optional(),
    intended_use: z.string().optional(),
    output_type: z.string().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const PolicyRuleSchema = z.object({
  id: z.string(),
  type: z.string(),
  condition: z.any(),
  action: z.string(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
  message: z.string().optional(),
});

const SuggestRequestSchema = z.object({
  event: ToolUsageEventSchema,
  verdict: VerdictSchema,
  rules: z.array(PolicyRuleSchema),
  cfg: z.any().optional(),
});

type ToolUsageEvent = z.infer<typeof ToolUsageEventSchema>;
type Verdict = z.infer<typeof VerdictSchema>;
type PolicyRule = z.infer<typeof PolicyRuleSchema>;
type Violation = z.infer<typeof ViolationSchema>;

interface Suggestion {
  id: string;
  type: 'fix' | 'workaround' | 'escalate' | 'alternative';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_steps: string[];
  estimated_effort: 'quick' | 'moderate' | 'complex';
  related_violations: string[];
  metadata?: Record<string, any>;
}

// Generate AI-powered suggestions using OpenAI
async function generateSuggestions(
  event: ToolUsageEvent,
  verdict: Verdict,
  rules: PolicyRule[],
  cfg?: any
): Promise<Suggestion[]> {
  
  // If already compliant, no suggestions needed
  if (verdict.allowed && verdict.warnings.length === 0) {
    return [];
  }
  
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    console.warn('OPENAI_API_KEY not configured, returning basic suggestions');
    return generateBasicSuggestions(event, verdict, rules);
  }
  
  const prompt = buildPrompt(event, verdict, rules);
  
  try {
    console.log('Calling OpenAI for compliance suggestions...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a pharmaceutical AI compliance copilot. Generate actionable remediation suggestions in valid JSON format. Respond ONLY with a JSON array of suggestions, no markdown or explanation.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return generateBasicSuggestions(event, verdict, rules);
    }
    
    const aiResult = await response.json();
    const suggestionsText = aiResult.choices[0].message.content;
    
    console.log('AI response received, parsing suggestions...');
    
    // Parse AI response
    const suggestions = parseAISuggestions(suggestionsText, verdict);
    
    return suggestions.length > 0 ? suggestions : generateBasicSuggestions(event, verdict, rules);
    
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return generateBasicSuggestions(event, verdict, rules);
  }
}

function buildPrompt(event: ToolUsageEvent, verdict: Verdict, rules: PolicyRule[]): string {
  const violations = verdict.violations.map(v => `- [${v.severity}] ${v.message} (Rule: ${v.rule_id})`).join('\n');
  const warnings = verdict.warnings.map(w => `- [${w.severity}] ${w.message} (Rule: ${w.rule_id})`).join('\n');
  
  return `Analyze these policy compliance issues and provide 3-5 actionable suggestions.

VIOLATIONS:
${violations || 'None'}

WARNINGS:
${warnings || 'None'}

TOOL CONTEXT:
- Tool: ${event.tool_id}
- Version: ${event.tool_version}
- Use Case: ${event.usage_context?.use_case || 'Not specified'}
- Jurisdictions: ${event.usage_context?.jurisdiction?.join(', ') || 'Not specified'}
- Data Classifications: ${event.usage_context?.data_classification?.join(', ') || 'Not specified'}

ACTIVE POLICY RULES:
${JSON.stringify(rules.slice(0, 5), null, 2)}

Provide suggestions as a JSON array with this exact structure:
[
  {
    "type": "fix|workaround|escalate|alternative",
    "priority": "high|medium|low",
    "title": "Short title",
    "description": "Detailed explanation",
    "action_steps": ["Step 1", "Step 2"],
    "estimated_effort": "quick|moderate|complex",
    "related_violations": ["rule_id"]
  }
]

Focus on practical, pharmaceutical-specific remediation steps.`;
}

function parseAISuggestions(text: string, verdict: Verdict): Suggestion[] {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    
    const parsed = JSON.parse(jsonText);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    return parsed.map((s, idx) => ({
      id: `suggestion_${Date.now()}_${idx}`,
      type: s.type || 'fix',
      priority: s.priority || 'medium',
      title: s.title || 'Compliance Recommendation',
      description: s.description || '',
      action_steps: Array.isArray(s.action_steps) ? s.action_steps : [],
      estimated_effort: s.estimated_effort || 'moderate',
      related_violations: Array.isArray(s.related_violations) ? s.related_violations : [],
      metadata: s.metadata || {},
    }));
  } catch (error) {
    console.error('Failed to parse AI suggestions:', error);
    return [];
  }
}

function generateBasicSuggestions(
  event: ToolUsageEvent,
  verdict: Verdict,
  rules: PolicyRule[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Group violations by field
  const violationsByField = new Map<string, Violation[]>();
  verdict.violations.forEach(v => {
    const field = v.field || 'general';
    if (!violationsByField.has(field)) {
      violationsByField.set(field, []);
    }
    violationsByField.get(field)!.push(v);
  });
  
  // Generate suggestions for each field
  for (const [field, violations] of violationsByField) {
    switch (field) {
      case 'jurisdiction':
        suggestions.push({
          id: `suggestion_jurisdiction_${Date.now()}`,
          type: 'fix',
          priority: 'high',
          title: 'Update Tool Approval for Required Jurisdictions',
          description: `This tool needs approval for the following jurisdictions: ${violations.map(v => v.message).join(', ')}`,
          action_steps: [
            'Navigate to Policy Studio',
            'Select the relevant policy template',
            'Add required jurisdictions to the approval scope',
            'Submit for review and approval',
          ],
          estimated_effort: 'moderate',
          related_violations: violations.map(v => v.rule_id),
        });
        break;
        
      case 'data_classification':
        suggestions.push({
          id: `suggestion_data_${Date.now()}`,
          type: 'workaround',
          priority: 'high',
          title: 'Adjust Data Classification or Update Policy',
          description: 'The tool is not approved for the specified data classifications.',
          action_steps: [
            'Review if data classification can be reduced (e.g., anonymize PHI)',
            'If not, request policy update in Policy Studio',
            'Consider using an alternative tool approved for this data classification',
          ],
          estimated_effort: 'moderate',
          related_violations: violations.map(v => v.rule_id),
        });
        break;
        
      case 'use_case':
        suggestions.push({
          id: `suggestion_usecase_${Date.now()}`,
          type: 'alternative',
          priority: 'medium',
          title: 'Use Case Not Approved',
          description: 'The specified use case is not approved for this tool.',
          action_steps: [
            'Review if use case can be reclassified',
            'Check Marketplace for alternative tools approved for this use case',
            'Submit policy change request if this tool is required',
          ],
          estimated_effort: 'quick',
          related_violations: violations.map(v => v.rule_id),
        });
        break;
        
      case 'tool_version':
        suggestions.push({
          id: `suggestion_version_${Date.now()}`,
          type: 'fix',
          priority: 'high',
          title: 'Upgrade to Approved Tool Version',
          description: 'The current tool version does not meet policy requirements.',
          action_steps: [
            'Check approved version in Policy Studio',
            'Upgrade tool to approved version',
            'Test compatibility with existing workflows',
            'Resubmit for validation',
          ],
          estimated_effort: 'quick',
          related_violations: violations.map(v => v.rule_id),
        });
        break;
        
      default:
        suggestions.push({
          id: `suggestion_general_${Date.now()}`,
          type: 'escalate',
          priority: 'medium',
          title: 'Policy Compliance Issue Detected',
          description: violations.map(v => v.message).join('; '),
          action_steps: [
            'Review policy requirements in Policy Studio',
            'Contact compliance team for guidance',
            'Consider alternative approaches or tools',
          ],
          estimated_effort: 'moderate',
          related_violations: violations.map(v => v.rule_id),
        });
    }
  }
  
  // Add warning-based suggestions
  if (verdict.warnings.length > 0) {
    suggestions.push({
      id: `suggestion_warnings_${Date.now()}`,
      type: 'fix',
      priority: 'low',
      title: 'Address Policy Warnings',
      description: 'While not blocking, these warnings should be addressed for full compliance.',
      action_steps: verdict.warnings.map(w => `Review: ${w.message}`),
      estimated_effort: 'quick',
      related_violations: verdict.warnings.map(w => w.rule_id),
    });
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    console.log('Copilot suggestion request:', {
      tool_id: body.event?.tool_id,
      violations: body.verdict?.violations?.length,
      warnings: body.verdict?.warnings?.length,
    });

    const validated = SuggestRequestSchema.parse(body);
    const suggestions = await generateSuggestions(
      validated.event,
      validated.verdict,
      validated.rules,
      validated.cfg
    );

    console.log(`Generated ${suggestions.length} suggestions`);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Copilot suggestion error:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: error.issues,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
