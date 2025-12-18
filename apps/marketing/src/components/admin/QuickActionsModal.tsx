import React, { useState } from 'react';
import { X, Plus, CheckCircle, Settings, Megaphone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsModalProps {
  action: 'invite' | 'approve' | 'billing' | 'campaign';
  children: React.ReactNode;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ action, children }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    // Simulate action completion
    setTimeout(() => {
      toast({
        title: "Action completed successfully",
        description: getSuccessMessage(action),
      });
      setOpen(false);
    }, 1000);
  };

  const getSuccessMessage = (action: string) => {
    switch (action) {
      case 'invite': return 'Enterprise invitation sent successfully';
      case 'approve': return 'Partner application approved';
      case 'billing': return 'Billing configuration updated';
      case 'campaign': return 'Marketing campaign launched';
      default: return 'Action completed';
    }
  };

  const renderContent = () => {
    switch (action) {
      case 'invite':
        return <InviteEnterpriseForm onSubmit={handleSubmit} />;
      case 'approve':
        return <ApprovePartnerForm onSubmit={handleSubmit} />;
      case 'billing':
        return <ConfigureBillingForm onSubmit={handleSubmit} />;
      case 'campaign':
        return <LaunchCampaignForm onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'invite': return 'Invite Enterprise Customer';
      case 'approve': return 'Approve Partner Application';
      case 'billing': return 'Configure Billing Settings';
      case 'campaign': return 'Launch Marketing Campaign';
      default: return 'Quick Action';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'invite': return 'Send an invitation to a new enterprise customer';
      case 'approve': return 'Review and approve pending partner applications';
      case 'billing': return 'Update billing and subscription configurations';
      case 'campaign': return 'Create and launch a new marketing campaign';
      default: return 'Perform a quick action';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

const InviteEnterpriseForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" placeholder="Acme Pharmaceuticals" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pharmaceutical">Pharmaceutical</SelectItem>
              <SelectItem value="biotech">Biotechnology</SelectItem>
              <SelectItem value="medical-device">Medical Device</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Contact Name</Label>
          <Input id="contact-name" placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input id="contact-email" type="email" placeholder="john@acme.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tier">Subscription Tier</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="foundation">Foundation</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Welcome Message</Label>
        <Textarea 
          id="message" 
          placeholder="Welcome to aicomply.io! We're excited to help you achieve AI compliance..."
          rows={3}
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          Send Invitation
        </Button>
      </div>
    </div>
  );
};

const ApprovePartnerForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const pendingApplications = [
    { id: '1', company: 'Digital Health Agency', contact: 'Sarah Wilson', submitted: '2024-01-10', tools: 5 },
    { id: '2', company: 'AI Compliance Consultants', contact: 'Michael Brown', submitted: '2024-01-12', tools: 8 },
    { id: '3', company: 'RegTech Solutions', contact: 'Lisa Davis', submitted: '2024-01-14', tools: 3 }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="font-medium">Pending Partner Applications</h3>
        {pendingApplications.map((app) => (
          <div key={app.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{app.company}</div>
                <div className="text-sm text-muted-foreground">Contact: {app.contact}</div>
                <div className="text-sm text-muted-foreground">Submitted: {app.submitted}</div>
              </div>
              <Badge variant="outline">{app.tools} AI Tools</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="outline">
                Review Details
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          Process Selected Applications
        </Button>
      </div>
    </div>
  );
};

const ConfigureBillingForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="billing-cycle">Billing Cycle</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="eur">EUR</SelectItem>
              <SelectItem value="gbp">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-medium">Tier Pricing</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">Foundation Tier</div>
              <div className="text-sm text-muted-foreground">Up to 5 AI tools</div>
            </div>
            <Input className="w-24" placeholder="$99" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">Growth Tier</div>
              <div className="text-sm text-muted-foreground">Up to 25 AI tools</div>
            </div>
            <Input className="w-24" placeholder="$299" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">Enterprise Tier</div>
              <div className="text-sm text-muted-foreground">Unlimited AI tools</div>
            </div>
            <Input className="w-24" placeholder="$999" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          <Settings className="h-4 w-4 mr-2" />
          Update Billing Configuration
        </Button>
      </div>
    </div>
  );
};

const LaunchCampaignForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Campaign Name</Label>
          <Input id="campaign-name" placeholder="Q1 AI Compliance Drive" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-type">Campaign Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email Campaign</SelectItem>
              <SelectItem value="webinar">Webinar Series</SelectItem>
              <SelectItem value="content">Content Marketing</SelectItem>
              <SelectItem value="demo">Demo Campaign</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target-audience">Target Audience</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enterprises">Enterprise Prospects</SelectItem>
            <SelectItem value="partners">Partner Agencies</SelectItem>
            <SelectItem value="existing">Existing Customers</SelectItem>
            <SelectItem value="churned">Churned Customers</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject/Title</Label>
        <Input id="subject" placeholder="Transform Your AI Compliance in 30 Days" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign-content">Campaign Content</Label>
        <Textarea 
          id="campaign-content" 
          placeholder="Enter your campaign message..."
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="send-date">Send Date</Label>
          <Input id="send-date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="send-time">Send Time</Label>
          <Input id="send-time" type="time" />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          <Megaphone className="h-4 w-4 mr-2" />
          Launch Campaign
        </Button>
      </div>
    </div>
  );
};