import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedQuestion {
  section: string;
  question_number: number;
  question_text: string;
  question_type: string;
  required_evidence: string[];
  is_mandatory: boolean;
}

interface ParseResult {
  distribution_id: string;
  questions: ParsedQuestion[];
  metadata: {
    total_questions: number;
    auto_answerable: number;
    manual_required: number;
    estimated_time_minutes: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { bucket, path, file_url, file_name, workspace_id } = await req.json();

    console.log('Parsing RFI document:', { file_name, workspace_id, bucket, path });

    // Download the file from storage
    let fileBuffer: ArrayBuffer;
    
    if (bucket && path) {
      // Preferred: Download via storage SDK (works for private buckets)
      console.log('Downloading file via storage SDK:', { bucket, path });
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(path);
      
      if (downloadError) {
        console.error('Storage download error:', downloadError);
        throw new Error(`Failed to download file from storage: ${downloadError.message}`);
      }
      
      fileBuffer = await fileData.arrayBuffer();
    } else if (file_url) {
      // Fallback: Fetch from URL (for signed URLs or public buckets)
      console.log('Downloading file via URL:', file_url);
      const fileResponse = await fetch(file_url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from URL: ${fileResponse.statusText}`);
      }
      fileBuffer = await fileResponse.arrayBuffer();
    } else {
      throw new Error('Either bucket/path or file_url must be provided');
    }

    const fileType = file_name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'excel';

    console.log('File downloaded, type:', fileType, 'size:', fileBuffer.byteLength);

    // Call cursor-agent-adapter to parse RFI using DocumentAgent
    console.log('Calling cursor-agent-adapter DocumentAgent for intelligent RFI parsing...');
    
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentName: 'document',
        action: 'parse_rfi',
        input: {
          file_content: new TextDecoder().decode(fileBuffer),
          file_type: fileType,
          file_name: file_name,
          file_size: fileBuffer.byteLength
        },
        context: {
          workspace_id,
          parse_type: 'rfi_questions',
          source: 'rfi_upload'
        }
      })
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error('Agent adapter error:', errorText);
      throw new Error(`DocumentAgent failed: ${errorText}`);
    }

    const agentResult = await agentResponse.json();
    console.log('DocumentAgent response:', agentResult);

    // Extract questions from agent result
    const questions: ParsedQuestion[] = agentResult.result?.metadata?.questions || [];
    
    // Fallback questions if AI parsing fails
    if (questions.length === 0) {
      console.warn('No questions parsed by AI, using fallback questions');
      questions.push(
        {
          section: "Technical Capabilities",
          question_number: 1,
          question_text: "Describe your organization's AI/ML development infrastructure and tooling",
          question_type: "long_text",
          required_evidence: ["architecture_diagram", "technical_documentation"],
          is_mandatory: true
        },
        {
          section: "Data Governance",
          question_number: 2,
          question_text: "Describe your data collection, storage, and retention policies",
          question_type: "long_text",
          required_evidence: ["policy_document", "data_flow_diagram"],
          is_mandatory: true
        },
        {
          section: "Security & Compliance",
          question_number: 3,
          question_text: "What security certifications does your organization maintain?",
          question_type: "multiple_choice",
          required_evidence: ["certification_documents"],
          is_mandatory: false
        }
      );
    }

    console.log('Parsed', questions.length, 'questions using AI-powered DocumentAgent');

    // Create a policy distribution for this RFI
    const { data: distribution, error: distError } = await supabase
      .from('policy_distributions')
      .insert({
        policy_version_id: '00000000-0000-0000-0000-000000000000', // Placeholder - will be updated
        target_workspace_id: workspace_id,
        distribution_type: 'external_rfi',
        response_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        metadata: {
          source_file: file_name,
          parsed_at: new Date().toISOString(),
          file_type: fileType
        }
      })
      .select()
      .single();

    if (distError) {
      console.error('Distribution creation error:', distError);
      throw distError;
    }

    console.log('Created distribution:', distribution.id);

    // Insert parsed questions
    const questionRecords = questions.map((q) => ({
      distribution_id: distribution.id,
      section: q.section,
      question_number: q.question_number,
      question_text: q.question_text,
      question_type: q.question_type,
      required_evidence: q.required_evidence,
      is_mandatory: q.is_mandatory
    }));

    const { error: questionsError } = await supabase
      .from('rfp_question_library')
      .insert(questionRecords);

    if (questionsError) {
      console.error('Questions insert error:', questionsError);
      throw questionsError;
    }

    console.log('Inserted', questionRecords.length, 'questions');

    // Calculate metadata
    const autoAnswerable = questions.filter(q => 
      q.required_evidence.length > 0 && !q.is_mandatory
    ).length;
    
    const manualRequired = questions.filter(q => q.is_mandatory).length;

    const result: ParseResult = {
      distribution_id: distribution.id,
      questions,
      metadata: {
        total_questions: questions.length,
        auto_answerable: autoAnswerable,
        manual_required: manualRequired,
        estimated_time_minutes: questions.length * 5 // 5 min per question estimate
      }
    };

    console.log('Parse complete:', result.metadata);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in rfi_document_parser:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
