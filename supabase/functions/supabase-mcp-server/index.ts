import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { action, query, table_name } = body

    let result

    switch (action) {
      case 'run_sql':
        try {
          // Execute SQL query
          const { data, error } = await supabase.rpc('exec_sql', { stmt: query })
          if (error) throw error
          result = { success: true, data }
        } catch (error) {
          result = { success: false, error: error.message }
        }
        break

      case 'get_table_schema':
        try {
          const schemaQuery = 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = '' 
            ORDER BY ordinal_position;
          
          const { data, error } = await supabase.rpc('exec_sql', { stmt: schemaQuery })
          if (error) throw error
          result = { success: true, data }
        } catch (error) {
          result = { success: false, error: error.message }
        }
        break

      case 'list_tables':
        try {
          const tablesQuery = 
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
          
          const { data, error } = await supabase.rpc('exec_sql', { stmt: tablesQuery })
          if (error) throw error
          result = { success: true, data }
        } catch (error) {
          result = { success: false, error: error.message }
        }
        break

      default:
        result = { success: false, error: 'Unknown action' }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
