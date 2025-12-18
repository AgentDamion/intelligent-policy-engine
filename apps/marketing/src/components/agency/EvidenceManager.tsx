import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buildEvidencePath } from '@/lib/storage/paths';

interface Evidence {
  type: string;
  description: string;
  file_url?: string;
}

interface EvidenceManagerProps {
  evidence: Evidence[];
  onChange: (evidence: Evidence[]) => void;
  suggestedTypes?: string[];
  workspaceId: string; // Required for RLS-compliant storage paths
}

const EVIDENCE_TYPES = [
  'Technical Documentation',
  'Certifications',
  'Case Studies',
  'Audit Reports',
  'Process Documentation',
  'Training Materials',
  'System Screenshots',
  'Compliance Records',
  'Third-party Assessments',
  'Other',
];

export const EvidenceManager: React.FC<EvidenceManagerProps> = ({
  evidence,
  onChange,
  suggestedTypes = [],
  workspaceId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [newEvidence, setNewEvidence] = useState<Partial<Evidence>>({
    type: '',
    description: '',
  });
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Build RLS-compliant storage path
      const filePath = buildEvidencePath('general-evidence', workspaceId, file.name);
      
      console.log('[EvidenceManager] Uploading to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error('[EvidenceManager] Upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}. Path attempted: ${filePath}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      setNewEvidence(prev => ({ ...prev, file_url: publicUrl }));

      toast({
        title: 'File Uploaded',
        description: 'Evidence file uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload evidence file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddEvidence = () => {
    if (!newEvidence.type || !newEvidence.description) {
      toast({
        title: 'Missing Information',
        description: 'Please provide evidence type and description',
        variant: 'destructive',
      });
      return;
    }

    onChange([...evidence, newEvidence as Evidence]);
    setNewEvidence({ type: '', description: '' });
  };

  const handleRemoveEvidence = (index: number) => {
    onChange(evidence.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evidence Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Evidence */}
        {evidence.length > 0 && (
          <div className="space-y-2">
            {evidence.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.type}</Badge>
                      {suggestedTypes.includes(item.type) && (
                        <Badge variant="outline" className="bg-success/10 text-success">
                          Suggested
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{item.description}</p>
                    {item.file_url && (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View File <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEvidence(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Evidence */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Evidence Type</Label>
            <Select
              value={newEvidence.type}
              onValueChange={(value) =>
                setNewEvidence(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select evidence type" />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                    {suggestedTypes.includes(type) && ' ⭐'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Describe this evidence..."
              value={newEvidence.description}
              onChange={(e) =>
                setNewEvidence(prev => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>File (Optional)</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              {newEvidence.file_url && (
                <Badge variant="outline" className="bg-success/10 text-success">
                  Uploaded
                </Badge>
              )}
            </div>
          </div>

          <Button
            onClick={handleAddEvidence}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Evidence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
