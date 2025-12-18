import { supabase } from "@/integrations/supabase/client";
import type { SandboxRunInput } from "@/types/sandbox";

/**
 * Seed 3 sample simulation runs to demonstrate the sandbox
 */
export async function seedSampleSimulations(workspaceId: string, enterpriseId: string) {
  console.log('Checking for existing sandbox runs...');

  try {
    // Check if sample simulations already exist
    const { data: existingRuns } = await supabase
      .from('sandbox_runs')
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1);

    if (existingRuns && existingRuns.length > 0) {
      console.log('Sample simulations already exist');
      return;
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Get tool versions for the sample runs
    const { data: toolVersions } = await supabase
      .from('ai_tool_versions')
      .select('id, version, tool_id, ai_tool_registry(name)')
      .limit(10);

    if (!toolVersions || toolVersions.length < 3) {
      console.error('Not enough tool versions available for sample simulations');
      return;
    }

    // Get a policy instance for validation
    const { data: policyInstances } = await supabase
      .from('policy_instances')
      .select('id')
      .eq('enterprise_id', enterpriseId)
      .limit(1);

    const policyId = policyInstances?.[0]?.id;

    // Sample simulations with realistic data
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sampleRuns = [
      // Run 1: Passed with high compliance
      {
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        run_by: user.id,
        policy_id: policyId,
        tool_version_id: toolVersions[0]?.id,
        scenario_name: 'Customer Support Chatbot Test',
        inputs_json: {
          use_case: 'Customer Support Chatbot',
          data_classification: ['customer_data'],
          jurisdiction: ['US'],
          user_role: 'developer',
          test_scenario: {
            description: 'Testing chatbot for customer support inquiries',
            inputs: { query: 'How do I reset my password?' },
            expected_outcome: 'approve'
          }
        },
        outputs_json: {
          compliance_score: 92,
          validation_result: 'pass',
          allowed: true,
          risk_flags: [],
          warnings: [
            {
              code: 'DATA_RETENTION',
              message: 'Ensure customer data is retained per policy',
              severity: 'low'
            }
          ],
          violations: [],
          policy_matched: true,
          controls_applied: 'standard',
          processing_time_ms: 234
        },
        control_level: 'standard',
        enforcement_level: 'advisory',
        status: 'completed',
        validation_result: 'allowed',
        compliance_score: 92,
        risk_flags: [],
        proof_hash: 'sha256:' + Math.random().toString(36).substring(7),
        metadata: { is_sample: true },
        created_at: oneDayAgo.toISOString(),
        updated_at: oneDayAgo.toISOString()
      },
      // Run 2: Passed with warnings
      {
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        run_by: user.id,
        policy_id: policyId,
        tool_version_id: toolVersions[1]?.id,
        scenario_name: 'Code Review Assistant Test',
        inputs_json: {
          use_case: 'Code Review Assistant',
          data_classification: ['source_code'],
          jurisdiction: ['US'],
          user_role: 'developer',
          test_scenario: {
            description: 'Code review for pull request',
            inputs: { pr_number: '123', files_changed: 12 },
            expected_outcome: 'approve'
          }
        },
        outputs_json: {
          compliance_score: 78,
          validation_result: 'pass',
          allowed: true,
          risk_flags: ['data_exposure_risk'],
          warnings: [
            {
              code: 'PII_HANDLING',
              message: 'Potential PII detected in code comments',
              severity: 'medium'
            },
            {
              code: 'EXTERNAL_API',
              message: 'External API usage detected - verify compliance',
              severity: 'medium'
            },
            {
              code: 'LOGGING_DEPTH',
              message: 'Consider reducing logging verbosity',
              severity: 'low'
            }
          ],
          violations: [],
          policy_matched: true,
          controls_applied: 'standard',
          processing_time_ms: 456
        },
        control_level: 'standard',
        enforcement_level: 'advisory',
        status: 'completed',
        validation_result: 'allowed_with_warnings',
        compliance_score: 78,
        risk_flags: ['data_exposure_risk'],
        proof_hash: 'sha256:' + Math.random().toString(36).substring(7),
        metadata: { is_sample: true },
        created_at: threeDaysAgo.toISOString(),
        updated_at: threeDaysAgo.toISOString()
      },
      // Run 3: Failed with violations
      {
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        run_by: user.id,
        policy_id: policyId,
        tool_version_id: toolVersions[2]?.id,
        scenario_name: 'Marketing Content Generation Test',
        inputs_json: {
          use_case: 'Marketing Content Generation',
          data_classification: ['marketing_data'],
          jurisdiction: ['EU'],
          user_role: 'marketer',
          test_scenario: {
            description: 'Generate social media content with DALL-E',
            inputs: { topic: 'New product launch' },
            expected_outcome: 'approve'
          }
        },
        outputs_json: {
          compliance_score: 45,
          validation_result: 'fail',
          allowed: false,
          risk_flags: ['policy_violation', 'unapproved_tool'],
          warnings: [],
          violations: [
            {
              code: 'NO_APPROVED_POLICY',
              message: 'No approved policy exists for this use case',
              severity: 'critical',
              policy_reference: 'POLICY-IMG-001'
            },
            {
              code: 'JURISDICTION_MISMATCH',
              message: 'Tool not approved for EU jurisdiction',
              severity: 'high',
              policy_reference: 'POLICY-GEO-002'
            }
          ],
          policy_matched: false,
          controls_applied: 'strict',
          processing_time_ms: 189
        },
        control_level: 'strict',
        enforcement_level: 'blocking',
        status: 'failed',
        validation_result: 'blocked',
        compliance_score: 45,
        risk_flags: ['policy_violation', 'unapproved_tool'],
        proof_hash: 'sha256:' + Math.random().toString(36).substring(7),
        metadata: { is_sample: true },
        created_at: oneWeekAgo.toISOString(),
        updated_at: oneWeekAgo.toISOString()
      }
    ];

    // Insert sample runs
    const { error } = await supabase
      .from('sandbox_runs')
      .insert(sampleRuns);

    if (error) {
      console.error('Error inserting sample simulations:', error);
      return;
    }

    console.log('Sample simulations seeded successfully');
  } catch (error) {
    console.error('Error seeding sample simulations:', error);
  }
}

/**
 * Clear all sample simulation runs
 */
export async function clearSampleSimulations(workspaceId: string) {
  try {
    const { error } = await supabase
      .from('sandbox_runs')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('metadata->>is_sample', 'true');

    if (error) {
      console.error('Error clearing sample simulations:', error);
      return false;
    }

    console.log('Sample simulations cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing sample simulations:', error);
    return false;
  }
}
