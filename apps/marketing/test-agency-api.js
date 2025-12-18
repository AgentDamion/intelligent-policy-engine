const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';
const pool = new Pool({ connectionString });
const AGENCY_ID = 'a27cb30e-9ab9-4434-a6d9-67bf4e03557c'; // Use this agency for all tests

async function main() {
  try {
    // 1. Get the agency from DB (for info only)
    console.log(`[DB] SELECT * FROM agencies WHERE id = '${AGENCY_ID}'`);
    const agencyRes = await pool.query(`SELECT * FROM agencies WHERE id = $1`, [AGENCY_ID]);
    const agency = agencyRes.rows[0];
    if (!agency) throw new Error('Agency not found. Check the agency ID.');
    console.log('Agency:', { id: agency.id, name: agency.name, organization_id: agency.organization_id });

    // 2. Get its client organizations via API
    const clientsUrl = `${API_BASE}/agency/${AGENCY_ID}/clients`;
    console.log(`[HTTP] GET ${clientsUrl}`);
    let clients;
    try {
      const clientsRes = await axios.get(clientsUrl);
      clients = clientsRes.data;
      console.log(`\nAgency manages clients:`, clients.map(c => c.name));
    } catch (err) {
      logAxiosError(err, clientsUrl);
      throw err;
    }

    // 3. Submit a sample project for the first client
    if (clients.length) {
      const client = clients[0];
      const projectUrl = `${API_BASE}/agency/${AGENCY_ID}/client/${client.id}/projects`;
      console.log(`[HTTP] POST ${projectUrl}`);
      try {
        const projectRes = await axios.post(projectUrl, {
          name: `Test Project for ${client.name}`,
          description: 'Sample project for API test',
          metadata: { test: true }
        });
        console.log(`Submitted project for client ${client.name}:`, projectRes.data);
      } catch (err) {
        logAxiosError(err, projectUrl);
        throw err;
      }
    }

    // 4. Call conflict detection API with a mix of pharma and finance clients
    console.log(`[DB] SELECT id, name, competitive_group FROM organizations WHERE competitive_group IN ('pharma', 'finance')`);
    const orgsRes = await pool.query(`SELECT id, name, competitive_group FROM organizations WHERE competitive_group IN ('pharma', 'finance')`);
    const orgs = orgsRes.rows;
    const orgIds = orgs.map(o => o.id);
    const conflictsUrl = `${API_BASE}/agency/${AGENCY_ID}/conflicts`;
    console.log(`[HTTP] POST ${conflictsUrl}`);
    try {
      const conflictsRes = await axios.post(conflictsUrl, {
        organizationIds: orgIds
      });
      console.log(`\nConflicts detected (by competitive_group):`, conflictsRes.data.conflicts);
    } catch (err) {
      logAxiosError(err, conflictsUrl);
      throw err;
    }

    // 5. Test full agentic workflow (if clients exist)
    if (clients.length) {
      const clientIds = clients.map(c => c.id).join(',');
      const workflowUrl = `${API_BASE}/agency/${AGENCY_ID}/clients/${clientIds}/agentic-workflow`;
      console.log(`[HTTP] POST ${workflowUrl}`);
      try {
        const workflowRes = await axios.post(workflowUrl, {
          userMessage: 'Need to use Midjourney for campaign images serving Pfizer, Novartis, and Roche.'
        });
        console.log(`\nAgentic workflow result:`, workflowRes.data);
      } catch (err) {
        logAxiosError(err, workflowUrl);
        throw err;
      }
    }

    process.exit(0);
  } catch (err) {
    if (err.response) {
      logAxiosError(err, err.config?.url);
    } else {
      console.error('Test failed:', err.message);
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function logAxiosError(err, url) {
  console.error(`\n[AXIOS ERROR] Request to ${url} failed.`);
  if (err.message) console.error('Message:', err.message);
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Status Text:', err.response.statusText);
    console.error('Headers:', err.response.headers);
    console.error('Response Data:', err.response.data);
  } else {
    console.error('No response received.');
  }
}

main(); 