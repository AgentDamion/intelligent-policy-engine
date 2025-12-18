import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FileHashInputProps {
  value: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  onChange: (hash: string, name: string, size: number, type: string) => void;
}

export function FileHashInput({ value, fileName, fileSize, fileType, onChange }: FileHashInputProps) {
  const [isHashing, setIsHashing] = useState(false);

  const calculateHash = async (file: File) => {
    setIsHashing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      onChange(hashHex, file.name, file.size, file.type);
    } catch (error) {
      console.error('Error calculating hash:', error);
    } finally {
      setIsHashing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      calculateHash(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: isHashing,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>File Upload (Optional - Auto-generates SHA-256)</Label>
        <div
          {...getRootProps()}
          className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${isHashing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {isHashing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
              <p className="text-sm text-muted-foreground">Calculating SHA-256 hash...</p>
            </div>
          ) : value ? (
            <div className="flex flex-col items-center">
              <Check className="w-8 h-8 text-green-600 mb-2" />
              <File className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{fileName}</p>
              {fileSize && (
                <p className="text-xs text-muted-foreground">
                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll auto-generate the SHA-256 hash
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-foreground/25" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div>
        <Label htmlFor="manual-hash">Enter SHA-256 Hash Manually</Label>
        <Input
          id="manual-hash"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, '', 0, '')}
          placeholder="e.g., 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
          className="mt-2 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          64-character hexadecimal string
        </p>
      </div>

      {value && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-1">File Hash (SHA-256)</p>
          <p className="text-xs font-mono break-all">{value}</p>
        </div>
      )}
    </div>
  );
}
