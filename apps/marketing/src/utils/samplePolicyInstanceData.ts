import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const insertSamplePolicyInstanceData = async () => {
  try {
    // Check if data already exists
    const { data: existingTools } = await supabase
      .from('ai_tool_registry')
      .select('id')
      .limit(1);

    if (existingTools && existingTools.length > 0) {
      console.log('Sample policy instance data already exists');
      toast.info('Sample data already loaded');
      return;
    }

    // Get current user's enterprise
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('No authenticated user found');
      return;
    }

    const { data: userEnterprises } = await supabase
      .from('enterprise_members')
      .select('enterprise_id')
      .eq('user_id', user.id);

    const enterpriseId = userEnterprises?.[0]?.enterprise_id;
    if (!enterpriseId) {
      toast.error('No enterprise found for user');
      return;
    }

    // Insert AI Tools
    const tools = [
      { name: 'ChatGPT', provider: 'OpenAI', category: 'llm' },
      { name: 'Claude', provider: 'Anthropic', category: 'llm' },
      { name: 'GitHub Copilot', provider: 'GitHub', category: 'code_assist' },
      { name: 'DALL-E', provider: 'OpenAI', category: 'image_gen' }
    ];

    const { data: insertedTools, error: toolsError } = await supabase
      .from('ai_tool_registry')
      .insert(tools)
      .select();

    if (toolsError) throw toolsError;

    // Insert Tool Versions
    const versions = [
      { tool_id: insertedTools[0].id, version: 'gpt-4', release_date: '2023-03-14T00:00:00Z', capabilities: { max_tokens: 8192, multimodal: false }, known_limitations: ['Training cutoff 2023-04'] },
      { tool_id: insertedTools[0].id, version: 'gpt-4-turbo', release_date: '2024-04-09T00:00:00Z', capabilities: { max_tokens: 128000, multimodal: true }, known_limitations: [] },
      { tool_id: insertedTools[1].id, version: 'claude-3-opus', release_date: '2024-03-04T00:00:00Z', capabilities: { max_tokens: 200000, multimodal: true }, known_limitations: [] },
      { tool_id: insertedTools[1].id, version: 'claude-3.5-sonnet', release_date: '2024-06-20T00:00:00Z', capabilities: { max_tokens: 200000, multimodal: true }, known_limitations: [] },
      { tool_id: insertedTools[2].id, version: 'copilot-v1', release_date: '2023-06-01T00:00:00Z', capabilities: { languages: ['python', 'javascript', 'typescript'] }, known_limitations: ['Limited context window'] },
      { tool_id: insertedTools[3].id, version: 'dall-e-3', release_date: '2023-10-01T00:00:00Z', capabilities: { resolution: '1024x1024', styles: ['vivid', 'natural'] }, known_limitations: [] }
    ];

    const { data: insertedVersions, error: versionsError } = await supabase
      .from('ai_tool_versions')
      .insert(versions)
      .select();

    if (versionsError) throw versionsError;

    // Get workspace
    const { data: userWorkspaces } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1);

    const workspaceId = userWorkspaces?.[0]?.workspace_id;

    // Insert Policy Instances
    const instances = [
      {
        tool_version_id: insertedVersions[0].id,
        use_case: 'Customer Support Chatbot',
        jurisdiction: ['US', 'EU'],
        audience: ['customer_support', 'sales'],
        pom: {
          purpose: 'Automate customer support responses',
          data_sources: ['customer_database', 'knowledge_base'],
          controls: ['no_pii_storage', 'human_review_required']
        },
        status: 'active',
        enterprise_id: enterpriseId,
        workspace_id: workspaceId,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      },
      {
        tool_version_id: insertedVersions[1].id,
        use_case: 'Code Review Assistant',
        jurisdiction: ['US'],
        audience: ['engineering'],
        pom: {
          purpose: 'Assist in code review process',
          data_sources: ['source_code_repository'],
          controls: ['no_code_export', 'audit_trail']
        },
        status: 'approved',
        enterprise_id: enterpriseId,
        workspace_id: workspaceId,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      },
      {
        tool_version_id: insertedVersions[2].id,
        use_case: 'Medical Documentation Analysis',
        jurisdiction: ['US'],
        audience: ['medical_affairs', 'compliance'],
        pom: {
          purpose: 'Analyze clinical trial documentation',
          data_sources: ['clinical_trial_data'],
          controls: ['hipaa_compliance', 'encryption_at_rest']
        },
        status: 'in_review',
        enterprise_id: enterpriseId,
        workspace_id: workspaceId
      },
      {
        tool_version_id: insertedVersions[3].id,
        use_case: 'Internal Chatbot - Draft',
        jurisdiction: ['US', 'EU', 'APAC'],
        audience: ['all_employees'],
        pom: {
          purpose: 'Internal knowledge assistant',
          data_sources: ['confluence', 'slack'],
          controls: ['access_control', 'data_minimization']
        },
        status: 'draft',
        enterprise_id: enterpriseId,
        workspace_id: workspaceId
      },
      {
        tool_version_id: insertedVersions[4].id,
        use_case: 'Marketing Content Generation',
        jurisdiction: ['US'],
        audience: ['marketing'],
        pom: {
          purpose: 'Generate marketing materials',
          data_sources: ['brand_guidelines'],
          controls: ['brand_approval_required']
        },
        status: 'draft',
        enterprise_id: enterpriseId,
        workspace_id: workspaceId
      }
    ];

    const { data: insertedInstances, error: instancesError } = await supabase
      .from('policy_instances')
      .insert(instances)
      .select();

    if (instancesError) throw instancesError;

    // Insert Approvals for in_review instance
    const approvals = [
      {
        object_type: 'policy_instance',
        object_id: insertedInstances[2].id,
        stage: 'technical_review',
        conditions: ['security_review_passed', 'privacy_impact_assessed']
      }
    ];

    const { error: approvalsError } = await supabase
      .from('approvals')
      .insert(approvals);

    if (approvalsError) throw approvalsError;

    // Insert Runtime Bindings
    const bindings = [
      {
        policy_instance_id: insertedInstances[0].id,
        tool_version_id: insertedVersions[0].id,
        environment: 'production',
        config_overrides: { temperature: 0.7, max_tokens: 500 },
        enterprise_id: enterpriseId,
        workspace_id: workspaceId
      },
      {
        policy_instance_id: insertedInstances[1].id,
        tool_version_id: insertedVersions[1].id,
        environment: 'staging',
        config_overrides: { temperature: 0.3 },
        enterprise_id: enterpriseId,
        workspace_id: workspaceId
      }
    ];

    const { error: bindingsError } = await supabase
      .from('runtime_bindings')
      .insert(bindings);

    if (bindingsError) throw bindingsError;

    toast.success('Sample policy instance data loaded successfully');
    console.log('Sample policy instance data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    toast.error('Failed to load sample data');
  }
};
