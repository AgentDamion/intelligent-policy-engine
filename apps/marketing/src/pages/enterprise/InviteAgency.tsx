import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteAgency() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: '',
    contactEmail: '',
    contactName: '',
    workspaceName: '',
    message: '',
    targetRole: 'admin'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agencyName || !formData.contactEmail || !formData.contactName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get current user's enterprise
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's enterprise
      const { data: enterprises, error: enterpriseError } = await supabase
        .from('enterprise_members')
        .select('enterprise_id')
        .eq('user_id', user.id)
        .limit(1);

      if (enterpriseError || !enterprises?.length) {
        throw new Error('No enterprise found for user');
      }

      const enterpriseMember = enterprises[0];
      
      // Get enterprise details
      const { data: enterpriseData, error: enterpriseDataError } = await supabase
        .from('enterprises')
        .select('id, name')
        .eq('id', enterpriseMember.enterprise_id)
        .single();

      if (enterpriseDataError || !enterpriseData) {
        throw new Error('No enterprise details found');
      }

      // Generate magic token
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_magic_token');
      if (tokenError || !tokenData) throw new Error('Failed to generate invitation token');

      // Create enterprise-to-agency invitation
      const { error: inviteError } = await supabase
        .from('customer_onboarding')
        .insert({
          company_name: formData.agencyName,
          email: formData.contactEmail,
          workspace_name: formData.workspaceName || `${formData.agencyName} Workspace`,
          magic_token: tokenData,
          invitation_type: 'enterprise_to_agency',
          inviting_enterprise_id: enterpriseMember.enterprise_id,
          target_role: formData.targetRole,
          invited_by: user.id,
          onboarding_data: {
            contact_name: formData.contactName,
            message: formData.message,
            invited_by_enterprise: enterpriseData.name
          }
        });

      if (inviteError) throw inviteError;

      // In a real implementation, you would send an email here
      // For now, we'll show the magic link
      const inviteUrl = `${window.location.origin}/enterprise-invite?token=${tokenData}`;
      
      toast.success('Agency invitation created successfully!');
      
      // Show the invitation link (in production, this would be emailed)
      const shouldCopy = window.confirm(
        `Invitation created! Would you like to copy the invitation link to clipboard?\n\n${inviteUrl}`
      );
      
      if (shouldCopy) {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success('Invitation link copied to clipboard');
      }

      navigate('/enterprise/dashboard');
    } catch (error) {
      console.error('Error creating agency invitation:', error);
      toast.error('Failed to create agency invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Invite Agency Partner</h1>
        <p className="text-muted-foreground">
          Invite an agency to join your enterprise network and manage compliance workflows
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agency Invitation Details
          </CardTitle>
          <CardDescription>
            Provide agency information to create a secure invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                  placeholder="Creative Marketing Agency"
                  required
                />
              </div>
              <div>
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  value={formData.workspaceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, workspaceName: e.target.value }))}
                  placeholder="Auto-generated from agency name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="john@agency.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetRole">Agency Role</Label>
              <Select value={formData.targetRole} onValueChange={(value) => setFormData(prev => ({ ...prev, targetRole: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div>Agency Admin</div>
                        <div className="text-xs text-muted-foreground">Full agency management access</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div>Agency Member</div>
                        <div className="text-xs text-muted-foreground">Standard agency access</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Welcome Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Welcome to our enterprise network! We're excited to collaborate..."
                rows={4}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What the agency will get access to:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Brand Workspace Creation</Badge>
                <Badge variant="secondary">Team Member Invitations</Badge>
                <Badge variant="secondary">Policy Submission Reviews</Badge>
                <Badge variant="secondary">Compliance Analytics</Badge>
                <Badge variant="secondary">Audit Trail Access</Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  'Creating Invitation...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}