import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const VirusScanSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  evidence_id: z.string().uuid().optional()
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
    const { bucket, path, evidence_id } = VirusScanSchema.parse(body);

    console.log(`Scanning file ${path} in bucket ${bucket}`);

    // Check if file exists
    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (fileError || !fileData) {
      console.error('Error accessing file:', fileError);
      throw new Error('File not found or inaccessible');
    }

    // Mock virus scanning - replace with actual AV integration
    // For real implementation, integrate with ClamAV, VirusTotal, or cloud AV services
    const mockScanResult = {
      status: Math.random() > 0.95 ? 'infected' : 'clean', // 5% chance of infection for testing
      engine: 'stub',
      scan_date: new Date().toISOString(),
      threats_detected: [] as string[]
    };

    if (mockScanResult.status === 'infected') {
      mockScanResult.threats_detected = ['Test.EICAR.Signature'];
      
      // Move infected file to quarantine
      const quarantinePath = `quarantine/${crypto.randomUUID()}_${path.split('/').pop()}`;
      
      // Copy to quarantine bucket
      const { error: copyError } = await supabase.storage
        .from('quarantine')
        .upload(quarantinePath, fileData, {
          contentType: 'application/octet-stream',
          upsert: false
        });

      if (copyError) {
        console.error('Error quarantining file:', copyError);
      }

      // Remove from original location
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (deleteError) {
        console.error('Error removing infected file:', deleteError);
      }
    }

    // Update evidence record if provided
    if (evidence_id) {
      const { error: updateError } = await supabase
        .from('evidence')
        .update({
          scan_status: mockScanResult.status,
          scanned_at: mockScanResult.scan_date,
          scan_metadata: mockScanResult
        })
        .eq('id', evidence_id);

      if (updateError) {
        console.error('Error updating evidence record:', updateError);
      }
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_events')
      .insert({
        event_type: 'file_scanned',
        entity_type: 'file',
        entity_id: evidence_id || null,
        metadata: {
          bucket,
          path,
          scan_result: mockScanResult,
          file_size: fileData.size
        }
      });

    if (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    const response = {
      status: mockScanResult.status,
      engine: mockScanResult.engine,
      evidence_id: evidence_id || null,
      threats_detected: mockScanResult.threats_detected,
      scan_date: mockScanResult.scan_date
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in virus_scan function:', error);
    
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