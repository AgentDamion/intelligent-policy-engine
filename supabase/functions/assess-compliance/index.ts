// =============================================================================
// EDGE FUNCTION: Assess Compliance
// PURPOSE: Calculate compliance coverage for workspace or proof bundle
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { collectRequirementEvidence } from '../_shared/evidence-collector.ts';

interface AssessmentRequest {
  target_type: 'workspace' | 'proof_bundle';
  target_id: string;
  frameworks?: string[];
  options?: {
    include_evidence_details?: boolean;
    calculate_gaps?: boolean;
  };
}

interface RequirementResult {
  requirement_id: string;
  requirement_code: string;
  title: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  coverage_percentage: number;
  evidence_found: any[];
  gaps: any[];
  compliance_weight?: number;
}

interface FrameworkAssessment {
  framework_id: string;
  framework_code: string;
  framework_name: string;
  compliance_status: string;
  overall_coverage: number;
  requirement_results: RequirementResult[];
  gaps: any[];
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type',
        },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { target_type, target_id, frameworks, options }: AssessmentRequest = await req.json();

    if (!target_type || !target_id) {
      return new Response(
        JSON.stringify({ error: 'target_type and target_id are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get workspace_id
    let workspaceId: string;
    if (target_type === 'workspace') {
      workspaceId = target_id;
    } else {
      // Get workspace from proof bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('proof_bundles')
        .select('enterprise_id')
        .eq('id', target_id)
        .single();

      if (bundleError || !bundle) {
        return new Response(
          JSON.stringify({ error: 'Proof bundle not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get workspace from enterprise (simplified - would need proper lookup)
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('enterprise_id', bundle.enterprise_id)
        .limit(1)
        .single();

      if (!workspace) {
        return new Response(
          JSON.stringify({ error: 'Workspace not found for proof bundle' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      workspaceId = workspace.id;
    }

    // Get enabled frameworks for workspace
    let frameworksQuery = supabase
      .from('workspace_frameworks')
      .select(`
        framework_id,
        excluded_requirements,
        regulatory_frameworks (
          id,
          name,
          short_name
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('enabled', true);

    if (frameworks && frameworks.length > 0) {
      frameworksQuery = frameworksQuery.in('framework_id', frameworks);
    }

    const { data: workspaceFrameworks, error: frameworksError } = await frameworksQuery;

    if (frameworksError || !workspaceFrameworks || workspaceFrameworks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No enabled frameworks found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const assessments: FrameworkAssessment[] = [];

    // Assess each framework
    for (const wf of workspaceFrameworks) {
      const framework = wf.regulatory_frameworks as any;
      const excludedRequirements = wf.excluded_requirements || [];

      // Get requirements for this framework
      let requirementsQuery = supabase
        .from('framework_requirements')
        .select('*')
        .eq('framework_id', framework.id);

      if (excludedRequirements.length > 0) {
        requirementsQuery = requirementsQuery.not('id', 'in', `(${excludedRequirements.join(',')})`);
      }

      const { data: requirements, error: requirementsError } = await requirementsQuery;

      if (requirementsError || !requirements || requirements.length === 0) {
        continue;
      }

      const requirementResults: RequirementResult[] = [];

      // Assess each requirement
      for (const requirement of requirements) {
        const evidence = await collectRequirementEvidence(
          supabase,
          workspaceId,
          requirement.id,
          target_type === 'proof_bundle' ? target_id : undefined
        );

        // Determine status
        let status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
        if (evidence.coverage_percentage >= 95) {
          status = 'compliant';
        } else if (evidence.coverage_percentage >= 70) {
          status = 'partial';
        } else if (evidence.coverage_percentage > 0) {
          status = 'partial';
        } else {
          status = 'non_compliant';
        }

        // Identify gaps if requested
        const gaps: any[] = [];
        if (options?.calculate_gaps && status !== 'compliant') {
          const requiredEvidence = evidence.evidence_items.filter(item => {
            // Check if this evidence type is required
            // This would need to query requirement_evidence_map
            return true; // Simplified
          });

          const missingEvidence = requiredEvidence.filter(item => !item.meets_requirement);
          if (missingEvidence.length > 0) {
            gaps.push({
              gap_type: 'missing_evidence',
              description: `Missing evidence from ${missingEvidence.map(e => e.source).join(', ')}`,
              severity: requirement.is_critical ? 'high' : 'medium'
            });
          }
        }

        requirementResults.push({
          requirement_id: requirement.id,
          requirement_code: requirement.requirement_code,
          title: requirement.title,
          status,
          coverage_percentage: evidence.coverage_percentage,
          evidence_found: options?.include_evidence_details ? evidence.evidence_items : [],
          gaps,
          compliance_weight: requirement.compliance_weight
        });
      }

      // Calculate overall coverage
      const overallCoverage = calculateOverallCoverage(requirementResults);
      const complianceStatus = determineStatus(overallCoverage, requirementResults);

      // Identify top gaps
      const allGaps = requirementResults
        .flatMap(r => r.gaps.map(g => ({ ...g, requirement_code: r.requirement_code, requirement_title: r.title })))
        .sort((a, b) => {
          const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                 (severityOrder[a.severity as keyof typeof severityOrder] || 0);
        })
        .slice(0, 10);

      assessments.push({
        framework_id: framework.id,
        framework_code: framework.short_name,
        framework_name: framework.name,
        compliance_status: complianceStatus,
        overall_coverage: overallCoverage,
        requirement_results: requirementResults,
        gaps: allGaps
      });

      // Store assessment results if target is proof bundle
      if (target_type === 'proof_bundle') {
        await supabase
          .from('proof_bundle_compliance')
          .upsert({
            proof_bundle_id: target_id,
            framework_id: framework.id,
            compliance_status: complianceStatus,
            overall_coverage_percentage: overallCoverage,
            requirement_results: {
              requirements: requirementResults.map(r => ({
                requirement_id: r.requirement_id,
                requirement_code: r.requirement_code,
                title: r.title,
                status: r.status,
                coverage_percentage: r.coverage_percentage
              })),
              summary: {
                total_requirements: requirementResults.length,
                compliant: requirementResults.filter(r => r.status === 'compliant').length,
                partial: requirementResults.filter(r => r.status === 'partial').length,
                non_compliant: requirementResults.filter(r => r.status === 'non_compliant').length
              }
            },
            evidence_collected: {
              evidence_items: requirementResults.flatMap(r => r.evidence_found)
            },
            gaps: allGaps,
            recommendations: generateRecommendations(allGaps),
            assessed_at: new Date().toISOString(),
            assessed_by: 'system',
            assessment_version: '1.0'
          }, {
            onConflict: 'proof_bundle_id,framework_id'
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          target_type,
          target_id,
          assessed_at: new Date().toISOString(),
          assessments
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Assessment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateOverallCoverage(results: RequirementResult[]): number {
  if (results.length === 0) return 0;

  const totalWeight = results.reduce((sum, r) => sum + (r.compliance_weight || 1), 0);
  const weightedCoverage = results.reduce((sum, r) => {
    const weight = r.compliance_weight || 1;
    return sum + (r.coverage_percentage * weight);
  }, 0);

  return totalWeight > 0 ? weightedCoverage / totalWeight : 0;
}

function determineStatus(coverage: number, results: RequirementResult[]): string {
  // Check for critical requirement failures
  const criticalFailures = results.filter(r => 
    r.compliance_weight && r.compliance_weight >= 8 && r.status !== 'compliant'
  );

  if (criticalFailures.length > 0) {
    return 'non_compliant';
  }

  if (coverage >= 95) return 'compliant';
  if (coverage >= 70) return 'partial';
  return 'non_compliant';
}

function generateRecommendations(gaps: any[]): string[] {
  const recommendations: string[] = [];

  gaps.forEach(gap => {
    if (gap.gap_type === 'missing_evidence') {
      recommendations.push(`Configure ${gap.description} to address ${gap.requirement_code}`);
    }
  });

  return recommendations.slice(0, 5); // Top 5 recommendations
}

