import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EvidenceFile {
  id: string;
  filename: string;
  content_type?: string;
  file_size?: number;
  file_path: string;
  scan_status: 'pending' | 'scanning' | 'clean' | 'infected' | 'quarantined' | 'error';
  scan_result?: any;
  created_at: string;
  uploaded_by?: string;
  submission_item_id: string;
}

export const useEvidenceFiles = (submissionItemId?: string) => {
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    if (!submissionItemId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('submission_item_id', submissionItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (err) {
      console.error('Error fetching evidence:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch evidence');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file: EvidenceFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      throw new Error('Failed to download file');
    }
  };

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return '📄';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('image')) return '🖼️';
    if (contentType.includes('video')) return '🎥';
    if (contentType.includes('audio')) return '🎵';
    if (contentType.includes('text')) return '📝';
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
    return '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchEvidence();
  }, [submissionItemId]);

  return { 
    evidence, 
    loading, 
    error, 
    refetch: fetchEvidence,
    downloadFile,
    getFileIcon,
    formatFileSize
  };
};