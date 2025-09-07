// scripts/migrate-to-supabase-auth.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Need service key for admin operations
);

async function migrateUsers() {
  console.log('Starting user migration to Supabase Auth...');
  
  try {
    // 1. Fetch existing users from your old system
    // (Adjust this query based on your current schema)
    const { data: legacyUsers, error: fetchError } = await supabase
      .from('users') // or wherever your users are
      .select('*');
    
    if (fetchError) throw fetchError;
    
    console.log(`Found ${legacyUsers.length} users to migrate`);
    
    for (const legacyUser of legacyUsers) {
      console.log(`Migrating user: ${legacyUser.email}`);
      
      // 2. Create user in Supabase Auth
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: legacyUser.email,
        password: generateTempPassword(), // They'll need to reset
        email_confirm: true,
        app_metadata: {
          enterprise_id: legacyUser.organization_id || legacyUser.enterprise_id,
          enterprise_role: legacyUser.role || 'member',
          migrated: true,
          legacy_id: legacyUser.id
        }
      });
      
      if (createError) {
        console.error(`Failed to migrate ${legacyUser.email}:`, createError);
        continue;
      }
      
      // 3. Update enterprise_members table
      const { error: memberError } = await supabase
        .from('enterprise_members')
        .upsert({
          user_id: authUser.user.id,
          enterprise_id: legacyUser.organization_id || legacyUser.enterprise_id,
          role: legacyUser.role || 'member'
        });
      
      if (memberError) {
        console.error(`Failed to create enterprise member:`, memberError);
      }
      
      // 4. Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        legacyUser.email,
        {
          redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
        }
      );
      
      if (resetError) {
        console.error(`Failed to send reset email:`, resetError);
      }
      
      console.log(`✓ Migrated ${legacyUser.email}`);
    }
    
    console.log('Migration complete!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-12) + 'Aa1!';
}

// Run migration
migrateUsers();
