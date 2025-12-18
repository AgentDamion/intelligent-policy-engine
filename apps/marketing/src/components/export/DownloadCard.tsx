import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Hash, Clock, FileText, Database, Code } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditPacket } from '@/lib/export/auditPacket';

interface DownloadCardProps {
  packet: AuditPacket;
  onDownload: (url: string) => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({ packet, onDownload }) => {
  const isExpired = new Date(packet.expiresAt) < new Date();
  const timeUntilExpiry = Math.ceil((new Date(packet.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'csv': return <Database className="h-4 w-4" />;
      case 'json': return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={`transition-colors ${isExpired ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Audit Packet Export</CardTitle>
            <CardDescription>
              Generated {format(new Date(packet.exportedAt), 'PPP p')}
            </CardDescription>
          </div>
          <Badge variant={isExpired ? 'destructive' : 'secondary'}>
            {isExpired ? 'Expired' : `${timeUntilExpiry}d left`}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Export Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Records:</span>
            <span className="ml-2 font-medium">{packet.totalRecords.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Client:</span>
            <span className="ml-2 font-medium">
              {packet.clientId ? 'Single Client' : 'All Clients'}
            </span>
          </div>
        </div>

        {/* SHA-256 Hash */}
        <div className="bg-muted/50 p-2 rounded text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-3 w-3" />
            <span className="font-medium">SHA-256 Verification</span>
          </div>
          <div className="font-mono text-muted-foreground break-all">
            {packet.sha256Hash}
          </div>
        </div>

        {/* Files */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Included Files</h4>
          <div className="grid gap-2">
            {Object.entries(packet.files).map(([key, file]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-muted/25 rounded text-xs">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.type)}
                  <span className="font-medium">{file.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Warning */}
        {!isExpired && timeUntilExpiry <= 2 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <Clock className="h-3 w-3" />
            <span>This export will expire in {timeUntilExpiry} day{timeUntilExpiry !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Download Button */}
        <Button
          onClick={() => onDownload(packet.downloadUrl)}
          disabled={isExpired}
          className="w-full gap-2"
          variant={isExpired ? 'secondary' : 'default'}
        >
          <Download className="h-4 w-4" />
          {isExpired ? 'Expired' : 'Download ZIP Package'}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Files are cryptographically signed and verified</p>
          <p>• PII has been redacted for compliance</p>
          <p>• Download activity is logged for audit</p>
        </div>
      </CardContent>
    </Card>
  );
};