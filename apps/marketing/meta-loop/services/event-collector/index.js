require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

// Create Express app
const app = express();
app.use(express.json());

// Connect to your database (we'll add your Railway connection string)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Event collector endpoint
app.post('/meta-loop/event', async (req, res) => {
  try {
    const { tenant_id, domain, event_type, metadata } = req.body;
    
    // Save event to database
    const result = await pool.query(
      `INSERT INTO compliance_events 
       (tenant_id, domain, event_type, metadata) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [tenant_id, domain, event_type, metadata]
    );
    
    console.log('📊 Event captured:', event_type);
    res.json({ status: 'success', event: result.rows[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// Start the service
const PORT = process.env.META_LOOP_PORT || 5050;
app.listen(PORT, () => {
  console.log(`🧠 Meta-Loop Event Collector running on port ${PORT}`);
});