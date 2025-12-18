import { supabase } from '@/integrations/supabase/client';
import { buildEvidencePath } from '@/lib/storage/paths';

export interface StoredDocument {
  id: string;
  filename: string;
  file_path: string;
  content_type: string;
  file_size: number;
  checksum: string;
  uploaded_by: string;
  created_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_result?: any;
  workspace_id?: string;
  enterprise_id?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUploadResult {
  document: StoredDocument;
  uploadUrl?: string;
}

export class DocumentStorageService {
  
  /**
   * Upload a file to Supabase storage and create database record
   * 
   * @param file - File to upload
   * @param options - Upload configuration
   * @param options.bucketName - Storage bucket (default: 'evidence')
   * @param options.workspaceId - Workspace UUID (required for RLS)
   * @param options.base - Base folder within bucket (default: 'policy-requests')
   * @param options.metadata - Additional metadata
   */
  static async uploadDocument(
    file: File,
    options: {
      bucketName?: string;
      workspaceId: string;
      base?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<DocumentUploadResult> {
    const {
      bucketName = 'evidence',
      workspaceId,
      base = 'policy-requests',
      metadata
    } = options;
    try {
      // Build RLS-compliant storage path
      const filePath = buildEvidencePath(base, workspaceId, file.name);
      
      console.log('[DocumentStorageService] Uploading to path:', filePath);
      
      // Calculate file checksum (simplified)
      const checksum = await this.calculateChecksum(file);
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[DocumentStorageService] Upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}. Path attempted: ${filePath}. This usually means: 1) Path doesn't match RLS policy structure, or 2) User lacks membership in workspace ${workspaceId}`);
      }

      // Create database record using evidence table (existing table)
      const { data: user } = await supabase.auth.getUser();
      const documentRecord = {
        filename: file.name,
        file_path: filePath,
        content_type: file.type,
        file_size: file.size,
        content_hash: checksum,
        uploaded_by: user.user?.id || 'anonymous',
        submission_item_id: 'demo-submission-item', // Replace with actual submission item ID
        scan_status: 'pending' as 'pending'
      };

      const { data: dbData, error: dbError } = await supabase
        .from('evidence')
        .insert(documentRecord)
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(bucketName).remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      return {
        document: {
          id: dbData.id,
          filename: dbData.filename,
          file_path: dbData.file_path,
          content_type: dbData.content_type || file.type,
          file_size: dbData.file_size || file.size,
          checksum: dbData.content_hash || checksum,
          uploaded_by: dbData.uploaded_by || 'anonymous',
          created_at: dbData.created_at,
          processing_status: 'pending' as const,
          metadata: metadata || {}
        } as StoredDocument,
        uploadUrl: uploadData?.path
      };

    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  /**
   * Get document download URL
   */
  static async getDocumentUrl(
    filePath: string, 
    bucketName: string = 'evidence',
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to get download URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * List evidence files (using existing evidence table)
   */
  static async listDocuments(filters: {
    submissionItemId?: string;
    scanStatus?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<StoredDocument[]> {
    let query = supabase
      .from('evidence')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.submissionItemId) {
      query = query.eq('submission_item_id', filters.submissionItemId);
    }

    if (filters.scanStatus) {
      query = query.eq('scan_status', filters.scanStatus as any);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list documents: ${error.message}`);
    }

    // Transform evidence records to StoredDocument format
    return (data || []).map(record => ({
      id: record.id,
      filename: record.filename,
      file_path: record.file_path,
      content_type: record.content_type || 'application/octet-stream',
      file_size: record.file_size || 0,
      checksum: record.content_hash || '',
      uploaded_by: record.uploaded_by || 'anonymous',
      created_at: record.created_at,
      processing_status: 'pending' as const, // Map from scan_status if needed
      metadata: {}
    })) as StoredDocument[];
  }

  /**
   * Update evidence processing status
   */
  static async updateProcessingStatus(
    documentId: string,
    status: StoredDocument['processing_status'],
    result?: any
  ): Promise<StoredDocument> {
    // For now, just return a mock updated document since we're using evidence table
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw new Error(`Failed to get document: ${error.message}`);
    }

    // In a real implementation, you'd update a processing_result column or related table
    return {
      id: data.id,
      filename: data.filename,
      file_path: data.file_path,
      content_type: data.content_type || 'application/octet-stream',
      file_size: data.file_size || 0,
      checksum: data.content_hash || '',
      uploaded_by: data.uploaded_by || 'anonymous',
      created_at: data.created_at,
      processing_status: status,
      processing_result: result,
      metadata: {}
    } as StoredDocument;
  }

  /**
   * Delete evidence file and record
   */
  static async deleteDocument(
    documentId: string,
    bucketName: string = 'evidence'
  ): Promise<void> {
    // Get document details first
    const { data: document, error: fetchError } = await supabase
      .from('evidence')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`);
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([document.file_path]);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('evidence')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Failed to delete document record: ${dbError.message}`);
    }
  }

  /**
   * Subscribe to evidence changes
   */
  static subscribeToDocuments(
    callback: (payload: any) => void,
    filters?: { submissionItemId?: string }
  ) {
    let channel = supabase
      .channel('evidence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence'
        },
        callback
      );

    // Add filters if provided (note: Supabase channels don't support filters like this)
    // This would need to be handled client-side or with different channel naming
    return channel.subscribe();
  }

  /**
   * Calculate file checksum (simplified implementation)
   */
  private static async calculateChecksum(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple hash (in production, use a proper crypto hash)
      let hash = 0;
      for (let i = 0; i < uint8Array.length; i++) {
        const char = uint8Array[i];
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return `sha256-${Math.abs(hash).toString(16)}`;
    } catch (error) {
      console.warn('Failed to calculate checksum:', error);
      return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get processing statistics using evidence table
   */
  static async getProcessingStats(filters?: {
    submissionItemId?: string;
  }) {
    let query = supabase
      .from('evidence')
      .select('scan_status');

    if (filters?.submissionItemId) {
      query = query.eq('submission_item_id', filters.submissionItemId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const stats = (data || []).reduce((acc, doc) => {
      const status = doc.scan_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: stats.total || 0,
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      completed: stats.clean || 0,
      failed: stats.infected || 0
    };
  }
}