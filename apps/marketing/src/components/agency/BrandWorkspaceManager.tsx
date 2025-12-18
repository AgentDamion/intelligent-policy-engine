import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, Users, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface BrandWorkspace {
  id: string;
  name: string;
  description: string;
  client_enterprise_id: string;
  client_enterprise_name: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
}

interface ClientEnterprise {
  id: string;
  name: string;
}

interface BrandWorkspaceManagerProps {
  agencyWorkspaceId: string;
}

export const BrandWorkspaceManager: React.FC<BrandWorkspaceManagerProps> = ({
  agencyWorkspaceId
}) => {
  const [brandWorkspaces, setBrandWorkspaces] = useState<BrandWorkspace[]>([]);
  const [clientEnterprises, setClientEnterprises] = useState<ClientEnterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_enterprise_id: ''
  });

  useEffect(() => {
    fetchBrandWorkspaces();
    fetchClientEnterprises();
  }, [agencyWorkspaceId]);

  const fetchBrandWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_workspaces')
        .select(`
          *,
          enterprises!client_enterprise_id(name),
          brand_workspace_members(count)
        `)
        .eq('agency_workspace_id', agencyWorkspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const workspaces = data?.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description || '',
        client_enterprise_id: workspace.client_enterprise_id,
        client_enterprise_name: workspace.enterprises?.name || 'Unknown Client',
        is_active: workspace.is_active,
        member_count: workspace.brand_workspace_members?.length || 0,
        created_at: workspace.created_at
      })) || [];

      setBrandWorkspaces(workspaces);
    } catch (error) {
      console.error('Error fetching brand workspaces:', error);
      toast.error('Failed to load brand workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientEnterprises = async () => {
    try {
      // Get client enterprises that have relationships with this agency
      const { data, error } = await supabase
        .from('client_agency_relationships')
        .select(`
          client_enterprise_id,
          enterprises!client_enterprise_id(id, name)
        `)
        .eq('status', 'active');

      if (error) throw error;

      const clients = data?.map(rel => ({
        id: rel.client_enterprise_id,
        name: rel.enterprises?.name || 'Unknown Client'
      })) || [];

      setClientEnterprises(clients);
    } catch (error) {
      console.error('Error fetching client enterprises:', error);
    }
  };

  const handleCreateBrandWorkspace = async () => {
    if (!formData.name || !formData.client_enterprise_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('brand_workspaces')
        .insert({
          name: formData.name,
          description: formData.description,
          agency_workspace_id: agencyWorkspaceId,
          client_enterprise_id: formData.client_enterprise_id
        });

      if (error) throw error;

      toast.success('Brand workspace created successfully');
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', client_enterprise_id: '' });
      fetchBrandWorkspaces();
    } catch (error) {
      console.error('Error creating brand workspace:', error);
      toast.error('Failed to create brand workspace');
    }
  };

  const toggleWorkspaceStatus = async (workspaceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('brand_workspaces')
        .update({ is_active: !currentStatus })
        .eq('id', workspaceId);

      if (error) throw error;

      toast.success(`Brand workspace ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchBrandWorkspaces();
    } catch (error) {
      console.error('Error updating workspace status:', error);
      toast.error('Failed to update workspace status');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Workspaces</h3>
          <p className="text-sm text-muted-foreground">
            Manage isolated workspaces for each client brand
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Brand Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Brand Workspace</DialogTitle>
              <DialogDescription>
                Create a new isolated workspace for a client brand
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client">Client Enterprise *</Label>
                <Select
                  value={formData.client_enterprise_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_enterprise_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client enterprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientEnterprises.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Product X Campaign"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this brand workspace"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateBrandWorkspace} className="w-full">
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {brandWorkspaces.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium mb-2">No Brand Workspaces</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create brand workspaces to organize work by client brands
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Brand Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          brandWorkspaces.map(workspace => (
            <Card key={workspace.id} className={!workspace.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {workspace.name}
                      {!workspace.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Client: {workspace.client_enterprise_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWorkspaceStatus(workspace.id, workspace.is_active)}
                    >
                      {workspace.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{workspace.member_count} members</span>
                    </div>
                    <span className="text-muted-foreground">
                      Created {new Date(workspace.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Access
                  </Button>
                </div>
                {workspace.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {workspace.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};