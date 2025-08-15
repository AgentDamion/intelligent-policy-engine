const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

console.log('🧪 Testing Clean Supabase Server Configuration');
console.log('============================================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('PORT:', process.env.PORT || 'not set (will default to 3001)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set (will default to development)');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');

// Check if we can create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('\n✅ Supabase client created successfully');
    
    // Test connection
    console.log('\n🔌 Testing Supabase connection...');
    supabase
      .from('organizations_enhanced')
      .select('count')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Database connection failed:', error.message);
        } else {
          console.log('✅ Database connection successful');
        }
        process.exit(0);
      })
      .catch(err => {
        console.log('❌ Connection test failed:', err.message);
        process.exit(1);
      });
  } catch (err) {
    console.log('❌ Failed to create Supabase client:', err.message);
    process.exit(1);
  }
} else {
  console.log('\n❌ Missing required Supabase environment variables');
  console.log('Please create a .env file with:');
  console.log('SUPABASE_URL=your_supabase_project_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  process.exit(1);
}
