import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ExportPdfSchema = z.object({
  entity: z.enum(['policy', 'submission', 'decision', 'audit_pack']),
  entity_id: z.string().uuid()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body = await req.json();
    const { entity, entity_id } = ExportPdfSchema.parse(body);

    console.log(`Exporting PDF for ${entity} ${entity_id}`);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${entity}_${entity_id}_${timestamp}.pdf`;
    const path = `exports/${filename}`;

    // Mock PDF content - replace with actual PDF generation
    // For real implementation, use libraries like @react-pdf/renderer or puppeteer-core
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Export for ${entity} ${entity_id}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000280 00000 n 
0000000374 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
441
%%EOF`;

    // Upload to exports bucket
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(path, new Blob([mockPdfContent], { type: 'application/pdf' }), {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error('Failed to upload PDF');
    }

    // Generate signed URL for download (expires in 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(path, 3600);

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError);
      throw new Error('Failed to create download URL');
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: 'pdf_exported',
        entity_type: entity,
        entity_id,
        metadata: {
          filename,
          path,
          file_size: mockPdfContent.length
        }
      });

    if (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    const response = {
      path,
      signed_url: signedUrlData.signedUrl,
      expires_in: 3600
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export_pdf function:', error);
    
    const errorResponse = {
      error: (error as Error).message || 'Internal server error',
      details: error instanceof z.ZodError ? error.errors : undefined
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});