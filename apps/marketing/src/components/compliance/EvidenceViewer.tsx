import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEvidenceFiles } from '@/hooks/useEvidenceFiles';
import { Download, Search, FileText, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface EvidenceViewerProps {
  submissionItemId?: string;
  submissionItems?: Array<{ id: string; ai_tool_name: string }>;
}

export const EvidenceViewer = ({ submissionItemId, submissionItems = [] }: EvidenceViewerProps) => {
  const [selectedItemId, setSelectedItemId] = useState(submissionItemId || submissionItems[0]?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const { evidence, loading, error, downloadFile, getFileIcon, formatFileSize } = useEvidenceFiles(selectedItemId);
  const { toast } = useToast();

  const filteredEvidence = evidence.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScanStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'infected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'quarantined': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'scanning': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScanStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-100 text-green-800';
      case 'infected': return 'bg-red-100 text-red-800';
      case 'quarantined': return 'bg-red-100 text-red-800';
      case 'scanning': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = async (file: any) => {
    try {
      await downloadFile(file);
      toast({
        title: "Download Started",
        description: `Downloading ${file.filename}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedItem = submissionItems.find(item => item.id === selectedItemId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Evidence Repository
            {selectedItem && (
              <Badge variant="outline" className="ml-auto">
                {selectedItem.ai_tool_name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            {/* Submission Item Selector */}
            {submissionItems.length > 1 && (
              <select
                value={selectedItemId || ''}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {submissionItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.ai_tool_name}
                  </option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search evidence files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Files */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600">Error loading evidence: {error}</p>
          </CardContent>
        </Card>
      ) : filteredEvidence.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No evidence files match your search' : 'No evidence files uploaded yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidence.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* File Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl">{getFileIcon(file.content_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" title={file.filename}>
                      {file.filename}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>

                {/* File Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    {getScanStatusIcon(file.scan_status)}
                    <Badge className={getScanStatusColor(file.scan_status)}>
                      {file.scan_status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Uploaded: {new Date(file.created_at).toLocaleDateString()}
                  </p>

                  {file.content_type && (
                    <p className="text-xs text-muted-foreground">
                      Type: {file.content_type}
                    </p>
                  )}
                </div>

                {/* Security Scan Results */}
                {file.scan_result && (
                  <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-medium mb-1">Scan Results:</p>
                    {typeof file.scan_result === 'object' ? (
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(file.scan_result).map(([key, value]) => (
                          <li key={key}>
                            <span className="capitalize">{key}:</span> {String(value)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{String(file.scan_result)}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(file)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={file.scan_status === 'infected' || file.scan_status === 'quarantined' || file.scan_status === 'scanning'}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>

                {/* Warning for infected files */}
                {(file.scan_status === 'infected' || file.scan_status === 'quarantined') && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    This file has been flagged as potentially unsafe
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Evidence Summary */}
      {evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{evidence.length}</div>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {evidence.filter(f => f.scan_status === 'clean').length}
                </div>
                <p className="text-sm text-muted-foreground">Clean</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {evidence.filter(f => f.scan_status === 'scanning').length}
                </div>
                <p className="text-sm text-muted-foreground">Scanning</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {evidence.filter(f => f.scan_status === 'infected' || f.scan_status === 'quarantined').length}
                </div>
                <p className="text-sm text-muted-foreground">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};