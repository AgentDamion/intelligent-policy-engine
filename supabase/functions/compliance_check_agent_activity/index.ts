import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Define types for compliance checking
interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: 'success' | 'warning' | 'error' | 'running';
  project_id?: string | null;
  workspace_id?: string | null;
  enterprise_id?: string | null;
  details?: Record<string, unknown>;
  created_at: string;
}

interface PolicyRule {
  id: string;
  rule_type: string;
  rule_name: string;
  conditions: Record<string, any>;
  requirements: Record<string, any>;
  risk_weight: number;
  is_mandatory: boolean;
  enforcement_level: string;
}

interface Policy {
  id: string;
  organization_id: string;
  name: string;
  policy_rules: PolicyRule[];
  compliance_framework: string;
  status: string;
}

interface ComplianceViolation {
  id?: string;
  organization_id: string;
  policy_id: string;
  partner_id?: string | null;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  corrective_actions?: string[];
  resolution_notes?: string;
  resolved_at?: string;
}

interface ComplianceCheck {
  id?: string;
  organization_id: string;
  policy_id: string;
  partner_id?: string | null;
  check_type: 'automated' | 'manual' | 'scheduled';
  check_date: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  score: number;
  findings: Record<string, any>;
  recommendations: string[];
  next_check_date?: string;
}

interface Alert {
  id?: string;
  organization_id: string;
  alert_type: 'compliance_violation' | 'policy_breach' | 'risk_escalation' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

// Input validation schema
const ComplianceCheckRequestSchema = z.object({
  activity_id: z.string().uuid(),
  trigger_type: z.enum(['insert', 'update', 'manual']).default('insert'),
  force_check: z.boolean().default(false)
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { activity_id, trigger_type, force_check } = ComplianceCheckRequestSchema.parse(body);

    console.log(`Running compliance check for activity: ${activity_id}`);

    // 1. Get the agent activity
    const { data: activity, error: activityError } = await supabase
      .from('agent_activities')
      .select('*')
      .eq('id', activity_id)
      .single();

    if (activityError || !activity) {
      throw new Error(`Activity not found: ${activity_id}`);
    }

    // 2. Get organization context
    const organizationId = await getOrganizationId(supabase, activity);
    if (!organizationId) {
      console.log('No organization context found, skipping compliance check');
      return new Response(JSON.stringify({
        success: true,
        message: 'No organization context found, compliance check skipped',
        activity_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Get applicable policies for the organization
    const { data: policies, error: policiesError } = await supabase
      .from('policies_enhanced')
      .select(`
        id, organization_id, name, policy_rules, compliance_framework, status,
        policy_rules:policy_rules(
          id, rule_type, rule_name, conditions, requirements, 
          risk_weight, is_mandatory, enforcement_level
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      throw new Error('Failed to fetch policies');
    }

    if (!policies || policies.length === 0) {
      console.log('No active policies found for organization');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active policies found, compliance check completed',
        activity_id,
        organization_id: organizationId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Run compliance checks against all applicable policies
    const complianceResults = await runComplianceChecks(supabase, activity, policies, organizationId);

    // 5. Generate alerts for violations
    const alerts = await generateAlerts(supabase, activity, complianceResults, organizationId);

    // 6. Log audit trail
    await logAuditTrail(supabase, activity, complianceResults, organizationId);

    return new Response(JSON.stringify({
      success: true,
      activity_id,
      organization_id: organizationId,
      policies_checked: policies.length,
      violations_found: complianceResults.violations.length,
      alerts_generated: alerts.length,
      compliance_results: complianceResults,
      alerts: alerts,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in compliance check function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to get organization ID from activity context
async function getOrganizationId(supabase: SupabaseClient, activity: AgentActivity): Promise<string | null> {
  // Try to get from enterprise_id first
  if (activity.enterprise_id) {
    return activity.enterprise_id;
  }

  // Try to get from project context
  if (activity.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', activity.project_id)
      .single();
    
    if (project?.organization_id) {
      return project.organization_id;
    }
  }

  // Try to get from workspace context
  if (activity.workspace_id) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', activity.workspace_id)
      .single();
    
    if (workspace?.organization_id) {
      return workspace.organization_id;
    }
  }

  return null;
}

// Main compliance checking logic
async function runComplianceChecks(
  supabase: SupabaseClient, 
  activity: AgentActivity, 
  policies: Policy[], 
  organizationId: string
): Promise<{
  violations: ComplianceViolation[];
  checks: ComplianceCheck[];
  overall_score: number;
  risk_level: string;
}> {
  const violations: ComplianceViolation[] = [];
  const checks: ComplianceCheck[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  for (const policy of policies) {
    if (!policy.policy_rules || policy.policy_rules.length === 0) continue;

    for (const rule of policy.policy_rules) {
      const ruleResult = await evaluateRule(supabase, activity, rule, policy);
      
      // Create compliance check record
      const check: ComplianceCheck = {
        organization_id: organizationId,
        policy_id: policy.id,
        partner_id: null, // Could be derived from activity context
        check_type: 'automated',
        check_date: new Date().toISOString(),
        status: ruleResult.violated ? 'failed' : 'passed',
        score: ruleResult.score,
        findings: ruleResult.findings,
        recommendations: ruleResult.recommendations
      };

      checks.push(check);

      // If rule was violated, create violation record
      if (ruleResult.violated) {
        const violation: ComplianceViolation = {
          organization_id: organizationId,
          policy_id: policy.id,
          partner_id: null,
          violation_type: 'policy_breach',
          severity: ruleResult.severity,
          description: ruleResult.violation_description,
          detected_at: new Date().toISOString(),
          status: 'open',
          corrective_actions: ruleResult.corrective_actions
        };

        violations.push(violation);
      }

      // Calculate weighted score
      const weight = rule.risk_weight || 1;
      totalScore += ruleResult.score * weight;
      totalWeight += weight;
    }
  }

  // Calculate overall compliance score
  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 100;
  
  // Determine risk level
  const riskLevel = determineRiskLevel(overallScore, violations);

  // Save compliance checks to database
  if (checks.length > 0) {
    const { error: checksError } = await supabase
      .from('compliance_checks')
      .insert(checks);
    
    if (checksError) {
      console.error('Error saving compliance checks:', checksError);
    }
  }

  // Save violations to database
  if (violations.length > 0) {
    const { error: violationsError } = await supabase
      .from('compliance_violations')
      .insert(violations);
    
    if (violationsError) {
      console.error('Error saving compliance violations:', violationsError);
    }
  }

  return {
    violations,
    checks,
    overall_score: overallScore,
    risk_level: riskLevel
  };
}

// Evaluate a specific rule against an activity
async function evaluateRule(
  supabase: SupabaseClient,
  activity: AgentActivity, 
  rule: PolicyRule, 
  policy: Policy
): Promise<{
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
}> {
  const conditions = rule.conditions || {};
  const requirements = rule.requirements || {};
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  // Rule type: data_handling
  if (rule.rule_type === 'data_handling') {
    const result = evaluateDataHandlingRule(activity, conditions, requirements);
    violated = result.violated;
    score = result.score;
    severity = result.severity;
    violation_description = result.violation_description || '';
    corrective_actions = result.corrective_actions || [];
    Object.assign(findings, result.findings);
    recommendations.push(...(result.recommendations || []));
  }

  // Rule type: content_creation
  else if (rule.rule_type === 'content_creation') {
    const result = evaluateContentCreationRule(activity, conditions, requirements);
    violated = result.violated;
    score = result.score;
    severity = result.severity;
    violation_description = result.violation_description || '';
    corrective_actions = result.corrective_actions || [];
    Object.assign(findings, result.findings);
    recommendations.push(...(result.recommendations || []));
  }

  // Rule type: tool_approval
  else if (rule.rule_type === 'tool_approval') {
    const result = evaluateToolApprovalRule(activity, conditions, requirements);
    violated = result.violated;
    score = result.score;
    severity = result.severity;
    violation_description = result.violation_description || '';
    corrective_actions = result.corrective_actions || [];
    Object.assign(findings, result.findings);
    recommendations.push(...(result.recommendations || []));
  }

  // Rule type: disclosure
  else if (rule.rule_type === 'disclosure') {
    const result = evaluateDisclosureRule(activity, conditions, requirements);
    violated = result.violated;
    score = result.score;
    severity = result.severity;
    violation_description = result.violation_description || '';
    corrective_actions = result.corrective_actions || [];
    Object.assign(findings, result.findings);
    recommendations.push(...(result.recommendations || []));
  }

  // Rule type: risk_assessment
  else if (rule.rule_type === 'risk_assessment') {
    const result = evaluateRiskAssessmentRule(activity, conditions, requirements);
    violated = result.violated;
    score = result.score;
    severity = result.severity;
    violation_description = result.violation_description || '';
    corrective_actions = result.corrective_actions || [];
    Object.assign(findings, result.findings);
    recommendations.push(...(result.recommendations || []));
  }

  // Default rule evaluation
  else {
    const result = evaluateGenericRule(activity, rule, conditions, requirements);
    violated = result.violated;
    score = result.score;
    severity = result.severity;
    violation_description = result.violation_description || '';
    corrective_actions = result.corrective_actions || [];
    Object.assign(findings, result.findings);
    recommendations.push(...(result.recommendations || []));
  }

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Data handling rule evaluation
function evaluateDataHandlingRule(
  activity: AgentActivity, 
  conditions: Record<string, any>, 
  requirements: Record<string, any>
): {
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
} {
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  // Check if activity involves sensitive data
  const activityDetails = activity.details || {};
  const hasSensitiveData = checkForSensitiveData(activityDetails);
  
  findings.has_sensitive_data = hasSensitiveData;
  findings.data_types = extractDataTypes(activityDetails);

  if (hasSensitiveData) {
    // Check encryption requirements
    if (requirements.requires_encryption && !activityDetails.encrypted) {
      violated = true;
      score = 60;
      severity = 'high';
      violation_description = 'Sensitive data processing without encryption';
      corrective_actions.push('Implement encryption for sensitive data processing');
      recommendations.push('Enable encryption for all sensitive data operations');
    }

    // Check access controls
    if (requirements.requires_access_controls && !activityDetails.access_controlled) {
      violated = true;
      score = Math.min(score, 70);
      severity = severity === 'critical' ? 'critical' : 'high';
      violation_description = 'Sensitive data access without proper controls';
      corrective_actions.push('Implement proper access controls');
      recommendations.push('Review and implement access control policies');
    }

    // Check data retention policies
    if (requirements.data_retention_limit && activityDetails.retention_period > requirements.data_retention_limit) {
      violated = true;
      score = Math.min(score, 80);
      severity = severity === 'critical' ? 'critical' : 'medium';
      violation_description = 'Data retention exceeds policy limits';
      corrective_actions.push('Adjust data retention period');
      recommendations.push('Review data retention policies');
    }
  }

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Content creation rule evaluation
function evaluateContentCreationRule(
  activity: AgentActivity, 
  conditions: Record<string, any>, 
  requirements: Record<string, any>
): {
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
} {
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  // Check for medical claims
  if (requirements.no_medical_claims && containsMedicalClaims(activity.details)) {
    violated = true;
    score = 40;
    severity = 'critical';
    violation_description = 'Content contains unauthorized medical claims';
    corrective_actions.push('Remove medical claims from content');
    recommendations.push('Review content for medical claim compliance');
  }

  // Check for AI disclosure
  if (requirements.ai_disclosure_required && activity.agent.includes('ai') && !activity.details?.ai_disclosed) {
    violated = true;
    score = Math.min(score, 70);
    severity = severity === 'critical' ? 'critical' : 'high';
    violation_description = 'AI-generated content without proper disclosure';
    corrective_actions.push('Add AI disclosure to content');
    recommendations.push('Implement AI disclosure requirements');
  }

  // Check for balanced presentation
  if (requirements.balanced_presentation_required && !isBalancedPresentation(activity.details)) {
    violated = true;
    score = Math.min(score, 80);
    severity = severity === 'critical' ? 'critical' : 'medium';
    violation_description = 'Content lacks balanced presentation';
    corrective_actions.push('Ensure balanced presentation in content');
    recommendations.push('Review content for balanced presentation');
  }

  findings.content_type = activity.action;
  findings.has_medical_claims = containsMedicalClaims(activity.details);
  findings.ai_disclosed = activity.details?.ai_disclosed || false;
  findings.balanced_presentation = isBalancedPresentation(activity.details);

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Tool approval rule evaluation
function evaluateToolApprovalRule(
  activity: AgentActivity, 
  conditions: Record<string, any>, 
  requirements: Record<string, any>
): {
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
} {
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  const toolName = activity.details?.tool_name || activity.agent;
  const isApprovedTool = checkToolApproval(toolName, requirements);

  findings.tool_name = toolName;
  findings.is_approved = isApprovedTool;

  if (requirements.requires_approval && !isApprovedTool) {
    violated = true;
    score = 30;
    severity = 'critical';
    violation_description = `Unauthorized tool usage: ${toolName}`;
    corrective_actions.push(`Get approval for tool: ${toolName}`);
    recommendations.push('Submit tool for compliance approval');
  }

  if (requirements.verified_vendors_only && !isVendorVerified(toolName)) {
    violated = true;
    score = Math.min(score, 50);
    severity = severity === 'critical' ? 'critical' : 'high';
    violation_description = `Unverified vendor tool: ${toolName}`;
    corrective_actions.push(`Verify vendor for tool: ${toolName}`);
    recommendations.push('Verify vendor compliance');
  }

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Disclosure rule evaluation
function evaluateDisclosureRule(
  activity: AgentActivity, 
  conditions: Record<string, any>, 
  requirements: Record<string, any>
): {
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
} {
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  // Check for required disclosures
  if (requirements.patient_consent_required && !activity.details?.patient_consent) {
    violated = true;
    score = 60;
    severity = 'high';
    violation_description = 'Patient consent not obtained';
    corrective_actions.push('Obtain proper patient consent');
    recommendations.push('Implement patient consent procedures');
  }

  if (requirements.adverse_event_reporting && activity.details?.adverse_event && !activity.details?.reported) {
    violated = true;
    score = Math.min(score, 40);
    severity = 'critical';
    violation_description = 'Adverse event not reported';
    corrective_actions.push('Report adverse event immediately');
    recommendations.push('Implement adverse event reporting procedures');
  }

  findings.patient_consent = activity.details?.patient_consent || false;
  findings.adverse_event_reported = activity.details?.adverse_event_reported || false;

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Risk assessment rule evaluation
function evaluateRiskAssessmentRule(
  activity: AgentActivity, 
  conditions: Record<string, any>, 
  requirements: Record<string, any>
): {
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
} {
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  const riskLevel = calculateActivityRisk(activity);
  findings.risk_level = riskLevel;
  findings.risk_factors = identifyRiskFactors(activity);

  if (requirements.max_risk_level && riskLevel > requirements.max_risk_level) {
    violated = true;
    score = 100 - (riskLevel * 10);
    severity = riskLevel > 0.8 ? 'critical' : riskLevel > 0.6 ? 'high' : 'medium';
    violation_description = `Activity risk level ${riskLevel} exceeds maximum allowed ${requirements.max_risk_level}`;
    corrective_actions.push('Conduct additional risk assessment');
    recommendations.push('Implement risk mitigation measures');
  }

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Generic rule evaluation
function evaluateGenericRule(
  activity: AgentActivity, 
  rule: PolicyRule, 
  conditions: Record<string, any>, 
  requirements: Record<string, any>
): {
  violated: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_description?: string;
  corrective_actions?: string[];
  findings: Record<string, any>;
  recommendations: string[];
} {
  const findings: Record<string, any> = {};
  const recommendations: string[] = [];
  let violated = false;
  let score = 100;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let violation_description = '';
  let corrective_actions: string[] = [];

  // Basic rule evaluation based on conditions and requirements
  findings.rule_name = rule.rule_name;
  findings.rule_type = rule.rule_type;
  findings.enforcement_level = rule.enforcement_level;

  // Check if conditions are met
  const conditionsMet = evaluateConditions(activity, conditions);
  findings.conditions_met = conditionsMet;

  if (conditionsMet) {
    // Check if requirements are satisfied
    const requirementsSatisfied = evaluateRequirements(activity, requirements);
    findings.requirements_satisfied = requirementsSatisfied;

    if (!requirementsSatisfied) {
      violated = true;
      score = 50;
      severity = rule.is_mandatory ? 'high' : 'medium';
      violation_description = `Rule requirements not satisfied: ${rule.rule_name}`;
      corrective_actions.push(`Address requirements for rule: ${rule.rule_name}`);
      recommendations.push(`Review and comply with rule: ${rule.rule_name}`);
    }
  }

  return {
    violated,
    score,
    severity,
    violation_description,
    corrective_actions,
    findings,
    recommendations
  };
}

// Helper functions for rule evaluation
function checkForSensitiveData(details: Record<string, any>): boolean {
  const sensitiveKeywords = ['patient', 'medical', 'health', 'personal', 'private', 'confidential'];
  const detailsStr = JSON.stringify(details).toLowerCase();
  return sensitiveKeywords.some(keyword => detailsStr.includes(keyword));
}

function extractDataTypes(details: Record<string, any>): string[] {
  const dataTypes: string[] = [];
  if (details.patient_data) dataTypes.push('patient_data');
  if (details.medical_records) dataTypes.push('medical_records');
  if (details.personal_info) dataTypes.push('personal_info');
  if (details.financial_data) dataTypes.push('financial_data');
  return dataTypes;
}

function containsMedicalClaims(details: Record<string, any>): boolean {
  const medicalKeywords = ['cure', 'treat', 'heal', 'effective', 'proven', 'clinical'];
  const detailsStr = JSON.stringify(details).toLowerCase();
  return medicalKeywords.some(keyword => detailsStr.includes(keyword));
}

function isBalancedPresentation(details: Record<string, any>): boolean {
  // Simple check for balanced presentation indicators
  return details.balanced_presentation === true || 
         details.risks_mentioned === true || 
         details.benefits_mentioned === true;
}

function checkToolApproval(toolName: string, requirements: Record<string, any>): boolean {
  const approvedTools = requirements.approved_tools || [];
  return approvedTools.includes(toolName);
}

function isVendorVerified(toolName: string): boolean {
  const verifiedVendors = ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Amazon', 'Meta'];
  return verifiedVendors.some(vendor => 
    toolName.toLowerCase().includes(vendor.toLowerCase())
  );
}

function calculateActivityRisk(activity: AgentActivity): number {
  let risk = 0.1; // Base risk

  // Increase risk based on activity type
  if (activity.action.includes('generate') || activity.action.includes('create')) {
    risk += 0.2;
  }
  if (activity.action.includes('process') || activity.action.includes('analyze')) {
    risk += 0.3;
  }
  if (activity.status === 'error') {
    risk += 0.4;
  }

  // Increase risk based on details
  const details = activity.details || {};
  if (details.sensitive_data) risk += 0.3;
  if (details.external_api) risk += 0.2;
  if (details.ai_generated) risk += 0.1;

  return Math.min(risk, 1.0);
}

function identifyRiskFactors(activity: AgentActivity): string[] {
  const factors: string[] = [];
  const details = activity.details || {};

  if (details.sensitive_data) factors.push('sensitive_data_processing');
  if (details.external_api) factors.push('external_api_usage');
  if (details.ai_generated) factors.push('ai_generated_content');
  if (activity.status === 'error') factors.push('error_state');
  if (activity.action.includes('generate')) factors.push('content_generation');

  return factors;
}

function evaluateConditions(activity: AgentActivity, conditions: Record<string, any>): boolean {
  // Simple condition evaluation - can be extended
  if (conditions.agent_type && !activity.agent.includes(conditions.agent_type)) {
    return false;
  }
  if (conditions.action_type && !activity.action.includes(conditions.action_type)) {
    return false;
  }
  return true;
}

function evaluateRequirements(activity: AgentActivity, requirements: Record<string, any>): boolean {
  // Simple requirement evaluation - can be extended
  const details = activity.details || {};
  
  for (const [key, value] of Object.entries(requirements)) {
    if (details[key] !== value) {
      return false;
    }
  }
  
  return true;
}

function determineRiskLevel(score: number, violations: ComplianceViolation[]): string {
  if (violations.some(v => v.severity === 'critical')) return 'critical';
  if (violations.some(v => v.severity === 'high')) return 'high';
  if (score < 60) return 'high';
  if (score < 80) return 'medium';
  return 'low';
}

// Generate alerts for violations
async function generateAlerts(
  supabase: SupabaseClient,
  activity: AgentActivity,
  complianceResults: any,
  organizationId: string
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Generate alerts for violations
  for (const violation of complianceResults.violations) {
    const alert: Alert = {
      organization_id: organizationId,
      alert_type: 'compliance_violation',
      severity: violation.severity,
      title: `Compliance Violation: ${violation.description}`,
      description: `Policy violation detected in agent activity: ${activity.agent} - ${activity.action}`,
      entity_type: 'agent_activity',
      entity_id: activity.id,
      metadata: {
        activity_id: activity.id,
        policy_id: violation.policy_id,
        violation_id: violation.id,
        agent: activity.agent,
        action: activity.action,
        violation_type: violation.violation_type
      },
      status: 'active',
      created_at: new Date().toISOString()
    };

    alerts.push(alert);
  }

  // Generate risk escalation alert if overall risk is high
  if (complianceResults.risk_level === 'high' || complianceResults.risk_level === 'critical') {
    const alert: Alert = {
      organization_id: organizationId,
      alert_type: 'risk_escalation',
      severity: complianceResults.risk_level,
      title: `High Risk Activity Detected`,
      description: `Agent activity ${activity.agent} - ${activity.action} has been flagged as high risk`,
      entity_type: 'agent_activity',
      entity_id: activity.id,
      metadata: {
        activity_id: activity.id,
        risk_level: complianceResults.risk_level,
        compliance_score: complianceResults.overall_score,
        agent: activity.agent,
        action: activity.action
      },
      status: 'active',
      created_at: new Date().toISOString()
    };

    alerts.push(alert);
  }

  // Save alerts to database (assuming alerts table exists)
  if (alerts.length > 0) {
    const { error: alertsError } = await supabase
      .from('alerts')
      .insert(alerts);
    
    if (alertsError) {
      console.error('Error saving alerts:', alertsError);
    }
  }

  return alerts;
}

// Log audit trail
async function logAuditTrail(
  supabase: SupabaseClient,
  activity: AgentActivity,
  complianceResults: any,
  organizationId: string
): Promise<void> {
  const auditEntry = {
    organization_id: organizationId,
    user_id: null, // Could be derived from activity context
    action: 'compliance_check_completed',
    entity_type: 'agent_activity',
    entity_id: activity.id,
    details: {
      activity_agent: activity.agent,
      activity_action: activity.action,
      policies_checked: complianceResults.checks.length,
      violations_found: complianceResults.violations.length,
      overall_score: complianceResults.overall_score,
      risk_level: complianceResults.risk_level
    },
    risk_level: complianceResults.risk_level,
    created_at: new Date().toISOString()
  };

  const { error: auditError } = await supabase
    .from('audit_logs_enhanced')
    .insert([auditEntry]);

  if (auditError) {
    console.error('Error logging audit trail:', auditError);
  }
}
