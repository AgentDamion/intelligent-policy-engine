const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'aicomplyr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testPolicyManagementSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Policy Management System Schema...\n');

    // Test 1: Check if tables exist
    console.log('1. Checking table existence...');
    const tables = [
      'organizations_enhanced',
      'users_enhanced', 
      'policy_templates_enhanced',
      'policies_enhanced',
      'policy_rules',
      'partners',
      'policy_distributions',
      'compliance_violations',
      'compliance_checks',
      'audit_logs_enhanced',
      'policy_workflows',
      'workflow_instances'
    ];

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      console.log(`   ${table}: ${result.rows[0].exists ? '✅' : '❌'}`);
    }

    // Test 2: Insert sample data
    console.log('\n2. Inserting sample data...');
    
    // Insert organization
    const orgResult = await client.query(`
      INSERT INTO organizations_enhanced (name, industry, compliance_tier, contact_email)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['Test Pharma Corp', 'pharmaceutical', 'enterprise', 'test@pharmacorp.com']);
    
    const orgId = orgResult.rows[0].id;
    console.log(`   ✅ Created organization: ${orgId}`);

    // Insert user
    const userResult = await client.query(`
      INSERT INTO users_enhanced (organization_id, email, full_name, role)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [orgId, 'admin@pharmacorp.com', 'John Admin', 'admin']);
    
    const userId = userResult.rows[0].id;
    console.log(`   ✅ Created user: ${userId}`);

    // Insert policy template
    const templateResult = await client.query(`
      INSERT INTO policy_templates_enhanced (name, description, industry, regulation_framework, template_rules)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      'Test FDA Template',
      'Test FDA compliance template',
      'pharmaceutical',
      'FDA',
      JSON.stringify({
        data_handling: { patient_privacy: true },
        content_creation: { medical_claims: false }
      })
    ]);
    
    const templateId = templateResult.rows[0].id;
    console.log(`   ✅ Created policy template: ${templateId}`);

    // Insert policy
    const policyResult = await client.query(`
      INSERT INTO policies_enhanced (organization_id, name, description, template_id, policy_rules, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [
      orgId,
      'Test Social Media Policy',
      'Test FDA-compliant social media policy',
      templateId,
      JSON.stringify({
        data_handling: { patient_privacy: true, adverse_event_reporting: true },
        content_creation: { medical_claims: false, balanced_presentation: true }
      }),
      userId
    ]);
    
    const policyId = policyResult.rows[0].id;
    console.log(`   ✅ Created policy: ${policyId}`);

    // Insert policy rule
    const ruleResult = await client.query(`
      INSERT INTO policy_rules (policy_id, rule_type, rule_name, conditions, requirements, risk_weight)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [
      policyId,
      'data_handling',
      'Patient Privacy Protection',
      JSON.stringify({ data_type: 'patient_data', access_level: 'restricted' }),
      JSON.stringify({ encryption: true, access_controls: true, audit_logging: true }),
      8
    ]);
    
    const ruleId = ruleResult.rows[0].id;
    console.log(`   ✅ Created policy rule: ${ruleId}`);

    // Insert partner
    const partnerResult = await client.query(`
      INSERT INTO partners (organization_id, name, partner_type, contact_email, compliance_score)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      orgId,
      'Test Marketing Agency',
      'agency',
      'contact@testagency.com',
      85.5
    ]);
    
    const partnerId = partnerResult.rows[0].id;
    console.log(`   ✅ Created partner: ${partnerId}`);

    // Insert policy distribution
    const distributionResult = await client.query(`
      INSERT INTO policy_distributions (policy_id, partner_id, compliance_status)
      VALUES ($1, $2, $3) RETURNING id
    `, [policyId, partnerId, 'compliant']);
    
    const distributionId = distributionResult.rows[0].id;
    console.log(`   ✅ Created policy distribution: ${distributionId}`);

    // Test 3: Query relationships
    console.log('\n3. Testing relationships and queries...');
    
    // Get organization with policies
    const orgPolicies = await client.query(`
      SELECT o.name as org_name, p.name as policy_name, p.status
      FROM organizations_enhanced o
      JOIN policies_enhanced p ON o.id = p.organization_id
      WHERE o.id = $1
    `, [orgId]);
    
    console.log(`   ✅ Organization policies: ${orgPolicies.rows.length} found`);

    // Get partner compliance
    const partnerCompliance = await client.query(`
      SELECT p.name, p.compliance_score, p.risk_level,
             COUNT(pd.id) as active_policies
      FROM partners p
      LEFT JOIN policy_distributions pd ON p.id = pd.partner_id 
        AND pd.compliance_status = 'compliant'
      WHERE p.organization_id = $1
      GROUP BY p.id, p.name, p.compliance_score, p.risk_level
    `, [orgId]);
    
    console.log(`   ✅ Partner compliance data: ${partnerCompliance.rows.length} found`);

    // Test 4: Test audit logging
    console.log('\n4. Testing audit logging...');
    
    await client.query(`
      INSERT INTO audit_logs_enhanced (organization_id, user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      orgId,
      userId,
      'policy_created',
      'policy',
      policyId,
      JSON.stringify({ policy_name: 'Test Social Media Policy', template_used: templateId })
    ]);
    
    console.log('   ✅ Audit log entry created');

    // Test 5: Test JSONB queries
    console.log('\n5. Testing JSONB functionality...');
    
    const jsonbQuery = await client.query(`
      SELECT name, policy_rules->'data_handling'->>'patient_privacy' as patient_privacy_enabled
      FROM policies_enhanced
      WHERE id = $1
    `, [policyId]);
    
    console.log(`   ✅ JSONB query result: ${jsonbQuery.rows[0]?.patient_privacy_enabled}`);

    // Test 6: Test workflow
    console.log('\n6. Testing workflow system...');
    
    const workflowResult = await client.query(`
      INSERT INTO policy_workflows (organization_id, name, workflow_type, steps, created_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      orgId,
      'Policy Approval Workflow',
      'approval',
      JSON.stringify([
        { step: 1, name: 'Draft Review', role: 'compliance_officer' },
        { step: 2, name: 'Legal Review', role: 'legal_officer' },
        { step: 3, name: 'Final Approval', role: 'admin' }
      ]),
      userId
    ]);
    
    const workflowId = workflowResult.rows[0].id;
    console.log(`   ✅ Created workflow: ${workflowId}`);

    // Test 7: Performance test
    console.log('\n7. Testing performance with indexes...');
    
    const startTime = Date.now();
    const performanceQuery = await client.query(`
      SELECT p.name, p.status, COUNT(pr.id) as rule_count
      FROM policies_enhanced p
      LEFT JOIN policy_rules pr ON p.id = pr.policy_id
      WHERE p.organization_id = $1
      GROUP BY p.id, p.name, p.status
    `, [orgId]);
    const endTime = Date.now();
    
    console.log(`   ✅ Performance query completed in ${endTime - startTime}ms`);

    // Test 8: Cleanup
    console.log('\n8. Cleaning up test data...');
    
    await client.query('DELETE FROM workflow_instances WHERE workflow_id = $1', [workflowId]);
    await client.query('DELETE FROM policy_workflows WHERE id = $1', [workflowId]);
    await client.query('DELETE FROM audit_logs_enhanced WHERE organization_id = $1', [orgId]);
    await client.query('DELETE FROM policy_distributions WHERE id = $1', [distributionId]);
    await client.query('DELETE FROM partners WHERE id = $1', [partnerId]);
    await client.query('DELETE FROM policy_rules WHERE id = $1', [ruleId]);
    await client.query('DELETE FROM policies_enhanced WHERE id = $1', [policyId]);
    await client.query('DELETE FROM policy_templates_enhanced WHERE id = $1', [templateId]);
    await client.query('DELETE FROM users_enhanced WHERE id = $1', [userId]);
    await client.query('DELETE FROM organizations_enhanced WHERE id = $1', [orgId]);
    
    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Policy Management System schema is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPolicyManagementSchema()
    .then(() => {
      console.log('\n✅ Schema test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Schema test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPolicyManagementSchema };
