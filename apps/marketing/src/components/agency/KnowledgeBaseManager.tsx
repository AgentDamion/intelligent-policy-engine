import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Shield, BookOpen, GraduationCap, ClipboardCheck, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface KnowledgeBaseDocument {
  id: string;
  document_type: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
  file_url?: string;
}

interface KnowledgeBaseManagerProps {
  workspaceId: string;
}

const DOCUMENT_TYPES = [
  { value: 'policy', label: 'Policy Document', icon: Shield },
  { value: 'certificate', label: 'Certificate', icon: ClipboardCheck },
  { value: 'process_doc', label: 'Process Documentation', icon: FileText },
  { value: 'training_material', label: 'Training Material', icon: GraduationCap },
  { value: 'audit_report', label: 'Audit Report', icon: BookOpen },
];

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ workspaceId }) => {
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    document_type: 'policy',
    title: '',
    description: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [workspaceId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_knowledge_base')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge base documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('partner_knowledge_base')
        .insert({
          workspace_id: workspaceId,
          document_type: formData.document_type,
          title: formData.title,
          description: formData.description,
          content: formData.content,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          uploaded_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document added to knowledge base'
      });

      setIsAddDialogOpen(false);
      setFormData({
        document_type: 'policy',
        title: '',
        description: '',
        content: '',
        tags: ''
      });
      loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: 'Error',
        description: 'Failed to add document',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;

    try {
      const { error } = await supabase
        .from('partner_knowledge_base')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document removed from knowledge base'
      });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove document',
        variant: 'destructive'
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getDocumentIcon = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type);
    const Icon = docType?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">Upload documentation to improve AI-generated RFP responses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Knowledge Base Document</DialogTitle>
              <DialogDescription>
                Upload documentation that will help generate accurate RFP responses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">Document Type</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Data Privacy Policy v2.1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this document"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Paste document content here (will be used by AI for generating responses)"
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., GDPR, privacy, EU compliance"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Document</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOCUMENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading knowledge base...</div>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {searchQuery || filterType !== 'all' ? 'No matching documents found' : 'No documents in knowledge base yet'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map(doc => {
            const docType = DOCUMENT_TYPES.find(dt => dt.value === doc.document_type);
            return (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(doc.document_type)}
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <Badge variant="outline">{docType?.label}</Badge>
                      </div>
                      {doc.description && (
                        <CardDescription>{doc.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                {doc.tags && doc.tags.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};