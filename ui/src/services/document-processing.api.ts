import { get, post, put, del } from './api';

// Types for document processing
export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'parsed' | 'error' | 'validated';
  progress: number;
  checksum?: string;
  parsedContent?: string;
  confidence?: number;
  parsingMethod?: 'ai' | 'textract' | 'template';
  error?: string;
  uploadedAt: Date;
  processedAt?: Date;
}

export interface ProcessingResult {
  documentId: string;
  documentName: string;
  status: 'success' | 'failed';
  parsedContent: string;
  confidence: number;
  parsingMethod: 'ai' | 'textract' | 'template';
  processingTime: number;
  error?: string;
}

export interface TripleFailoverResult {
  method: 'ai' | 'textract' | 'template';
  confidence: number;
  content: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

// Document Processing API
export const documentProcessingApi = {
  // Upload document
  async uploadDocument(file: File): Promise<DocumentFile> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Process document through triple-failover pipeline
  async processDocument(documentId: string): Promise<ProcessingResult> {
    return post<ProcessingResult>(`/api/documents/${documentId}/process`, {});
  },

  // Get processing status
  async getProcessingStatus(documentId: string): Promise<ProcessingResult> {
    return get<ProcessingResult>(`/api/documents/${documentId}/status`);
  },

  // Run triple-failover parsing
  async runTripleFailover(documentId: string): Promise<TripleFailoverResult> {
    return post<TripleFailoverResult>(`/api/documents/${documentId}/triple-failover`, {});
  },

  // Get document content
  async getDocumentContent(documentId: string): Promise<{ content: string; confidence: number }> {
    return get<{ content: string; confidence: number }>(`/api/documents/${documentId}/content`);
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    return del<void>(`/api/documents/${documentId}`);
  },

  // Get processing pipeline status
  async getPipelineStatus(sessionId: string): Promise<{
    stage: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    results?: ProcessingResult[];
  }> {
    return get<{
      stage: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      progress: number;
      results?: ProcessingResult[];
    }>(`/api/documents/pipeline/${sessionId}/status`);
  }
};

// Integration with existing tools API
export const integrateWithToolsApi = {
  // Create submission with document processing
  async createSubmissionWithDocuments(files: File[]): Promise<{
    submissionId: string;
    documents: DocumentFile[];
  }> {
    // Upload documents first
    const documents = await Promise.all(
      files.map(file => documentProcessingApi.uploadDocument(file))
    );

    // Create submission with document references
    const submissionData = {
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        status: doc.status
      }))
    };

    return post<{
      submissionId: string;
      documents: DocumentFile[];
    }>('/api/tools/submissions/with-documents', submissionData);
  },

  // Run precheck with document analysis
  async runPrecheckWithDocuments(submissionId: string): Promise<{
    toolAnalysis: any;
    documentAnalysis: ProcessingResult[];
    combinedConfidence: number;
  }> {
    return post<{
      toolAnalysis: any;
      documentAnalysis: ProcessingResult[];
      combinedConfidence: number;
    }>(`/api/tools/submissions/${submissionId}/precheck-with-documents`, {});
  }
};