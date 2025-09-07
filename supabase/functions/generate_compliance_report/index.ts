import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Input validation schema
const ComplianceReportRequestSchema = z.object({
  project_id: z.string().uuid(),
  enterprise_id: z.string().uuid().optional(),
  workspace_id: z.string().uuid().optional(),
  include_details: z.boolean().default(true),
  compliance_framework: z.string().optional()
});

// Tool compliance status enum
type ToolComplianceStatus = 'approved' | 'needs_review' | 'rejected' | 'unknown';
type OverallComplianceStatus = 'green' | 'yellow' | 'red';

interface ToolUsage {
  id: string;
  tool_name: string;
  vendor_name: string;
  usage_type: string;
  data_processed: string;
  compliance_status: string;
  risk_level: string;
  usage_count: number;
  last_used: string;
  metadata: any;
}

interface PolicyRule {
  id: string;
  rule_type: string;
  rule_name: string;
  conditions: any;
  requirements: any;
  risk_weight: number;
  is_mandatory: boolean;
  enforcement_level: string;
}

interface ComplianceReport {
  project_id: string;
  project_name: string;
  enterprise_id: string;
  generated_at: string;
  overall_status: OverallComplianceStatus;
  compliance_score: number;
  tools_summary: {
    total_tools: number;
    approved_tools: number;
    needs_review_tools: number;
    rejected_tools: number;
    unknown_tools: number;
  };
  tools: Array<{
    tool_name: string;
    vendor_name: string;
    usage_count: number;
    compliance_status: ToolComplianceStatus;
    risk_level: string;
    policy_violations: string[];
    recommendations: string[];
    last_used: string;
  }>;
  policy_violations: Array<{
    rule_name: string;
    violation_type: string;
    severity: string;
    affected_tools: string[];
    description: string;
    remediation: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    action_required: string;
  }>;
  compliance_frameworks: string[];
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    risk_factors: string[];
    mitigation_strategies: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body = req.method === 'GET' ? 
      Object.fromEntries(new URL(req.url).searchParams) : 
      await req.json();
    
    const { project_id, enterprise_id, workspace_id, include_details, compliance_framework } = 
      ComplianceReportRequestSchema.parse(body);

    console.log(`Generating compliance report for project: ${project_id}`);

    // 1. Get project information
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, organization_id, description, status, metadata')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${project_id}`);
    }

    // 2. Get project AI tool usage summary
    const { data: toolUsage, error: usageError } = await supabase
      .from('project_ai_tool_usage')
      .select('*')
      .eq('project_id', project_id)
      .order('last_used', { ascending: false });

    if (usageError) {
      console.error('Error fetching tool usage:', usageError);
      throw new Error('Failed to fetch tool usage data');
    }

    // 3. Get applicable policies for this project's organization
    const { data: policies, error: policiesError } = await supabase
      .from('policies_enhanced')
      .select(`
        id, name, description, policy_rules, risk_scoring, compliance_framework,
        policy_rules:policy_rules(id, rule_type, rule_name, conditions, requirements, risk_weight, is_mandatory, enforcement_level)
      `)
      .eq('organization_id', project.organization_id)
      .eq('status', 'active');

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      throw new Error('Failed to fetch policy data');
    }

    // 4. Process tool usage data
    const tools = (toolUsage || []).map(tool => {
      const complianceResult = evaluateToolCompliance(tool, policies || []);
      return {
        tool_name: tool.tool_name,
        vendor_name: tool.vendor_name || 'Unknown',
        usage_count: tool.usage_count,
        compliance_status: complianceResult.status,
        risk_level: tool.risk_level,
        policy_violations: complianceResult.violations,
        recommendations: complianceResult.recommendations,
        last_used: tool.last_used
      };
    });

    // 5. Calculate overall compliance metrics
    const toolsSummary = {
      total_tools: tools.length,
      approved_tools: tools.filter(t => t.compliance_status === 'approved').length,
      needs_review_tools: tools.filter(t => t.compliance_status === 'needs_review').length,
      rejected_tools: tools.filter(t => t.compliance_status === 'rejected').length,
      unknown_tools: tools.filter(t => t.compliance_status === 'unknown').length
    };

    // 6. Calculate overall compliance score and status
    const complianceScore = calculateComplianceScore(toolsSummary);
    const overallStatus = determineOverallStatus(complianceScore, toolsSummary);

    // 7. Identify policy violations
    const policyViolations = identifyPolicyViolations(tools, policies || []);

    // 8. Generate recommendations
    const recommendations = generateRecommendations(tools, policyViolations, toolsSummary);

    // 9. Assess overall risk
    const riskAssessment = assessOverallRisk(tools, policyViolations);

    // 10. Build the compliance report
    const report: ComplianceReport = {
      project_id,
      project_name: project.name,
      enterprise_id: project.organization_id,
      generated_at: new Date().toISOString(),
      overall_status: overallStatus,
      compliance_score: complianceScore,
      tools_summary: toolsSummary,
      tools: tools,
      policy_violations: policyViolations,
      recommendations: recommendations,
      compliance_frameworks: (policies || []).map(p => p.compliance_framework).filter(Boolean),
      risk_assessment: riskAssessment
    };

    // 11. Save the report to database
    const { error: saveError } = await supabase
      .from('compliance_reports')
      .insert([{
        project_id,
        enterprise_id: project.organization_id,
        workspace_id,
        overall_status,
        compliance_score,
        tools_summary,
        policy_violations,
        recommendations,
        risk_assessment,
        compliance_frameworks: report.compliance_frameworks,
        generated_by: null, // Could be set to current user if available
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }]);

    if (saveError) {
      console.error('Error saving compliance report:', saveError);
      // Don't fail the request, just log the error
    }

    return new Response(JSON.stringify({
      success: true,
      data: report
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating compliance report:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to evaluate tool compliance against policies
function evaluateToolCompliance(tool: any, policies: any[]): {
  status: ToolComplianceStatus;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let status: ToolComplianceStatus = 'unknown';

  // Check against each policy
  for (const policy of policies) {
    if (!policy.policy_rules) continue;

    for (const rule of policy.policy_rules) {
      const ruleResult = evaluateRule(tool, rule);
      if (ruleResult.violated) {
        violations.push(ruleResult.violation);
        if (rule.is_mandatory) {
          status = 'rejected';
        } else if (status !== 'rejected') {
          status = 'needs_review';
        }
      }
      
      if (ruleResult.recommendation) {
        recommendations.push(ruleResult.recommendation);
      }
    }
  }

  // If no violations and we have policy data, mark as approved
  if (violations.length === 0 && policies.length > 0) {
    status = 'approved';
  }

  return { status, violations, recommendations };
}

// Helper function to evaluate a specific rule against a tool
function evaluateRule(tool: any, rule: PolicyRule): {
  violated: boolean;
  violation?: string;
  recommendation?: string;
} {
  const conditions = rule.conditions || {};
  const requirements = rule.requirements || {};

  // Example rule evaluations based on common compliance requirements
  if (rule.rule_type === 'data_handling') {
    if (requirements.requires_approval && tool.compliance_status === 'unknown') {
      return {
        violated: true,
        violation: `Tool ${tool.tool_name} requires approval for data handling`,
        recommendation: `Submit ${tool.tool_name} for compliance review`
      };
    }
  }

  if (rule.rule_type === 'vendor_verification') {
    if (requirements.verified_vendors_only && !isVendorVerified(tool.vendor_name)) {
      return {
        violated: true,
        violation: `Vendor ${tool.vendor_name} is not verified`,
        recommendation: `Verify vendor ${tool.vendor_name} before use`
      };
    }
  }

  if (rule.rule_type === 'risk_assessment') {
    if (tool.risk_level === 'high' && requirements.low_risk_only) {
      return {
        violated: true,
        violation: `Tool ${tool.tool_name} has high risk level`,
        recommendation: `Conduct additional risk assessment for ${tool.tool_name}`
      };
    }
  }

  return { violated: false };
}

// Helper function to check if vendor is verified (simplified)
function isVendorVerified(vendorName: string): boolean {
  const verifiedVendors = ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Amazon'];
  return verifiedVendors.some(vendor => 
    vendorName.toLowerCase().includes(vendor.toLowerCase())
  );
}

// Helper function to calculate compliance score
function calculateComplianceScore(toolsSummary: any): number {
  const { total_tools, approved_tools, needs_review_tools, rejected_tools } = toolsSummary;
  
  if (total_tools === 0) return 100;
  
  const approvedWeight = 1.0;
  const needsReviewWeight = 0.5;
  const rejectedWeight = 0.0;
  
  const weightedScore = (approved_tools * approvedWeight + 
                        needs_review_tools * needsReviewWeight + 
                        rejected_tools * rejectedWeight) / total_tools;
  
  return Math.round(weightedScore * 100);
}

// Helper function to determine overall status
function determineOverallStatus(score: number, toolsSummary: any): OverallComplianceStatus {
  if (toolsSummary.rejected_tools > 0) return 'red';
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

// Helper function to identify policy violations
function identifyPolicyViolations(tools: any[], policies: any[]): any[] {
  const violations: any[] = [];
  
  const violationMap = new Map<string, any>();
  
  tools.forEach(tool => {
    tool.policy_violations.forEach((violation: string) => {
      if (!violationMap.has(violation)) {
        violationMap.set(violation, {
          rule_name: violation,
          violation_type: 'policy_breach',
          severity: 'medium',
          affected_tools: [],
          description: violation,
          remediation: `Address ${violation} for affected tools`
        });
      }
      violationMap.get(violation).affected_tools.push(tool.tool_name);
    });
  });
  
  return Array.from(violationMap.values());
}

// Helper function to generate recommendations
function generateRecommendations(tools: any[], violations: any[], toolsSummary: any): any[] {
  const recommendations: any[] = [];
  
  if (toolsSummary.unknown_tools > 0) {
    recommendations.push({
      priority: 'high',
      category: 'compliance',
      description: `${toolsSummary.unknown_tools} tools have unknown compliance status`,
      action_required: 'Review and approve unknown tools'
    });
  }
  
  if (toolsSummary.needs_review_tools > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'review',
      description: `${toolsSummary.needs_review_tools} tools need compliance review`,
      action_required: 'Complete compliance review process'
    });
  }
  
  if (violations.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'violations',
      description: `${violations.length} policy violations detected`,
      action_required: 'Address policy violations immediately'
    });
  }
  
  return recommendations;
}

// Helper function to assess overall risk
function assessOverallRisk(tools: any[], violations: any[]): any {
  const highRiskTools = tools.filter(t => t.risk_level === 'high').length;
  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  
  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const riskFactors: string[] = [];
  const mitigationStrategies: string[] = [];
  
  if (criticalViolations > 0) {
    overallRisk = 'critical';
    riskFactors.push('Critical policy violations detected');
    mitigationStrategies.push('Immediate remediation required');
  } else if (highRiskTools > 0 || violations.length > 0) {
    overallRisk = 'high';
    riskFactors.push('High-risk tools in use');
    riskFactors.push('Policy violations present');
    mitigationStrategies.push('Implement additional controls');
    mitigationStrategies.push('Regular compliance monitoring');
  } else if (tools.some(t => t.risk_level === 'medium')) {
    overallRisk = 'medium';
    riskFactors.push('Medium-risk tools in use');
    mitigationStrategies.push('Enhanced monitoring recommended');
  }
  
  return {
    overall_risk: overallRisk,
    risk_factors: riskFactors,
    mitigation_strategies: mitigationStrategies
  };
}
