import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { extensionsToMimeAccept } from '@/lib/mimeTypes';

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface DocumentUploadZoneProps {
  onFilesUploaded: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploadZone({
  onFilesUploaded,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
  className
}: DocumentUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return;

    const { toast } = useToast();
    setIsUploading(true);
    
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      file,
      status: 'uploading',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (const uploadFile of newFiles) {
      try {
        // Simulate upload progress for better UX
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress }
                : f
            )
          );
        }

        // Mark as completed
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );

        toast({
          title: "Upload Successful",
          description: `${uploadFile.file.name} has been uploaded successfully`,
        });

      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { 
                  ...f, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : f
          )
        );

        toast({
          title: "Upload Failed",
          description: `Failed to upload ${uploadFile.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    onFilesUploaded(acceptedFiles);
  }, [disabled, isUploading, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: extensionsToMimeAccept(acceptedFileTypes),
    maxSize: maxFileSize,
    maxFiles: maxFiles - uploadedFiles.filter(f => f.status === 'completed').length,
    disabled: disabled || isUploading,
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  const hasErrors = uploadedFiles.some(f => f.status === 'error') || fileRejections.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <Card className={cn(
        "transition-colors duration-200 cursor-pointer",
        isDragActive && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed",
        hasErrors && "border-destructive"
      )}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className="flex flex-col items-center justify-center text-center space-y-4"
          >
            <input {...getInputProps()} />
            
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isDragActive ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Upload className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragActive ? "Drop files here" : "Upload Documents"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files here or click to select
              </p>
              <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground">
                <span>Supported formats:</span>
                {acceptedFileTypes.map((type, index) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, {formatFileSize(maxFileSize)} each
              </p>
            </div>

            {!disabled && (
              <Button variant="outline" size="sm" className="mt-2">
                Choose Files
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-destructive">
                  Some files were rejected:
                </h4>
                {fileRejections.map(({ file, errors }) => (
                  <div key={file.name} className="text-xs text-muted-foreground">
                    <span className="font-medium">{file.name}:</span> {errors[0]?.message}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <File className="h-4 w-4" />
              Uploaded Files ({completedFiles.length}/{uploadedFiles.length})
            </h4>
            
            <div className="space-y-2">
              {uploadedFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </span>
                    </div>
                    
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-1 mt-1" />
                    )}
                    
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    {uploadFile.status === 'uploading' && (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}