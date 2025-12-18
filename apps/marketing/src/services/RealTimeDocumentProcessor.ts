import { supabase } from '@/integrations/supabase/client';
import { DocumentStorageService } from './DocumentStorageService';
import { DeterministicProcessor } from './processing/deterministic-processor';
import { PolicyOrchestrator } from './orchestrator/policy-orchestrator';
import { PolicyDocument } from '@/contracts';

export interface RealTimeProcessingJob {
  id: string;
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  currentStage: string;
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  processingStages: ProcessingStageStatus[];
}

export interface ProcessingStageStatus {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export interface ProcessingProgress {
  jobId: string;
  stage: string;
  progress: number;
  message?: string;
  data?: any;
}

export class RealTimeDocumentProcessor {
  private static processingJobs = new Map<string, RealTimeProcessingJob>();
  private static progressCallbacks = new Map<string, (progress: ProcessingProgress) => void>();
  
  /**
   * Start processing a document with real-time updates
   */
  static async startProcessing(
    documentId: string,
    enterpriseId: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<string> {
    const jobId = `job-${documentId}-${Date.now()}`;
    
    // Create processing job
    const job: RealTimeProcessingJob = {
      id: jobId,
      documentId,
      status: 'queued',
      currentStage: 'Initializing',
      progress: 0,
      startTime: new Date(),
      processingStages: [
        { id: 'fetch', name: 'Fetching Document', status: 'pending' },
        { id: 'validate', name: 'Validating Format', status: 'pending' },
        { id: 'parse', name: 'Parsing Content', status: 'pending' },
        { id: 'analyze', name: 'AI Analysis', status: 'pending' },
        { id: 'compliance', name: 'Compliance Check', status: 'pending' },
        { id: 'finalize', name: 'Finalizing Results', status: 'pending' }
      ]
    };

    this.processingJobs.set(jobId, job);
    
    if (onProgress) {
      this.progressCallbacks.set(jobId, onProgress);
    }

    // Start processing in background
    this.processDocument(jobId, enterpriseId).catch(error => {
      console.error('Processing failed:', error);
      this.updateJobStatus(jobId, 'failed', undefined, error.message);
    });

    return jobId;
  }

  /**
   * Get current job status
   */
  static getJobStatus(jobId: string): RealTimeProcessingJob | null {
    return this.processingJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  static getActiveJobs(): RealTimeProcessingJob[] {
    return Array.from(this.processingJobs.values())
      .filter(job => job.status === 'processing' || job.status === 'queued');
  }

  /**
   * Cancel a processing job
   */
  static cancelJob(jobId: string): boolean {
    const job = this.processingJobs.get(jobId);
    if (job && (job.status === 'queued' || job.status === 'processing')) {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.endTime = new Date();
      this.notifyProgress(jobId, 'Cancelled', 100, 'Processing cancelled');
      return true;
    }
    return false;
  }

  /**
   * Main processing pipeline
   */
  private static async processDocument(jobId: string, enterpriseId: string): Promise<void> {
    const job = this.processingJobs.get(jobId);
    if (!job) return;

    try {
      // Update to processing status
      this.updateJobStatus(jobId, 'processing');
      
      // Stage 1: Fetch Document
      await this.executeStage(jobId, 'fetch', async () => {
        const { data: document, error } = await supabase
          .from('evidence')
          .select('*')
          .eq('id', job.documentId)
          .single();

        if (error) {
          throw new Error(`Failed to fetch document: ${error.message}`);
        }

        // Update document status in database
        await DocumentStorageService.updateProcessingStatus(job.documentId, 'processing');

        return { document };
      });

      // Stage 2: Validate Format
      await this.executeStage(jobId, 'validate', async () => {
        const document = job.processingStages.find(s => s.id === 'fetch')?.result?.document;
        
        // Basic validation
        const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (document.content_type && !validTypes.includes(document.content_type)) {
          throw new Error(`Unsupported file type: ${document.content_type}`);
        }

        if (document.file_size && document.file_size > 50 * 1024 * 1024) { // 50MB limit
          throw new Error('File too large (max 50MB)');
        }

        return { validated: true, fileType: document.content_type };
      });

      // Stage 3: Parse Content
      await this.executeStage(jobId, 'parse', async () => {
        const document = job.processingStages.find(s => s.id === 'fetch')?.result?.document;
        
        // Download file content
        const downloadUrl = await DocumentStorageService.getDocumentUrl(document.file_path);
        const response = await fetch(downloadUrl);
        const content = await response.text();

        // Create PolicyDocument for processing
        const policyDocument: PolicyDocument = {
          id: document.id,
          enterpriseId,
          title: document.filename,
          content,
          mimeType: (document.content_type || 'application/octet-stream') as any,
          checksumSha256: document.content_hash || '',
          hasPHI: false
        };

        // Use DeterministicProcessor
        const parsedResult = await DeterministicProcessor.processDocument(policyDocument, {
          timeoutMs: 30000
        });

        return { parsedDocument: parsedResult, originalContent: content };
      });

      // Stage 4: AI Analysis
      await this.executeStage(jobId, 'analyze', async () => {
        const parseResult = job.processingStages.find(s => s.id === 'parse')?.result;
        
        // Simulate AI analysis (replace with actual AI service)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const aiAnalysis = {
          sentiment: 'neutral',
          keyTopics: ['compliance', 'policy', 'requirements'],
          riskFactors: Math.random() > 0.7 ? ['data-privacy'] : [],
          confidence: 0.85 + Math.random() * 0.1
        };

        return aiAnalysis;
      });

      // Stage 5: Compliance Check
      await this.executeStage(jobId, 'compliance', async () => {
        const parseResult = job.processingStages.find(s => s.id === 'parse')?.result;
        const aiAnalysis = job.processingStages.find(s => s.id === 'analyze')?.result;
        
        // Use PolicyOrchestrator for full compliance pipeline
        const document = job.processingStages.find(s => s.id === 'fetch')?.result?.document;
        const policyDocument: PolicyDocument = {
          id: document.id,
          enterpriseId,
          title: document.filename,
          content: parseResult.originalContent,
          mimeType: (document.content_type || 'application/octet-stream') as any,
          checksumSha256: document.content_hash || '',
          hasPHI: false
        };

        const orchestratorResult = await PolicyOrchestrator.processPolicy(
          policyDocument,
          enterpriseId,
          { timeoutMs: 30000 }
        );

        return orchestratorResult;
      });

      // Stage 6: Finalize Results
      await this.executeStage(jobId, 'finalize', async () => {
        const allResults = {
          parseResult: job.processingStages.find(s => s.id === 'parse')?.result,
          aiAnalysis: job.processingStages.find(s => s.id === 'analyze')?.result,
          complianceResult: job.processingStages.find(s => s.id === 'compliance')?.result
        };

        // Update document with final results
        await DocumentStorageService.updateProcessingStatus(
          job.documentId,
          'completed',
          allResults
        );

        return allResults;
      });

      // Mark job as completed
      this.updateJobStatus(jobId, 'completed', 'Processing completed successfully');

    } catch (error) {
      console.error('Document processing failed:', error);
      
      // Update document status
      await DocumentStorageService.updateProcessingStatus(job.documentId, 'failed');
      
      // Mark job as failed
      this.updateJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Execute a processing stage with error handling and progress updates
   */
  private static async executeStage(
    jobId: string,
    stageId: string,
    stageFunction: () => Promise<any>
  ): Promise<void> {
    const job = this.processingJobs.get(jobId);
    if (!job) return;

    const stage = job.processingStages.find(s => s.id === stageId);
    if (!stage) return;

    try {
      // Mark stage as processing
      stage.status = 'processing';
      stage.startTime = new Date();
      
      this.notifyProgress(jobId, stage.name, job.progress, `Processing ${stage.name.toLowerCase()}...`);

      // Execute stage
      const result = await stageFunction();

      // Mark stage as completed
      stage.status = 'completed';
      stage.endTime = new Date();
      stage.result = result;

      // Update overall progress
      const completedStages = job.processingStages.filter(s => s.status === 'completed').length;
      job.progress = (completedStages / job.processingStages.length) * 100;
      job.currentStage = stage.name;

      this.notifyProgress(jobId, stage.name, job.progress, `${stage.name} completed`);

    } catch (error) {
      // Mark stage as failed
      stage.status = 'failed';
      stage.endTime = new Date();
      stage.error = error instanceof Error ? error.message : 'Unknown error';

      throw error;
    }
  }

  /**
   * Update job status and notify listeners
   */
  private static updateJobStatus(
    jobId: string,
    status: RealTimeProcessingJob['status'],
    message?: string,
    error?: string
  ): void {
    const job = this.processingJobs.get(jobId);
    if (!job) return;

    job.status = status;
    if (error) job.error = error;
    if (status === 'completed' || status === 'failed') {
      job.endTime = new Date();
    }

    this.notifyProgress(jobId, job.currentStage, job.progress, message);
  }

  /**
   * Notify progress listeners
   */
  private static notifyProgress(
    jobId: string,
    stage: string,
    progress: number,
    message?: string,
    data?: any
  ): void {
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback({
        jobId,
        stage,
        progress,
        message,
        data
      });
    }

    // Broadcast to all connected clients via Supabase realtime
    this.broadcastProgress(jobId, stage, progress, message, data);
  }

  /**
   * Broadcast progress updates via Supabase realtime
   */
  private static broadcastProgress(
    jobId: string,
    stage: string,
    progress: number,
    message?: string,
    data?: any
  ): void {
    supabase.channel('document-processing')
      .send({
        type: 'broadcast',
        event: 'processing_progress',
        payload: {
          jobId,
          stage,
          progress,
          message,
          data,
          timestamp: new Date().toISOString()
        }
      })
      .catch(error => {
        console.warn('Failed to broadcast progress:', error);
      });
  }

  /**
   * Subscribe to processing updates
   */
  static subscribeToProgress(
    callback: (payload: any) => void
  ) {
    const channel = supabase.channel('document-processing')
      .on('broadcast', { event: 'processing_progress' }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Clean up completed jobs (call periodically)
   */
  static cleanupJobs(): void {
    const now = new Date();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [jobId, job] of this.processingJobs.entries()) {
      if (job.endTime && (now.getTime() - job.endTime.getTime()) > maxAge) {
        this.processingJobs.delete(jobId);
        this.progressCallbacks.delete(jobId);
      }
    }
  }
}