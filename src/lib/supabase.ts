import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      enterprises: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          enterprise_id: string
          name: string
          enterprise_name: string
          policy_scope?: string
          created_at: string
        }
        Insert: {
          id?: string
          enterprise_id: string
          name: string
          enterprise_name: string
          policy_scope?: string
          created_at?: string
        }
        Update: {
          id?: string
          enterprise_id?: string
          name?: string
          enterprise_name?: string
          policy_scope?: string
          created_at?: string
        }
      }
      policies: {
        Row: {
          id: string
          enterprise_id: string
          title: string
          content: any
          status: 'draft' | 'review' | 'published' | 'archived'
          current_version: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          enterprise_id: string
          title: string
          content?: any
          status?: 'draft' | 'review' | 'published' | 'archived'
          current_version?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          enterprise_id?: string
          title?: string
          content?: any
          status?: 'draft' | 'review' | 'published' | 'archived'
          current_version?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      enterprise_members: {
        Row: {
          enterprise_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at: string
        }
        Insert: {
          enterprise_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at?: string
        }
        Update: {
          enterprise_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at?: string
        }
      }
    }
  }
}
