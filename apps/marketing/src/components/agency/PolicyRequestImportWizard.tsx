import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeWithAuth } from '@/lib/supabase/invokeWithAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { buildEvidencePath } from '@/lib/storage/paths';

interface PolicyRequestImportWizardProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

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

type WizardStep = 'upload' | 'parsing' | 'review' | 'complete';

export const PolicyRequestImportWizard: React.FC<PolicyRequestImportWizardProps> = ({ open, onClose, workspaceId }) => {
  const [step, setStep] = useState<WizardStep>('upload');
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or Excel file');
      return;
    }

    setUploading(true);
    setError(null);
    setStep('parsing');
    setProgress(10);

    try {
      // Build storage path using centralized helper (ensures RLS policy match)
      const path = buildEvidencePath('policy-requests', workspaceId, file.name);
      
      console.log('[PolicyRequestImportWizard] Uploading to path:', path);
      
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(path, file, { upsert: false });

      if (uploadError) {
        console.error('[PolicyRequestImportWizard] Upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}. Path attempted: ${path}`);
      }
      setProgress(30);

      // Call edge function to parse policy request document
      // Pass bucket and path so the edge function can download via storage SDK
      const { data: parseData, error: parseError } = await invokeWithAuth('rfi_document_parser', {
        bucket: 'evidence',
        path: path,
        file_name: file.name,
        workspace_id: workspaceId
      });

      if (parseError) throw parseError;
      setProgress(90);

      // Set parse result
      const result = parseData as ParseResult;
      setParseResult(result);
      setProgress(100);
      setStep('review');

      toast({
        title: 'Policy Request Parsed Successfully',
        description: `Extracted ${result.metadata.total_questions} questions from the document.`,
      });
    } catch (err) {
      console.error('Policy request upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse policy request document');
      setStep('upload');
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Failed to parse policy request document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [workspaceId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleStartResponse = () => {
    if (!parseResult) return;
    
    // Navigate to Policy Request Response Editor with the new distribution
    navigate(routes.agency.policyRequestResponse(parseResult.distribution_id));
    onClose();
  };

  const handleClose = () => {
    setStep('upload');
    setProgress(0);
    setParseResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import External Policy Request</DialogTitle>
          <DialogDescription>
            Upload an external policy request document (PDF or Excel) to automatically extract questions and start responding
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <Card>
            <CardContent className="pt-6">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the policy request document here</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">Drag & drop policy request document here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports PDF and Excel files (max 20MB)</p>
                  </>
                )}
              </div>
              {error && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Parsing Step */}
        {step === 'parsing' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Parsing Policy Request Document</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI agents are extracting questions and analyzing requirements...
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Step */}
        {step === 'review' && parseResult && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parseResult.metadata.total_questions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Answerable</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{parseResult.metadata.auto_answerable}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Est. Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parseResult.metadata.estimated_time_minutes}m</div>
                </CardContent>
              </Card>
            </div>

            {/* Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Questions Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parseResult.questions.slice(0, 10).map((q, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{q.section} - Q{q.question_number}</span>
                        <div className="flex gap-1">
                          {q.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{q.question_type}</Badge>
                        </div>
                      </div>
                      <p className="text-sm">{q.question_text}</p>
                      {q.required_evidence.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Evidence: {q.required_evidence.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {parseResult.questions.length > 10 && (
                    <p className="text-sm text-center text-muted-foreground py-2">
                      + {parseResult.questions.length - 10} more questions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStartResponse} className="gap-2">
                Start Responding
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};