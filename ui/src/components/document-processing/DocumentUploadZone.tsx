import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Card, Progress, Alert } from '@/components/ui';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Eye,
  Download,
  Trash2,
  Clock,
  Shield
} from 'lucide-react';

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

interface DocumentUploadZoneProps {
  onDocumentsChange: (documents: DocumentFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

export function DocumentUploadZone({
  onDocumentsChange,
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.docx', '.txt', '.doc'],
  maxSize = 50,
  className = ''
}: DocumentUploadZoneProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    
    const newDocuments: DocumentFile[] = acceptedFiles.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date()
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    onDocumentsChange([...documents, ...newDocuments]);

    // Simulate upload and processing
    for (const doc of newDocuments) {
      await simulateDocumentProcessing(doc);
    }
    
    setIsProcessing(false);
  }, [documents, onDocumentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    disabled: isProcessing
  });

  const simulateDocumentProcessing = async (doc: DocumentFile) => {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDocuments(prev => prev.map(d => 
        d.id === doc.id ? { ...d, progress: i, status: i < 100 ? 'uploading' : 'processing' } : d
      ));
    }

    // Simulate processing with triple-failover parsing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const parsingMethods = ['ai', 'textract', 'template'] as const;
    const method = parsingMethods[Math.floor(Math.random() * parsingMethods.length)];
    const confidence = method === 'ai' ? 0.9 : method === 'textract' ? 0.7 : 0.5;
    
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? {
        ...d,
        status: 'parsed',
        progress: 100,
        parsedContent: `Extracted content from ${doc.name} using ${method.toUpperCase()} parsing method.`,
        confidence,
        parsingMethod: method,
        processedAt: new Date()
      } : d
    ));
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      onDocumentsChange(updated);
      return updated;
    });
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'parsed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'validated':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'parsed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'validated':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getParsingMethodLabel = (method?: string) => {
    switch (method) {
      case 'ai': return 'AI Parser';
      case 'textract': return 'AWS Textract';
      case 'template': return 'Template Parser';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop documents here' : 'Upload Documents'}
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <div className="text-sm text-gray-500">
            <p>Accepted formats: {acceptedTypes.join(', ')}</p>
            <p>Max file size: {maxSize}MB • Max files: {maxFiles}</p>
          </div>
        </div>
      </Card>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Documents ({documents.length})
          </h4>
          {documents.map((doc) => (
            <Card key={doc.id} className={`p-4 ${getStatusColor(doc.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </h5>
                      <span className="text-xs text-gray-500">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    {(doc.status === 'uploading' || doc.status === 'processing') && (
                      <div className="mb-2">
                        <Progress value={doc.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                        </p>
                      </div>
                    )}

                    {/* Processing Results */}
                    {doc.status === 'parsed' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            Parsed with {getParsingMethodLabel(doc.parsingMethod)}
                          </span>
                          <span className="font-medium text-gray-900">
                            {Math.round((doc.confidence || 0) * 100)}% confidence
                          </span>
                        </div>
                        {doc.parsedContent && (
                          <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                            {doc.parsedContent}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Uploaded: {doc.uploadedAt.toLocaleTimeString()}</span>
                          {doc.processedAt && (
                            <span>Processed: {doc.processedAt.toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {doc.status === 'error' && (
                      <div className="text-red-600 text-sm">
                        <p className="font-medium">Processing failed</p>
                        <p className="text-xs">{doc.error}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {doc.status === 'parsed' && (
                    <>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeDocument(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Processing Summary */}
      {documents.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'parsed').length}
              </div>
              <div className="text-xs text-gray-600">Successfully Parsed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'processing' || d.status === 'uploading').length}
              </div>
              <div className="text-xs text-gray-600">Processing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(documents.reduce((acc, d) => acc + (d.confidence || 0), 0) / documents.length * 100) || 0}%
              </div>
              <div className="text-xs text-gray-600">Avg Confidence</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}