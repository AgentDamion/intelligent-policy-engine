// ================================
// PROOF REQUIREMENTS INTEGRATION TEST
// ================================
// Integration test for ProofRequirementsAgent happy path

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Integration test for ProofRequirementsAgent
 * 
 * Tests the full flow:
 * 1. Create test submission
 * 2. Resolve requirements (creates profile + atom states)
 * 3. Verify canTransition returns false with missing atoms
 * 4. Update all required atoms to 'present'
 * 5. Verify canTransition returns true
 */
export async function testProofRequirementsFlow() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧪 Starting ProofRequirementsAgent integration test...');

  try {
    // Step 1: Create test enterprise and organization (or use existing)
    // For testing, we'll assume these exist or create minimal test data
    const testEnterpriseId = crypto.randomUUID();
    const testOrganizationId = crypto.randomUUID();
    const testUserId = crypto.randomUUID();

    // Create test enterprise (if needed)
    const { error: enterpriseError } = await supabase
      .from('enterprises')
      .upsert({
        id: testEnterpriseId,
        name: 'Test Enterprise',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (enterpriseError && !enterpriseError.message.includes('duplicate')) {
      console.warn('Could not create test enterprise:', enterpriseError);
    }

    // Step 2: Create test submission
    const testSubmissionId = crypto.randomUUID();
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        id: testSubmissionId,
        organization_id: testOrganizationId,
        enterprise_id: testEnterpriseId,
        submission_type: 'compliance_submission',
        title: 'Test Submission for Proof Requirements',
        description: 'Integration test submission',
        status: 'draft',
        created_by: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submissionError) {
      throw new Error(`Failed to create test submission: ${submissionError.message}`);
    }

    console.log('✅ Created test submission:', testSubmissionId);

    // Step 3: Call agent via cursor-agent-adapter
    const contextProfile = {
      submissionId: testSubmissionId,
      enterpriseId: testEnterpriseId,
      organizationId: testOrganizationId,
      jurisdictions: ['EU'],
      channels: ['public'],
      assetTypes: ['image'],
      categories: [],
      aiUsed: true,
    };

    const resolveResponse = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        agentName: 'proof-requirements',
        action: 'resolveRequirements',
        input: {
          context: contextProfile,
          packIds: ['eu_public_ai_content_v1'],
        },
        enterprise_id: testEnterpriseId,
      }),
    });

    if (!resolveResponse.ok) {
      const errorText = await resolveResponse.text();
      throw new Error(`Agent call failed: ${resolveResponse.status} - ${errorText}`);
    }

    const resolveResult = await resolveResponse.json();
    console.log('✅ Resolved requirements:', resolveResult.result?.profileKey);

    // Step 4: Verify requirements_profiles row created
    const { data: profile, error: profileError } = await supabase
      .from('requirements_profiles')
      .select('*')
      .eq('submission_id', testSubmissionId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Requirements profile not found: ${profileError?.message}`);
    }

    console.log('✅ Verified requirements profile created:', profile.id);
    console.log(`   Required atoms: ${profile.required_atoms.length}`);

    // Step 5: Verify submission_atom_states rows created with status='missing'
    const { data: atomStates, error: statesError } = await supabase
      .from('submission_atom_states')
      .select('*')
      .eq('submission_id', testSubmissionId);

    if (statesError) {
      throw new Error(`Failed to load atom states: ${statesError.message}`);
    }

    const missingStates = atomStates?.filter(s => s.status === 'missing') || [];
    console.log(`✅ Verified ${missingStates.length} atom states created with status='missing'`);

    if (missingStates.length !== profile.required_atoms.length) {
      throw new Error(
        `Expected ${profile.required_atoms.length} missing states, got ${missingStates.length}`
      );
    }

    // Step 6: Verify canTransition returns allowed=false with missing atoms
    const transitionCheck1 = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        agentName: 'proof-requirements',
        action: 'canTransition',
        input: {
          submissionId: testSubmissionId,
          targetState: 'approved',
        },
        enterprise_id: testEnterpriseId,
      }),
    });

    const transitionResult1 = await transitionCheck1.json();
    console.log('✅ Transition check (before updates):', transitionResult1.result);

    if (transitionResult1.result?.allowed !== false) {
      throw new Error('Expected transition to be blocked, but it was allowed');
    }

    if (transitionResult1.result?.missingAtoms.length !== profile.required_atoms.length) {
      throw new Error(
        `Expected ${profile.required_atoms.length} missing atoms, got ${transitionResult1.result?.missingAtoms.length}`
      );
    }

    // Step 7: Update all required atoms to 'present'
    for (const atomId of profile.required_atoms) {
      const updateResponse = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
        body: JSON.stringify({
          agentName: 'proof-requirements',
          action: 'updateAtomState',
          input: {
            submissionId: testSubmissionId,
            atomId: atomId,
            status: 'present',
            value: { test: true },
            updatedBy: testUserId,
          },
          enterprise_id: testEnterpriseId,
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update atom ${atomId}: ${errorText}`);
      }
    }

    console.log(`✅ Updated ${profile.required_atoms.length} atoms to 'present'`);

    // Step 8: Verify canTransition returns allowed=true
    const transitionCheck2 = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        agentName: 'proof-requirements',
        action: 'canTransition',
        input: {
          submissionId: testSubmissionId,
          targetState: 'approved',
        },
        enterprise_id: testEnterpriseId,
      }),
    });

    const transitionResult2 = await transitionCheck2.json();
    console.log('✅ Transition check (after updates):', transitionResult2.result);

    if (transitionResult2.result?.allowed !== true) {
      throw new Error(
        `Expected transition to be allowed, but it was blocked. Missing: ${transitionResult2.result?.missingAtoms}, Invalid: ${transitionResult2.result?.invalidAtoms}`
      );
    }

    console.log('✅✅✅ All integration tests passed!');

    // Cleanup (optional - comment out to keep test data)
    // await supabase.from('submission_atom_states').delete().eq('submission_id', testSubmissionId);
    // await supabase.from('requirements_profiles').delete().eq('id', profile.id);
    // await supabase.from('submissions').delete().eq('id', testSubmissionId);

    return {
      success: true,
      submissionId: testSubmissionId,
      profileId: profile.id,
      requiredAtoms: profile.required_atoms.length,
    };
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Run test if executed directly
if (import.meta.main) {
  testProofRequirementsFlow()
    .then(result => {
      console.log('Test completed:', result);
      Deno.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      Deno.exit(1);
    });
}

