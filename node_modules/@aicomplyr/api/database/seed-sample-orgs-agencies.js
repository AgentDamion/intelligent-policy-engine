// database/seed-policy-templates.js
// Script to add sample policy templates

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sampleTemplates = [
  {
    name: 'FDA Social Media Compliance',
    description: 'Standard FDA compliance rules for pharmaceutical social media content',
    industry: 'pharma',
    template_type: 'fda_social_media',
    base_rules: {
      requires_medical_review: true,
      requires_legal_review: true,
      prohibited_claims: ['cure', 'treatment', 'diagnosis'],
      required_disclaimers: ['FDA_approval_status', 'side_effects'],
      approval_required_for: ['patient_facing', 'disease_specific'],
      risk_factors: {
        patient_facing: 'high',
        off_label_mention: 'critical',
        medical_claims: 'high'
      }
    }
  },
  {
    name: 'AI Content Disclosure',
    description: 'Requirements for disclosing AI-generated content',
    industry: 'general',
    template_type: 'ai_disclosure',
    base_rules: {
      disclosure_required: true,
      disclosure_text: 'This content was created with AI assistance',
      disclosure_placement: 'prominent',
      human_review_required: true,
      exceptions: ['internal_drafts', 'research_notes']
    }
  },
  {
    name: 'Off-Label Avoidance',
    description: 'Prevents off-label promotion in marketing materials',
    industry: 'pharma',
    template_type: 'off_label_avoidance',
    base_rules: {
      scan_for_off_label: true,
      approved_indications_only: true,
      requires_indication_verification: true,
      escalate_on_potential_violation: true,
      review_threshold: 0.7
    }
  }
];

async function seedPolicyTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding policy templates...');
    
    for (const template of sampleTemplates) {
      // Check if template already exists
      const existsQuery = 'SELECT id FROM policy_templates WHERE name = $1';
      const existsResult = await client.query(existsQuery, [template.name]);
      
      if (existsResult.rows.length === 0) {
        const query = `
          INSERT INTO policy_templates (name, description, industry, template_type, base_rules)
          VALUES ($1, $2, $3, $4, $5)
        `;
      
        await client.query(query, [
          template.name,
          template.description,
          template.industry,
          template.template_type,
          JSON.stringify(template.base_rules)
        ]);
        
        console.log(`✅ Added template: ${template.name}`);
      } else {
        console.log(`⏭️ Template already exists: ${template.name}`);
      }
    }
    
    console.log('🎉 Policy templates seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding policy templates:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPolicyTemplates();