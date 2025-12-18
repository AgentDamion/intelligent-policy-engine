import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { ToolDisclosure } from '@/types/rfp';

interface ToolDisclosureFormProps {
  distributionId: string;
  onSubmit: (disclosure: Omit<ToolDisclosure, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel?: () => void;
  initialData?: ToolDisclosure;
}

export function ToolDisclosureForm({ 
  distributionId, 
  onSubmit, 
  onCancel,
  initialData 
}: ToolDisclosureFormProps) {
  const [formData, setFormData] = useState<Omit<ToolDisclosure, 'id' | 'created_at' | 'updated_at'>>({
    distribution_id: distributionId,
    tool_name: initialData?.tool_name || '',
    version: initialData?.version || '',
    provider: initialData?.provider || '',
    intended_use: initialData?.intended_use || '',
    data_scope: {
      pii: initialData?.data_scope?.pii || false,
      hipaa: initialData?.data_scope?.hipaa || false,
      regions: initialData?.data_scope?.regions || [],
      data_types: initialData?.data_scope?.data_types || []
    },
    connectors: initialData?.connectors || []
  });

  const [newRegion, setNewRegion] = useState('');
  const [newDataType, setNewDataType] = useState('');
  const [newConnector, setNewConnector] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = (field: 'regions' | 'data_types', value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    const array = formData.data_scope?.[field] || [];
    if (!array.includes(value.trim())) {
      setFormData({
        ...formData,
        data_scope: {
          ...formData.data_scope,
          [field]: [...array, value.trim()]
        }
      });
    }
    setter('');
  };

  const removeItem = (field: 'regions' | 'data_types', value: string) => {
    const array = formData.data_scope?.[field] || [];
    setFormData({
      ...formData,
      data_scope: {
        ...formData.data_scope,
        [field]: array.filter(item => item !== value)
      }
    });
  };

  const addConnector = () => {
    if (!newConnector.trim()) return;
    if (!formData.connectors?.includes(newConnector.trim())) {
      setFormData({
        ...formData,
        connectors: [...(formData.connectors || []), newConnector.trim()]
      });
    }
    setNewConnector('');
  };

  const removeConnector = (connector: string) => {
    setFormData({
      ...formData,
      connectors: (formData.connectors || []).filter(c => c !== connector)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit' : 'Add'} AI Tool Disclosure</CardTitle>
        <CardDescription>
          Provide details about the AI tool being used in this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tool_name">Tool Name *</Label>
              <Input
                id="tool_name"
                required
                value={formData.tool_name}
                onChange={e => setFormData({ ...formData, tool_name: e.target.value })}
                placeholder="e.g., GPT-4, Claude, Bard"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={e => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 4.0, 2.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                required
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., OpenAI, Anthropic, Google"
              />
            </div>
          </div>

          {/* Intended Use */}
          <div className="space-y-2">
            <Label htmlFor="intended_use">Intended Use</Label>
            <Textarea
              id="intended_use"
              value={formData.intended_use}
              onChange={e => setFormData({ ...formData, intended_use: e.target.value })}
              placeholder="Describe how this tool will be used..."
              rows={3}
            />
          </div>

          {/* Data Scope */}
          <div className="space-y-4">
            <h3 className="font-semibold">Data Scope</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pii"
                checked={formData.data_scope?.pii}
                onCheckedChange={checked => 
                  setFormData({
                    ...formData,
                    data_scope: { ...formData.data_scope, pii: checked as boolean }
                  })
                }
              />
              <Label htmlFor="pii" className="font-normal">
                Processes Personally Identifiable Information (PII)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hipaa"
                checked={formData.data_scope?.hipaa}
                onCheckedChange={checked => 
                  setFormData({
                    ...formData,
                    data_scope: { ...formData.data_scope, hipaa: checked as boolean }
                  })
                }
              />
              <Label htmlFor="hipaa" className="font-normal">
                Processes HIPAA-regulated health data
              </Label>
            </div>

            {/* Regions */}
            <div className="space-y-2">
              <Label>Regions Where Data is Processed</Label>
              <div className="flex gap-2">
                <Input
                  value={newRegion}
                  onChange={e => setNewRegion(e.target.value)}
                  placeholder="e.g., US, EU, APAC"
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addItem('regions', newRegion, setNewRegion))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addItem('regions', newRegion, setNewRegion)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.data_scope?.regions?.map(region => (
                  <Badge key={region} variant="secondary">
                    {region}
                    <button
                      type="button"
                      onClick={() => removeItem('regions', region)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Data Types */}
            <div className="space-y-2">
              <Label>Data Types Processed</Label>
              <div className="flex gap-2">
                <Input
                  value={newDataType}
                  onChange={e => setNewDataType(e.target.value)}
                  placeholder="e.g., text, images, audio"
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addItem('data_types', newDataType, setNewDataType))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addItem('data_types', newDataType, setNewDataType)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.data_scope?.data_types?.map(type => (
                  <Badge key={type} variant="secondary">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeItem('data_types', type)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Connectors */}
          <div className="space-y-2">
            <Label>System Connectors/Integrations</Label>
            <div className="flex gap-2">
              <Input
                value={newConnector}
                onChange={e => setNewConnector(e.target.value)}
                placeholder="e.g., Salesforce, Slack, SAP"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addConnector())}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addConnector}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.connectors?.map(connector => (
                <Badge key={connector} variant="secondary">
                  {connector}
                  <button
                    type="button"
                    onClick={() => removeConnector(connector)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initialData ? 'Update Tool' : 'Add Tool'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
