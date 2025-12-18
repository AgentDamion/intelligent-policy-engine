import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { GovernanceInbox } from '@/components/governance/GovernanceInbox';
import { CommandBar } from '@/components/governance/CommandBar';
import { AIDigestWidget } from '@/components/governance/AIDigestWidget';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Download, 
  Sparkles,
  Command,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { routes } from '@/lib/routes';
import { exportEvents } from '@/lib/data/governance';

const GovernanceInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showToolRequest, setShowToolRequest] = useState(false);
  const [toolName, setToolName] = useState('');
  const [vendor, setVendor] = useState('');
  const [intendedUse, setIntendedUse] = useState('');

  useEffect(() => {
    // Simulate initial data load
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    try {
      const blob = await exportEvents({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `governance-events-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: 'Governance events exported to CSV',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export events',
        variant: 'destructive',
      });
    }
  };

  const handleToolRequest = () => {
    // TODO: Save tool request to database
    console.log('Tool request:', { toolName, vendor, intendedUse });
    toast({
      title: 'Tool request submitted',
      description: 'Your tool request has been submitted for review',
    });
    setShowToolRequest(false);
    setToolName('');
    setVendor('');
    setIntendedUse('');
  };

  const breadcrumb = [
    { label: 'Workspace', href: routes.enterprise.dashboard },
    { label: 'Governance', href: '/governance/inbox' },
    { label: 'Inbox' },
  ];

  const actions = (
    <>
      <Button 
        variant="outline" 
        onClick={() => {
          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
          const shortcut = isMac ? '⌘K' : 'Ctrl+K';
          toast({
            title: 'Command Bar',
            description: `Press ${shortcut} to open the command bar from anywhere`,
          });
        }}
        className="gap-2"
      >
        <Command className="h-4 w-4" />
        <span className="hidden sm:inline">Commands</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={handleExport}
        data-testid="export-button"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
      
      <Sheet open={showToolRequest} onOpenChange={setShowToolRequest}>
        <SheetTrigger asChild>
          <Button variant="secondary" className="gap-2" data-testid="request-tool-button">
            <Sparkles className="h-4 w-4" />
            Request Tool
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Request AI Tool</SheetTitle>
            <SheetDescription>
              Submit a request to add a new AI tool to your governance framework
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toolName">Tool Name</Label>
              <Input
                id="toolName"
                placeholder="e.g., Claude 3 Opus"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="e.g., Anthropic"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="intendedUse">Intended Use</Label>
              <Textarea
                id="intendedUse"
                placeholder="Describe how you plan to use this tool..."
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button 
              className="w-full gap-2" 
              onClick={handleToolRequest}
              disabled={!toolName || !vendor || !intendedUse}
            >
              <Sparkles className="h-4 w-4" />
              Submit Request
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <Button 
        className="gap-2"
        onClick={() => navigate(routes.enterprise.policyStudio())}
        data-testid="new-policy-button"
        aria-label="Create new policy"
      >
        <Plus className="h-4 w-4" />
        New Policy
      </Button>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Governance Inbox"
          subtitle="Live policy, audit, and tool activity across partners"
          breadcrumb={breadcrumb}
          actions={
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          }
        />
        
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-4">
            <div className="flex gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 flex-1" />
              ))}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <CommandBar 
        onRunSimulation={() => navigate('/enterprise/sandbox')}
        onExport={handleExport}
        onRequestTool={() => setShowToolRequest(true)}
      />
      
      <div className="min-h-screen">
        <PageHeader
          title="Governance Inbox"
          subtitle="Live policy, audit, and tool activity across partners"
          breadcrumb={breadcrumb}
          actions={actions}
        />
        
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* AI Digest Widget */}
          <AIDigestWidget />
          
          <Suspense fallback={<Skeleton className="h-96" />}>
            <GovernanceInbox />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default GovernanceInboxPage;
