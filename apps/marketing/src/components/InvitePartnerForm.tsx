import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Mail, Users, AlertTriangle } from 'lucide-react';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { UpgradePrompt } from './UpgradePrompt';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface InvitePartnerFormProps {
  enterpriseId?: string;
}

export default function InvitePartnerForm({ enterpriseId }: InvitePartnerFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('partner_user');
  const [policyScope, setPolicyScope] = useState('MLR Required for Patient Content');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [workspaceId, setWorkspaceId] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get tier data for the enterprise
  const tierData = useSubscriptionTier(enterpriseId);

  const handleInvite = async () => {
    if (!email || !workspaceId || !workspaceName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check partner limits before proceeding
    if (!tierData.canAddPartner) {
      toast.error(`Partner limit reached (${tierData.currentPartners}/${tierData.maxPartners}). Upgrade to add more partners.`);
      return;
    }

    setLoading(true);
    setError('');
    setInviteUrl('');

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          workspaceId,
          workspaceName,
          role,
          policyScope,
          expiresInDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invite failed');
      }

      setInviteUrl(data.inviteUrl);
      toast.success('Invite link generated successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard!');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invite a Partner
        </CardTitle>
        
        {/* Partner Usage Indicator */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Partner Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tierData.canAddPartner ? "secondary" : "destructive"}>
                {tierData.currentPartners}/{tierData.maxPartners}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {tierData.tier.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Progress 
            value={(tierData.currentPartners / tierData.maxPartners) * 100} 
            className="h-2"
          />
          {!tierData.canAddPartner && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Partner limit reached. Upgrade to add more partners.</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Partner Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="partner@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceId">Workspace ID *</Label>
            <Input
              id="workspaceId"
              type="text"
              placeholder="ws_abc123"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceName">Workspace Name *</Label>
            <Input
              id="workspaceName"
              type="text"
              placeholder="Pfizer Oncology Division"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partner_user">Agency Partner</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policyScope">Policy Scope</Label>
            <Select value={policyScope} onValueChange={setPolicyScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MLR Required for Patient Content">MLR Required for Patient Content</SelectItem>
                <SelectItem value="Internal Use Only">Internal Use Only</SelectItem>
                <SelectItem value="Experimental / R&D Use">Experimental / R&D Use</SelectItem>
                <SelectItem value="Clinical Trial Content">Clinical Trial Content</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Expires in Days</Label>
            <Input
              id="expires"
              type="number"
              min="1"
              max="30"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
            />
          </div>
        </div>

        {!tierData.canAddPartner ? (
          <UpgradePrompt
            currentTier={tierData.tier}
            nextTier={tierData.nextTierRecommendation}
            context="partner_limit"
            currentUsage={tierData.currentPartners}
            maxUsage={tierData.maxPartners}
          />
        ) : (
          <Button
            onClick={handleInvite}
            disabled={loading || tierData.loading}
            className="w-full"
          >
            {loading ? 'Generating Invite...' : 'Generate Invite Link'}
          </Button>
        )}

        {inviteUrl && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <Label>Invite Link Generated:</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}