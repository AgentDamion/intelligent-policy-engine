import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMode } from '@/contexts/ModeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Settings, Upload, Sparkles } from 'lucide-react';
import { DocumentUpload } from '@/components/policy-import/DocumentUpload';
import { PolicyMetadataForm, PolicyMetadata } from '@/components/policy-import/PolicyMetadataForm';
import { useToast } from '@/hooks/use-toast';

type WizardStep = 'upload' | 'metadata' | 'processing' | 'success';

const PolicyImportWizard = () => {
  const { setMode } = useMode();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [policyMetadata, setPolicyMetadata] = useState<PolicyMetadata | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [createdPolicyId, setCreatedPolicyId] = useState<string | null>(null);

  useEffect(() => {
    setMode('enterprise');
  }, [setMode]);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setUploadError(null);
    setIsUploading(true);

    try {
      // Get current user and their enterprise
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: enterpriseMember } = await supabase
        .from('enterprise_members')
        .select('enterprise_id')
        .eq('user_id', user.id)
        .single();

      if (!enterpriseMember) throw new Error('No enterprise found');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${enterpriseMember.enterprise_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('policy-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setStoragePath(filePath);
      setCurrentStep('metadata');
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload document');
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMetadataSubmit = async (metadata: PolicyMetadata) => {
    setPolicyMetadata(metadata);
    setCurrentStep('processing');

    try {
      // Get current user and enterprise
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: enterpriseMember } = await supabase
        .from('enterprise_members')
        .select('enterprise_id')
        .single();

      if (!enterpriseMember) throw new Error('No enterprise found');

      // Simulate processing stages
      setProcessingProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create policy record
      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .insert({
          title: metadata.title,
          description: metadata.description,
          framework: metadata.framework,
          enterprise_id: enterpriseMember.enterprise_id,
          source_document_path: storagePath,
          document_metadata: {
            original_filename: uploadedFile?.name,
            file_size: uploadedFile?.size,
            file_type: uploadedFile?.type,
            uploaded_at: new Date().toISOString(),
          },
          status: 'draft'
        })
        .select()
        .single();

      if (policyError) throw policyError;

      setProcessingProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create initial policy version
      const { error: versionError } = await supabase
        .from('policy_versions')
        .insert({
          policy_id: policy.id,
          title: metadata.title,
          description: metadata.description,
          version_number: parseInt(metadata.version.split('.')[0]) || 1,
          status: 'draft'
        });

      if (versionError) throw versionError;

      setProcessingProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      // TODO: Trigger edge function for clause extraction
      // await supabase.functions.invoke('ingest-policy', {
      //   body: { policyId: policy.id, storagePath }
      // });

      setProcessingProgress(100);
      setCreatedPolicyId(policy.id);
      setCurrentStep('success');

      toast({
        title: 'Success',
        description: 'Policy imported successfully',
      });
    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to process policy',
        variant: 'destructive',
      });
      setCurrentStep('metadata');
    }
  };

  const stepProgress = {
    upload: 0,
    metadata: 33,
    processing: 66,
    success: 100,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import Policy Document</h1>
        <p className="text-muted-foreground mt-2">
          Upload and process compliance policy documents
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={stepProgress[currentStep]} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className={currentStep === 'upload' ? 'text-primary font-medium' : ''}>Upload</span>
          <span className={currentStep === 'metadata' ? 'text-primary font-medium' : ''}>Details</span>
          <span className={currentStep === 'processing' ? 'text-primary font-medium' : ''}>Processing</span>
          <span className={currentStep === 'success' ? 'text-primary font-medium' : ''}>Complete</span>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>Upload Document</CardTitle>
            </div>
            <CardDescription>
              Select a policy document to import into your compliance system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              error={uploadError}
            />
          </CardContent>
        </Card>
      )}

      {currentStep === 'metadata' && uploadedFile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Policy Details</CardTitle>
            </div>
            <CardDescription>
              Provide metadata for: <strong>{uploadedFile.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PolicyMetadataForm
              fileName={uploadedFile.name}
              onSubmit={handleMetadataSubmit}
              onBack={() => setCurrentStep('upload')}
            />
          </CardContent>
        </Card>
      )}

      {currentStep === 'processing' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle>Processing Policy</CardTitle>
            </div>
            <CardDescription>
              Analyzing document and extracting policy clauses...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={processingProgress} className="h-3" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className={`h-5 w-5 ${processingProgress >= 20 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm">Document uploaded</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className={`h-5 w-5 ${processingProgress >= 50 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm">Policy record created</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className={`h-5 w-5 ${processingProgress >= 80 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm">Initial version created</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className={`h-5 w-5 ${processingProgress === 100 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm">Processing complete</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'success' && policyMetadata && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Import Successful</CardTitle>
            </div>
            <CardDescription>
              Your policy document has been imported and is ready for review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Policy Title:</span>
                <span className="font-medium">{policyMetadata.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Framework:</span>
                <Badge variant="outline">{policyMetadata.framework}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Version:</span>
                <span className="font-medium">{policyMetadata.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source:</span>
                <span className="text-sm">{uploadedFile?.name}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/enterprise/policies')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                View All Policies
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setCurrentStep('upload');
                  setUploadedFile(null);
                  setStoragePath(null);
                  setPolicyMetadata(null);
                  setCreatedPolicyId(null);
                }}
              >
                Import Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PolicyImportWizard;
