import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  error?: string | null;
}

export const DocumentUpload = ({ onFileSelect, isUploading, error }: DocumentUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
    disabled: isUploading
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-4">
              {isUploading ? (
                <>
                  <Upload className="h-12 w-12 text-primary animate-pulse" />
                  <div>
                    <p className="text-lg font-medium">Uploading document...</p>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop your policy document'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOCX, DOC, TXT (max 20MB)
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fileRejections.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fileRejections[0].errors[0].code === 'file-too-large'
              ? 'File is too large. Maximum size is 20MB.'
              : fileRejections[0].errors[0].code === 'file-invalid-type'
              ? 'Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.'
              : 'Error uploading file. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
