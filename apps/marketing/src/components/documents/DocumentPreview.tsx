import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Eye, 
  Download, 
  Share, 
  Code, 
  Info,
  Calendar,
  User,
  Hash,
  FileType
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentMeta {
  filename: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy?: string;
  checksum?: string;
  pages?: number;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ProcessingResult {
  extractedText: string;
  confidence: number;
  parsingMethod: string;
  metadata: Record<string, any>;
  pages: number;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
}

interface DocumentPreviewProps {
  document: DocumentMeta;
  processingResult?: ProcessingResult;
  rawContent?: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export function DocumentPreview({
  document,
  processingResult,
  rawContent,
  onDownload,
  onShare,
  className
}: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState('content');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  const hasProcessingResult = processingResult && document.processingStatus === 'completed';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Preview
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Content
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-1" disabled={!hasProcessingResult}>
              <Code className="h-3 w-3" />
              Processing
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-1" disabled={!rawContent}>
              <FileText className="h-3 w-3" />
              Raw
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-4">
            <div className="space-y-4">
              {/* Document Header */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl">{getFileTypeIcon(document.type)}</div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{document.filename}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(document.size)}</span>
                    <span>{document.type}</span>
                    {document.pages && <span>{document.pages} pages</span>}
                  </div>
                </div>
                
                <Badge variant={
                  document.processingStatus === 'completed' ? 'default' :
                  document.processingStatus === 'failed' ? 'destructive' :
                  document.processingStatus === 'processing' ? 'secondary' : 'outline'
                }>
                  {document.processingStatus || 'pending'}
                </Badge>
              </div>

              {/* Extracted Content */}
              {hasProcessingResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Extracted Content</h4>
                    <Badge variant="outline">
                      {(processingResult.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-96 w-full border rounded-md p-4">
                    <div className="whitespace-pre-wrap text-sm font-mono">
                      {processingResult.extractedText}
                    </div>
                  </ScrollArea>
                  
                  {processingResult.tables && processingResult.tables.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Extracted Tables</h5>
                      {processingResult.tables.map((table, index) => (
                        <div key={index} className="border rounded overflow-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-muted">
                              <tr>
                                {table.headers.map((header, i) => (
                                  <th key={i} className="p-2 text-left font-medium">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, i) => (
                                <tr key={i} className="border-t">
                                  {row.map((cell, j) => (
                                    <td key={j} className="p-2">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!hasProcessingResult && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Document processing {document.processingStatus === 'pending' ? 'not started' : 'in progress'}</p>
                  <p className="text-sm">Content will appear here once processing is complete</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileType className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">File Information</span>
                  </div>
                  <div className="pl-6 space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {document.filename}</div>
                    <div><span className="text-muted-foreground">Size:</span> {formatFileSize(document.size)}</div>
                    <div><span className="text-muted-foreground">Type:</span> {document.type}</div>
                    {document.pages && (
                      <div><span className="text-muted-foreground">Pages:</span> {document.pages}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload Information</span>
                  </div>
                  <div className="pl-6 space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Uploaded:</span> {formatDate(document.uploadedAt)}</div>
                    {document.uploadedBy && (
                      <div><span className="text-muted-foreground">By:</span> {document.uploadedBy}</div>
                    )}
                  </div>
                </div>
              </div>

              {document.checksum && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Security</span>
                  </div>
                  <div className="pl-6 text-sm">
                    <div><span className="text-muted-foreground">Checksum:</span></div>
                    <code className="text-xs bg-muted p-1 rounded mt-1 block">
                      {document.checksum}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Processing Results Tab */}
          <TabsContent value="processing" className="mt-4">
            {hasProcessingResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {(processingResult.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {processingResult.pages}
                    </div>
                    <div className="text-sm text-muted-foreground">Pages</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm font-medium text-primary">
                      {processingResult.parsingMethod}
                    </div>
                    <div className="text-sm text-muted-foreground">Method</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Processing Metadata</h4>
                  <ScrollArea className="h-64 w-full border rounded-md p-4">
                    <pre className="text-xs">
                      {JSON.stringify(processingResult.metadata, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Raw Content Tab */}
          <TabsContent value="raw" className="mt-4">
            {rawContent && (
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {rawContent}
                </pre>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}