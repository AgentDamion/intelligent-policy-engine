#!/usr/bin/env node

// supabase/validate-deployment.js
// Quick validation script to test API availability and Supabase schema presence

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const API_BASE_URL = process.env.API_BASE_URL || `${process.env.PUBLIC_URL || ''}/api` || 'http://localhost:3000/api';
const DATABASE_URL = process.env.DATABASE_URL;

function normalizeBaseUrl(url) {
  if (!url) return 'http://localhost:3000/api';
  if (url.endsWith('/')) url = url.slice(0, -1);
  // If someone set base to site root, append /api
  if (!url.endsWith('/api')) {
    if (url.includes('/api')) return url; // already pointing under /api path
    return `${url}/api`;
  }
  return url;
}

async function pingHealth(baseUrl) {
  const url = `${baseUrl}/health`;
  const res = await axios.get(url, { timeout: 10000 });
  return res.data;
}

async function fetchPolicyTemplates(baseUrl) {
  const url = `${baseUrl}/policy-templates`;
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const payload = res.data || {};
    const list = Array.isArray(payload.templates) ? payload.templates : (Array.isArray(payload.data) ? payload.data : []);
    return { ok: true, endpoint: '/policy-templates', count: list.length, raw: payload };
  } catch (e) {
    // Fallback: some servers expose /policies instead
    const alt = `${baseUrl}/policies`;
    const res = await axios.get(alt, { timeout: 15000 });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];
    return { ok: true, endpoint: '/policies', count: list.length, raw: payload };
  }
}

async function checkTables(pool, tables) {
  const client = await pool.connect();
  try {
    const results = {};
    for (const table of tables) {
      const q = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema IN ('public') AND table_name = $1)`;
      const r = await client.query(q, [table]);
      results[table] = !!r.rows[0]?.exists;
    }
    return results;
  } finally {
    client.release();
  }
}

(async () => {
  console.log('🚀 AICOMPLYR Deployment Validation');
  console.log('=================================');

  const baseUrl = normalizeBaseUrl(API_BASE_URL);
  console.log(`
🔗 API base: ${baseUrl}`);
  console.log(`🗄️  DATABASE_URL: ${DATABASE_URL ? 'present' : 'missing'}`);

  let ok = true;

  // 1) API health
  try {
    console.log('\n1) Checking API health...');
    const health = await pingHealth(baseUrl);
    console.log('   ✅ /health OK:', JSON.stringify(health));
  } catch (err) {
    ok = false;
    console.error('   ❌ /health failed:', err.response?.status, err.message);
  }

  // 2) Policy templates API
  try {
    console.log('\n2) Checking policy templates endpoint...');
    const out = await fetchPolicyTemplates(baseUrl);
    console.log(`   ✅ ${out.endpoint} OK (count=${out.count})`);
    if (out.count === 0) {
      console.log('   ⚠️  No items found. You may want to seed templates:');
      console.log('      - node database/seed-policy-templates.js  (base)');
      console.log('      - node database/seed-common-ai-tools-and-templates.js  (enhanced)');
    }
  } catch (err) {
    ok = false;
    console.error('   ❌ Templates/policies list failed:', err.response?.status, err.message);
  }

  // 3) Database schema checks (optional if DATABASE_URL present)
  if (DATABASE_URL) {
    console.log('\n3) Verifying database schema via DATABASE_URL...');
    const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      const coreTables = [
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
        'workflow_instances',
        // Compatibility/base tables
        'policy_templates',
        'policies',
        'organizations',
        'agency_ai_tools'
      ];

      const tableStatus = await checkTables(pool, coreTables);
      const present = Object.entries(tableStatus).filter(([, v]) => v).map(([k]) => k);
      const missing = Object.entries(tableStatus).filter(([, v]) => !v).map(([k]) => k);

      console.log(`   ✅ Present tables (${present.length}): ${present.join(', ') || '(none)'}`);
      if (missing.length > 0) {
        console.log(`   ⚠️  Missing tables (${missing.length}): ${missing.join(', ')}`);
        console.log('      Run migrations: node supabase/run-migrations-direct.js run-all');
      }
    } catch (err) {
      ok = false;
      console.error('   ❌ Database check failed:', err.message);
    } finally {
      await pool.end().catch(() => {});
    }
  } else {
    console.log('\n3) Skipping DB checks (DATABASE_URL not set).');
  }

  console.log('\n📋 Validation Summary:');
  console.log(`   API: ${ok ? 'OK' : 'Issues detected'}`);
  console.log('   Next steps:');
  console.log('     - Ensure Supabase vars are set and migrations applied');
  console.log('     - Seed templates if empty');

  process.exit(ok ? 0 : 1);
})();