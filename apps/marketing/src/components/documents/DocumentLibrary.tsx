import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  FileText,
  Trash2,
  Share,
  Calendar,
  User,
  FileIcon,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  tags?: string[];
  version?: number;
  checksum?: string;
}

interface DocumentLibraryProps {
  documents: DocumentFile[];
  onDocumentSelect?: (document: DocumentFile) => void;
  onDocumentPreview?: (document: DocumentFile) => void;
  onDocumentDownload?: (document: DocumentFile) => void;
  onDocumentDelete?: (document: DocumentFile) => void;
  onDocumentShare?: (document: DocumentFile) => void;
  className?: string;
}

type SortField = 'filename' | 'size' | 'uploadedAt' | 'processingStatus';
type SortDirection = 'asc' | 'desc';

export function DocumentLibrary({
  documents,
  onDocumentSelect,
  onDocumentPreview,
  onDocumentDownload,
  onDocumentDelete,
  onDocumentShare,
  className
}: DocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (doc.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || doc.processingStatus === statusFilter;
      const matchesType = typeFilter === 'all' || doc.type.includes(typeFilter);
      
      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'uploadedAt') {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      } else if (sortField === 'filename') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

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

  const getStatusBadgeVariant = (status: DocumentFile['processingStatus']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId);
    } else {
      newSelection.add(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.size === filteredAndSortedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
    }
  };

  const uniqueTypes = Array.from(new Set(documents.map(doc => doc.type.split('/')[0])));
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.processingStatus] = (acc[doc.processingStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (documents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Documents</h3>
          <p className="text-muted-foreground">
            Upload documents to see them appear in your library.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library ({filteredAndSortedDocuments.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {selectedDocuments.size > 0 && (
              <Badge variant="secondary">
                {selectedDocuments.size} selected
              </Badge>
            )}
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending || 0})</SelectItem>
                <SelectItem value="processing">Processing ({statusCounts.processing || 0})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts.completed || 0})</SelectItem>
                <SelectItem value="failed">Failed ({statusCounts.failed || 0})</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.size === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                    onChange={selectAllDocuments}
                    className="rounded"
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('filename')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === 'filename' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center gap-1">
                    Size
                    {sortField === 'size' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('processingStatus')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'processingStatus' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('uploadedAt')}
                >
                  <div className="flex items-center gap-1">
                    Uploaded
                    {sortField === 'uploadedAt' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDocuments.map((document) => (
                <TableRow 
                  key={document.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    selectedDocuments.has(document.id) && "bg-muted/30"
                  )}
                  onClick={() => onDocumentSelect?.(document)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-lg">{getFileTypeIcon(document.type)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{document.filename}</div>
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex gap-1">
                          {document.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{document.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(document.size)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(document.processingStatus)}>
                      {document.processingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div>{formatDate(document.uploadedAt)}</div>
                      {document.uploadedBy && (
                        <div className="text-xs">by {document.uploadedBy}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onDocumentPreview && (
                          <DropdownMenuItem onClick={() => onDocumentPreview(document)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                        )}
                        {onDocumentDownload && (
                          <DropdownMenuItem onClick={() => onDocumentDownload(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        {onDocumentShare && (
                          <DropdownMenuItem onClick={() => onDocumentShare(document)}>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onDocumentDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDocumentDelete(document)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}