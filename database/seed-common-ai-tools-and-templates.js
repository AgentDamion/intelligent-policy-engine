#!/usr/bin/env node

// database/seed-common-ai-tools-and-templates.js
// Seeds common AI tools and policy templates into Supabase Postgres

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const tools = [
  { name: 'OpenAI ChatGPT', category: 'llm', official: true, description: 'General-purpose LLM for text generation and analysis' },
  { name: 'Anthropic Claude', category: 'llm', official: true, description: 'Constitutional AI assistant for safe, helpful responses' },
  { name: 'Midjourney', category: 'image_generation', official: true, description: 'Creative image generation from prompts' },
  { name: 'Stable Diffusion', category: 'image_generation', official: true, description: 'Open-source image generation' },
  { name: 'Azure OpenAI', category: 'llm_enterprise', official: true, description: 'Microsoft-hosted OpenAI with enterprise controls' }
];

const templates = [
  {
    name: 'pharma_template_v1',
    description: 'Pharma social + medical content guardrails (FDA-aligned)',
    industry: 'pharmaceutical',
    regulation_framework: 'FDA',
    template_rules: {
      data_handling: { patient_privacy: true, adverse_event_reporting: true },
      content_creation: { medical_claims: false, balanced_presentation: true },
      review: { mlr_required: true, reviewers: ['medical', 'legal', 'regulatory'] }
    },
    risk_categories: { high: ['patient_data','medical_claims'], medium: ['adverse_events'], low: ['general_info'] }
  },
  {
    name: 'agency_template_v1',
    description: 'Agency content workflow with client approvals',
    industry: 'marketing',
    regulation_framework: 'GENERAL',
    template_rules: {
      content_creation: { plagiarism_check: true, brand_guidelines: true },
      workflow: { client_approval_required: true }
    },
    risk_categories: { high: ['claims'], medium: ['brand_risk'], low: ['general'] }
  },
  {
    name: 'internal_ops_template',
    description: 'Internal use of AI for productivity; low-risk defaults',
    industry: 'general',
    regulation_framework: 'INTERNAL',
    template_rules: {
      data_handling: { pii_uploads: 'restricted', export_controls: true },
      usage: { disclose_ai_assist: true }
    },
    risk_categories: { high: ['pii'], medium: [], low: ['internal_notes'] }
  }
];

async function tableExists(client, tableName) {
  const q = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema IN ('public') AND table_name = $1)`;
  const r = await client.query(q, [tableName]);
  return !!r.rows[0]?.exists;
}

async function upsertAiTools(client) {
  // Prefer enhanced ai_tools if present; otherwise create basic table if missing
  const hasAiTools = await tableExists(client, 'ai_tools');
  if (!hasAiTools) {
    console.log('ℹ️  Creating ai_tools table (basic)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category TEXT,
        official BOOLEAN DEFAULT TRUE,
        description TEXT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_tools_name ON ai_tools(name);
    `);
  }

  for (const t of tools) {
    await client.query(
      `INSERT INTO ai_tools (name, category, official, description)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (name) DO UPDATE SET category=EXCLUDED.category, official=EXCLUDED.official, description=EXCLUDED.description`,
      [t.name, t.category, t.official, t.description]
    );
  }
  console.log(`✅ Seeded ${tools.length} AI tools`);
}

async function seedTemplates(client) {
  // Prefer enhanced policy_templates_enhanced; else fallback to base policy_templates
  const useEnhanced = await tableExists(client, 'policy_templates_enhanced');
  if (useEnhanced) {
    for (const tpl of templates) {
      await client.query(
        `INSERT INTO policy_templates_enhanced (name, description, industry, regulation_framework, template_rules, risk_categories)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (name) DO NOTHING`,
        [tpl.name, tpl.description, tpl.industry, tpl.regulation_framework, tpl.template_rules, tpl.risk_categories]
      );
    }
    console.log(`✅ Seeded ${templates.length} enhanced policy templates`);
  } else {
    // Base fallback
    for (const tpl of templates) {
      await client.query(
        `INSERT INTO policy_templates (name, description, industry, template_type, base_rules)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (name) DO NOTHING`,
        [tpl.name, tpl.description, tpl.industry, 'custom', tpl.template_rules]
      );
    }
    console.log(`✅ Seeded ${templates.length} base policy templates`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding AI tools and policy templates...');
    await upsertAiTools(client);
    await seedTemplates(client);
    console.log('🎉 Seeding complete');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}