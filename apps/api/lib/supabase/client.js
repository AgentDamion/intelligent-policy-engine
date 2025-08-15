import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to get authenticated user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to get user's organization context
export const getUserOrganization = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users_enhanced')
      .select('organization_id, organizations_enhanced(*)')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user organization:', error)
    return null
  }
}

// Helper function to check if user has specific permission
export const hasPermission = async (userId, permission) => {
  try {
    const { data, error } = await supabase
      .from('users_enhanced')
      .select('role, permissions')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    // Check role-based permissions
    if (data.role === 'admin') return true
    
    // Check specific permissions in JSONB
    if (data.permissions && data.permissions[permission]) {
      return data.permissions[permission]
    }
    
    return false
  } catch (error) {
    console.error('Error checking permissions:', error)
    return false
  }
}

// Export default client
export default supabase
