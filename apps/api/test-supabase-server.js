// Simple test server for Supabase
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('organizations_enhanced')
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Supabase connection successful!',
      data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Supabase server running on port ${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
