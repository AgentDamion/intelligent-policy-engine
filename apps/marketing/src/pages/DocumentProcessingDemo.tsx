import React, { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  DocumentUploadZone,
  DocumentProcessingPipeline,
  ProcessingStatusTracker,
  DocumentPreview,
  DocumentLibrary,
  defaultProcessingStages
} from '@/components/documents';
import type { ProcessingStage, ProcessingJob } from '@/components/documents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Cpu, 
  Upload,
  BarChart3,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  tags?: string[];
  version?: number;
  checksum?: string;
}

export default function DocumentProcessingDemo() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [currentStages, setCurrentStages] = useState<ProcessingStage[]>(defaultProcessingStages);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  // File upload handler
  const handleFilesUploaded = useCallback((files: File[]) => {
    const newDocuments: DocumentFile[] = files.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      uploadedBy: 'Demo User',
      processingStatus: 'pending' as const,
      checksum: `sha256-${Math.random().toString(36).substr(2, 16)}`,
      version: 1,
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Create processing jobs
    const newJobs: ProcessingJob[] = newDocuments.map((doc) => ({
      id: `job-${doc.id}`,
      documentName: doc.filename,
      status: 'queued' as const,
      progress: 0,
      currentStage: 'Queued for processing',
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + 30000), // 30 seconds from now
    }));

    setProcessingJobs(prev => [...prev, ...newJobs]);

    // Auto-start processing for demo
    setTimeout(() => {
      startProcessing(newJobs[0]);
    }, 1000);

    toast({
      title: "Files Uploaded",
      description: `${files.length} file(s) uploaded successfully and queued for processing`,
    });
  }, [toast]);

  // Start processing simulation
  const startProcessing = useCallback(async (job: ProcessingJob) => {
    const stages = [...defaultProcessingStages];
    
    // Update job status
    setProcessingJobs(prev => 
      prev.map(j => j.id === job.id ? { ...j, status: 'processing' as const } : j)
    );

    // Update document status
    setDocuments(prev =>
      prev.map(doc => 
        job.documentName === doc.filename 
          ? { ...doc, processingStatus: 'processing' as const }
          : doc
      )
    );

    // Process each stage
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const startTime = Date.now();
      
      // Update stage to processing
      const updatedStages = stages.map((s, index) => 
        index === i ? { ...s, status: 'processing' as const, progress: 0 } : s
      );
      setCurrentStages(updatedStages);

      // Update job current stage
      setProcessingJobs(prev => 
        prev.map(j => j.id === job.id ? { 
          ...j, 
          currentStage: stage.name,
          progress: (i / stages.length) * 100
        } : j)
      );

      // Simulate processing time with progress updates
      const processingTime = 1000 + Math.random() * 2000; // 1-3 seconds
      const progressSteps = 10;
      
      for (let step = 0; step <= progressSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, processingTime / progressSteps));
        
        const progress = (step / progressSteps) * 100;
        setCurrentStages(prev => 
          prev.map((s, index) => 
            index === i ? { ...s, progress } : s
          )
        );
      }

      // Complete the stage
      const duration = Date.now() - startTime;
      const completedStages = stages.map((s, index) => 
        index === i ? { 
          ...s, 
          status: 'completed' as const, 
          duration,
          result: generateStageResult(stage.id)
        } : s
      );
      setCurrentStages(completedStages);
      stages.splice(i, 1, completedStages[i]);
    }

    // Complete the job
    const finalResult = {
      confidence: 0.85 + Math.random() * 0.1,
      outcome: Math.random() > 0.2 ? 'APPROVED' : 'REJECTED',
      extractedText: `Processed content from ${job.documentName}`,
      pages: Math.ceil(Math.random() * 10) + 1,
    };

    setProcessingJobs(prev => 
      prev.map(j => j.id === job.id ? { 
        ...j, 
        status: 'completed' as const,
        endTime: new Date(),
        progress: 100,
        results: finalResult
      } : j)
    );

    setDocuments(prev =>
      prev.map(doc => 
        job.documentName === doc.filename 
          ? { ...doc, processingStatus: 'completed' as const }
          : doc
      )
    );

    toast({
      title: "Processing Complete",
      description: `${job.documentName} has been processed successfully`,
    });
  }, [toast]);

  const generateStageResult = (stageId: string) => {
    switch (stageId) {
      case 'validation':
        return { valid: true, checks: ['format', 'size', 'encoding'] };
      case 'parsing':
        return { method: 'ai-agent', confidence: 0.92, pages: 3 };
      case 'analysis':
        return { sentiment: 'neutral', risks: ['low'], compliance: 'passed' };
      case 'compliance':
        return { score: 0.89, violations: [], recommendations: [] };
      default:
        return { status: 'completed' };
    }
  };

  const handleRetryJob = useCallback((job: ProcessingJob) => {
    setProcessingJobs(prev => 
      prev.map(j => j.id === job.id ? { 
        ...j, 
        status: 'queued' as const,
        progress: 0,
        error: undefined
      } : j)
    );
    
    setTimeout(() => startProcessing(job), 500);
  }, [startProcessing]);

  const handleViewResults = useCallback((job: ProcessingJob) => {
    const doc = documents.find(d => d.filename === job.documentName);
    if (doc) {
      setSelectedDocument(doc);
      setActiveTab('preview');
    }
  }, [documents]);

  const stats = {
    totalDocuments: documents.length,
    processing: processingJobs.filter(j => j.status === 'processing').length,
    completed: processingJobs.filter(j => j.status === 'completed').length,
    failed: processingJobs.filter(j => j.status === 'failed').length,
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Document Processing</h1>
            <p className="text-muted-foreground">
              Upload and process documents through the AI-powered pipeline
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <div className="text-sm text-muted-foreground">Total Documents</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Uploaded</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.totalDocuments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Processing</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.processing}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <DocumentUploadZone
              onFilesUploaded={handleFilesUploaded}
              maxFiles={10}
              maxFileSize={20 * 1024 * 1024} // 20MB
            />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <DocumentProcessingPipeline
              stages={currentStages}
              onStageClick={(stage) => {
                toast({
                  title: stage.name,
                  description: stage.description,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <ProcessingStatusTracker
              jobs={processingJobs}
              onRetry={handleRetryJob}
              onViewResults={handleViewResults}
            />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <DocumentLibrary
              documents={documents}
              onDocumentSelect={setSelectedDocument}
              onDocumentPreview={(doc) => {
                setSelectedDocument(doc);
                setActiveTab('preview');
              }}
              onDocumentDownload={(doc) => {
                toast({
                  title: "Download Started",
                  description: `Downloading ${doc.filename}`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {selectedDocument ? (
              <DocumentPreview
                document={{
                  filename: selectedDocument.filename,
                  size: selectedDocument.size,
                  type: selectedDocument.type,
                  uploadedAt: selectedDocument.uploadedAt,
                  uploadedBy: selectedDocument.uploadedBy,
                  checksum: selectedDocument.checksum,
                  processingStatus: selectedDocument.processingStatus,
                }}
                processingResult={selectedDocument.processingStatus === 'completed' ? {
                  extractedText: `This is the extracted content from ${selectedDocument.filename}.\n\nThe document has been successfully processed using our AI-powered pipeline, which includes validation, parsing, analysis, and compliance checking.\n\nKey findings:\n- Document structure is valid\n- Content meets compliance requirements\n- No security risks detected\n- Processing completed with high confidence`,
                  confidence: 0.89,
                  parsingMethod: 'ai-agent',
                  metadata: {
                    processingTime: '2.3s',
                    language: 'en',
                    encoding: 'utf-8',
                    wordCount: 245,
                  },
                  pages: Math.ceil(selectedDocument.size / 1000),
                } : undefined}
                onDownload={() => {
                  toast({
                    title: "Download Started",
                    description: `Downloading ${selectedDocument.filename}`,
                  });
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                  <p className="text-muted-foreground">
                    Select a document from the library to preview its content and processing results.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}