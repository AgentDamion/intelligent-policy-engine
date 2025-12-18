import { supabase } from '@/integrations/supabase/client';

export const insertSampleGovernanceData = async () => {
  try {
    // Check if data already exists
    const { data: existingEntities } = await supabase
      .from('governance_entities')
      .select('id')
      .limit(1);

    if (existingEntities && existingEntities.length > 0) {
      console.log('Sample governance data already exists');
      return;
    }

    // Get current user's enterprises
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    const { data: userEnterprises } = await supabase
      .from('enterprise_members')
      .select('enterprise_id')
      .eq('user_id', user.id);

    const enterpriseId = userEnterprises?.[0]?.enterprise_id;
    if (!enterpriseId) {
      console.log('No enterprise found for user');
      return;
    }

    // Sample governance entities
    const sampleEntities = [
      {
        name: 'Global Pharma Corp',
        type: 'client',
        enterprise_id: enterpriseId,
        compliance_score: 87,
        tool_approval_score: 82,
        audit_completeness_score: 91,
        open_risks: 3,
        owner_name: 'John Smith',
        region: 'US'
      },
      {
        name: 'TechStart Industries',
        type: 'client',
        enterprise_id: enterpriseId,
        compliance_score: 74,
        tool_approval_score: 79,
        audit_completeness_score: 85,
        open_risks: 5,
        owner_name: 'Sarah Johnson',
        region: 'EU'
      },
      {
        name: 'Creative Studio',
        type: 'partner',
        enterprise_id: enterpriseId,
        compliance_score: 91,
        tool_approval_score: 88,
        audit_completeness_score: 94,
        open_risks: 2,
        owner_name: 'Alex Chen',
        region: 'APAC'
      },
      {
        name: 'ChatGPT Enterprise',
        type: 'tool',
        enterprise_id: enterpriseId,
        compliance_score: 95,
        tool_approval_score: 92,
        audit_completeness_score: 88,
        open_risks: 1,
        owner_name: 'Mike Davis',
        region: 'US'
      }
    ];

    // Insert sample entities
    const { data: insertedEntities, error: entitiesError } = await supabase
      .from('governance_entities')
      .insert(sampleEntities)
      .select();

    if (entitiesError) {
      console.error('Error inserting sample entities:', entitiesError);
      return;
    }

    // Sample governance alerts
    const sampleAlerts = [
      {
        severity: 'critical',
        title: 'MetaLoop Processing Delay',
        description: 'High-volume client experiencing 48hr+ processing delays',
        entity_name: 'Global Pharma Corp',
        entity_type: 'client',
        entity_id: insertedEntities?.[0]?.id,
        enterprise_id: enterpriseId,
        days_open: 3,
        assignee_name: 'John Smith',
        category: 'Performance'
      },
      {
        severity: 'warning',
        title: 'Pending Tool Approvals',
        description: '12 AI tools awaiting approval for Q1 compliance',
        entity_name: 'Creative Studio',
        entity_type: 'partner',
        entity_id: insertedEntities?.[2]?.id,
        enterprise_id: enterpriseId,
        days_open: 5,
        assignee_name: 'Sarah Johnson',
        category: 'Compliance'
      },
      {
        severity: 'info',
        title: 'Policy Distribution Complete',
        description: 'Q1 2025 AI governance policies distributed to all partners',
        entity_name: 'System',
        entity_type: 'policy',
        enterprise_id: enterpriseId,
        days_open: 0,
        category: 'Policy'
      }
    ];

    // Insert sample alerts
    const { error: alertsError } = await supabase
      .from('governance_alerts')
      .insert(sampleAlerts);

    if (alertsError) {
      console.error('Error inserting sample alerts:', alertsError);
      return;
    }

    console.log('Sample governance data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};