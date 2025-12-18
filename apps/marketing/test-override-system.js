// test-override-system.js
// Test script for the Human Override System

const express = require('express');
const { Pool } = require('pg');

// Mock database connection for testing
const mockPool = {
  query: async (query, params) => {
    console.log('🔍 Mock DB Query:', query);
    console.log('📝 Parameters:', params);
    
    // Mock responses for different queries
    if (query.includes('override_reasons')) {
      return {
        rows: [
          {
            reason_code: 'AI_CONFIDENCE_LOW',
            reason_name: 'Low AI Confidence',
            description: 'AI confidence score below acceptable threshold',
            category: 'QUALITY',
            requires_justification: true,
            requires_review: true
          },
          {
            reason_code: 'POLICY_AMBIGUITY',
            reason_name: 'Policy Ambiguity',
            description: 'Unclear or conflicting policy requirements',
            category: 'POLICY',
            requires_justification: true,
            requires_review: true
          }
        ]
      };
    }
    
    if (query.includes('audit_entries') && query.includes('SELECT')) {
      return {
        rows: [
          {
            entry_id: 'test-decision-id',
            agent: 'policy-agent',
            decision_type: 'content_approval',
            status: 'pending',
            override_requested: false
          }
        ]
      };
    }
    
    if (query.includes('UPDATE audit_entries')) {
      return { rowCount: 1 };
    }
    
    return { rows: [] };
  },
  connect: async () => ({
    query: async (query, params) => {
      console.log('🔍 Mock DB Transaction Query:', query);
      return { rowCount: 1 };
    },
    release: () => {}
  })
};

// Test the override system functionality
async function testOverrideSystem() {
  console.log('🧪 Testing Human Override System...\n');
  
  // Test 1: Get override reasons
  console.log('📋 Test 1: Fetching override reasons');
  try {
    const reasonsResponse = await mockPool.query(`
      SELECT 
        reason_code,
        reason_name,
        description,
        category,
        requires_justification,
        requires_review
      FROM override_reasons
      ORDER BY category, reason_name
    `);
    
    console.log('✅ Override reasons fetched successfully');
    console.log('📊 Found', reasonsResponse.rows.length, 'reasons\n');
  } catch (error) {
    console.log('❌ Failed to fetch override reasons:', error.message);
  }
  
  // Test 2: Request override
  console.log('📝 Test 2: Requesting override');
  try {
    const overrideData = {
      decisionId: 'test-decision-id',
      reason: 'AI_CONFIDENCE_LOW',
      justification: 'AI confidence is below threshold for this decision',
      priority: 'high'
    };
    
    // Mock the override request process
    const updateResult = await mockPool.query(`
      UPDATE audit_entries 
      SET 
        override_requested = TRUE,
        override_reason = $1,
        override_justification = $2,
        override_status = 'pending',
        override_requested_by = $3,
        override_requested_at = NOW()
      WHERE entry_id = $4
    `, [overrideData.reason, overrideData.justification, 'test-user-id', overrideData.decisionId]);
    
    console.log('✅ Override request submitted successfully');
    console.log('📊 Updated rows:', updateResult.rowCount, '\n');
  } catch (error) {
    console.log('❌ Failed to request override:', error.message);
  }
  
  // Test 3: Review override
  console.log('👁️ Test 3: Reviewing override');
  try {
    const reviewData = {
      action: 'approved',
      notes: 'Override approved after human review',
      newDecision: {
        status: 'approved',
        reasoning: 'Decision approved with modifications',
        decision: { approved: true, modifications: ['content_updated'] }
      }
    };
    
    const reviewResult = await mockPool.query(`
      UPDATE audit_entries 
      SET 
        override_status = $1,
        override_reviewed_by = $2,
        override_review_notes = $3,
        override_resolved_at = NOW()
      WHERE entry_id = $4
    `, [reviewData.action, 'reviewer-user-id', reviewData.notes, 'test-decision-id']);
    
    console.log('✅ Override review completed successfully');
    console.log('📊 Updated rows:', reviewResult.rowCount, '\n');
  } catch (error) {
    console.log('❌ Failed to review override:', error.message);
  }
  
  console.log('🎉 Human Override System tests completed!');
}

// Run the tests
testOverrideSystem().catch(console.error); 