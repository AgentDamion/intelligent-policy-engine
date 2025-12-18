import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RFIQuestion {
  id: string
  question_text: string
  category: string
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  requirements: string[]
  context?: string
}

interface ParsedRFI {
  rfi_id: string
  title: string
  organization: string
  due_date: string
  questions: RFIQuestion[]
  metadata: {
    total_questions: number
    high_priority_count: number
    categories: string[]
    parsed_at: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { file_url, file_type, organization_id } = await req.json()

    if (!file_url || !file_type || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the document based on type
    let parsedRFI: ParsedRFI

    if (file_type === 'application/pdf') {
      parsedRFI = await parsePDFDocument(file_url)
    } else if (file_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      parsedRFI = await parseXLSXDocument(file_url)
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store parsed RFI in database
    const { data: rfiData, error: rfiError } = await supabaseClient
      .from('rfp_question_library')
      .insert({
        organization_id,
        rfi_id: parsedRFI.rfi_id,
        title: parsedRFI.title,
        organization: parsedRFI.organization,
        due_date: parsedRFI.due_date,
        questions: parsedRFI.questions,
        metadata: parsedRFI.metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (rfiError) {
      console.error('Error storing RFI:', rfiError)
      return new Response(
        JSON.stringify({ error: 'Failed to store RFI data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rfi_id: parsedRFI.rfi_id,
        parsed_data: parsedRFI,
        stored_id: rfiData.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error parsing RFI document:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function parsePDFDocument(fileUrl: string): Promise<ParsedRFI> {
  // This is a simplified implementation
  // In production, you'd use a proper PDF parsing library
  const rfiId = `rfi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    rfi_id: rfiId,
    title: "Sample RFI Document",
    organization: "Sample Organization",
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    questions: [
      {
        id: `q_${rfiId}_1`,
        question_text: "What is your data security policy?",
        category: "Security",
        priority: "high",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: ["SOC 2 compliance", "Data encryption", "Access controls"],
        context: "The organization requires detailed information about data security measures"
      },
      {
        id: `q_${rfiId}_2`,
        question_text: "How do you handle data privacy compliance?",
        category: "Privacy",
        priority: "high",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: ["GDPR compliance", "Data retention policies", "User consent management"],
        context: "Privacy compliance is critical for this engagement"
      },
      {
        id: `q_${rfiId}_3`,
        question_text: "What is your disaster recovery plan?",
        category: "Business Continuity",
        priority: "medium",
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: ["RTO < 4 hours", "RPO < 1 hour", "Backup verification"],
        context: "Business continuity planning is essential"
      }
    ],
    metadata: {
      total_questions: 3,
      high_priority_count: 2,
      categories: ["Security", "Privacy", "Business Continuity"],
      parsed_at: new Date().toISOString()
    }
  }
}

async function parseXLSXDocument(fileUrl: string): Promise<ParsedRFI> {
  // This is a simplified implementation
  // In production, you'd use a proper XLSX parsing library
  const rfiId = `rfi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    rfi_id: rfiId,
    title: "Sample RFI Spreadsheet",
    organization: "Sample Organization",
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: `q_${rfiId}_1`,
        question_text: "What certifications do you hold?",
        category: "Certifications",
        priority: "high",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: ["ISO 27001", "SOC 2 Type II", "PCI DSS"],
        context: "Certification verification is required"
      }
    ],
    metadata: {
      total_questions: 1,
      high_priority_count: 1,
      categories: ["Certifications"],
      parsed_at: new Date().toISOString()
    }
  }
}

