# Simple MCP Server for Cursor Integration
# This creates a local web server that Cursor can connect to

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// MCP Server endpoints
app.post('/mcp/run_sql', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('ðŸ” Running SQL:', query);
    
    const { data, error } = await supabase.rpc('exec_sql', { stmt: query });
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('âŒ SQL Error:', error.message);
    res.json({ success: false, error: error.message });
  }
});

app.post('/mcp/get_table_schema', async (req, res) => {
  try {
    const { table_name } = req.body;
    console.log('ðŸ“‹ Getting schema for:', table_name);
    
    const query = 
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = '' 
      ORDER BY ordinal_position;
    ;
    
    const { data, error } = await supabase.rpc('exec_sql', { stmt: query });
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('âŒ Schema Error:', error.message);
    res.json({ success: false, error: error.message });
  }
});

app.post('/mcp/list_tables', async (req, res) => {
  try {
    console.log('ðŸ“Š Listing tables...');
    
    const query = 
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    ;
    
    const { data, error } = await supabase.rpc('exec_sql', { stmt: query });
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('âŒ Tables Error:', error.message);
    res.json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'MCP Server is running!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('ðŸš€ MCP Server running on http://localhost:' + PORT);
  console.log('ðŸ“¡ Available endpoints:');
  console.log('  POST /mcp/run_sql');
  console.log('  POST /mcp/get_table_schema');
  console.log('  POST /mcp/list_tables');
  console.log('  GET  /health');
  console.log('');
  console.log('ðŸ”— Connect Cursor to: http://localhost:' + PORT + '/mcp');
});
