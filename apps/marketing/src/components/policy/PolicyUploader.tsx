import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PolicyUploaderProps {
  enterpriseId: string;
  onSuccess?: () => void;
}

export const PolicyUploader: React.FC<PolicyUploaderProps> = ({ enterpriseId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enterprise_id', enterpriseId);

      const { data, error } = await supabase.functions.invoke('ingest-policy', {
        body: formData
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: 'Policy Uploaded',
        description: `Successfully processed ${data.clauses_count} clauses${data.needs_review > 0 ? ` (${data.needs_review} need review)` : ''}`,
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      const isAuthError = error?.message?.toLowerCase().includes('unauthorized') || 
                          error?.message?.toLowerCase().includes('auth');
      toast({
        title: isAuthError ? 'Authentication Required' : 'Upload Failed',
        description: isAuthError 
          ? 'Please sign in to upload policies' 
          : error?.message || 'Failed to process policy document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const getSupportedFormats = () => {
    return [
      { name: 'Markdown', ext: '.md', desc: 'With YAML front-matter (recommended)' },
      { name: 'JSON', ext: '.json', desc: 'Canonical policy schema' },
      { name: 'Coming Soon', ext: '', desc: 'DOCX, PDF, CSV, YAML' }
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Policy Document
        </CardTitle>
        <CardDescription>
          Upload policy files in multiple formats - they'll be normalized and classified automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supported Formats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Supported Formats</h4>
          <div className="grid gap-2">
            {getSupportedFormats().map((format, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">{format.name}</span>
                  {format.ext && <span className="text-muted-foreground"> ({format.ext})</span>}
                  <span className="text-muted-foreground"> - {format.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".md,.json"
              onChange={handleFileChange}
              className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={uploading}
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>

          {file && !uploading && !result && (
            <div className="text-sm text-muted-foreground">
              Ready to upload: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Upload Result */}
        {result && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <div className="font-medium">Upload Complete</div>
                  <div className="text-sm text-muted-foreground">
                    Policy ID: {result.policy_id}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Clauses</div>
                <div className="text-2xl font-bold">{result.clauses_count}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Needs Review</div>
                <div className="text-2xl font-bold">{result.needs_review}</div>
              </div>
            </div>

            {result.needs_review > 0 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-md">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-warning">Human Review Required</div>
                  <div className="text-muted-foreground">
                    {result.needs_review} clauses have low confidence scores and need manual lane assignment
                  </div>
                </div>
              </div>
            )}

            <Progress value={result.needs_review === 0 ? 100 : 70} className="h-2" />
            <div className="text-xs text-center text-muted-foreground">
              {result.needs_review === 0 ? 'Ready to use' : 'Pending review'}
            </div>
          </div>
        )}

        {/* Author Guidelines */}
        <div className="p-4 border-l-4 border-primary bg-muted/50 space-y-2">
          <h4 className="font-medium text-sm">💡 Authoring Tips for Better Auto-Classification</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use YAML front-matter for metadata (title, version, owner, effective_date)</li>
            <li>• Include a "Clause Catalog" section with one clause per line</li>
            <li>• Start enforceable clauses with "must", "shall", or "prohibited"</li>
            <li>• Reference controls/evidence as comma-separated tokens</li>
            <li>• Add lane hints if known (lane: security_access)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
