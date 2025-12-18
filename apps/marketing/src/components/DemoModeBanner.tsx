import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Copy, Check, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { demoMode } from '@/utils/demoMode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export const DemoModeBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [presentationMode, setPresentationMode] = useState(demoMode.isPresentationMode());
  const { toast } = useToast();

  useEffect(() => {
    const handlePresentationChange = () => {
      setPresentationMode(demoMode.isPresentationMode());
    };

    const handleUrlCopied = () => {
      setCopied(true);
      toast({
        title: "Demo URL Copied!",
        description: "Share this link to demo this role",
      });
      setTimeout(() => setCopied(false), 2000);
    };

    window.addEventListener('presentationModeChanged', handlePresentationChange);
    window.addEventListener('demo-url-copied', handleUrlCopied);

    return () => {
      window.removeEventListener('presentationModeChanged', handlePresentationChange);
      window.removeEventListener('demo-url-copied', handleUrlCopied);
    };
  }, [toast]);

  if (!demoMode.isEnabled()) return null;
  if (presentationMode) return null; // Hide in presentation mode

  const currentRole = demoMode.getDemoRole();
  const roleLabels = {
    enterprise: 'Enterprise',
    partner: 'Agency',
    vendor: 'Vendor',
    admin: 'Admin'
  };

  const handleCopyUrl = () => {
    demoMode.copyDemoUrl();
    setCopied(true);
    toast({
      title: "Demo URL Copied!",
      description: "Share this link to demo this role",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePresentation = () => {
    demoMode.togglePresentationMode();
  };

  return (
    <div className="fixed top-0 right-0 z-50 m-4">
      <div className="flex items-center gap-2 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
          Demo Mode
        </Badge>
        
        {/* Role Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-white hover:bg-white/20 flex items-center gap-1"
            >
              <span className="text-sm font-medium">
                {roleLabels[currentRole || 'enterprise']}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch Role (Alt + 1-4)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => demoMode.switchRole('enterprise')}>
              <span className="flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <span>Enterprise</span>
                <Badge variant="outline" className="ml-auto text-xs">Alt+1</Badge>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => demoMode.switchRole('partner')}>
              <span className="flex items-center gap-2">
                <span className="text-lg">🤝</span>
                <span>Agency</span>
                <Badge variant="outline" className="ml-auto text-xs">Alt+2</Badge>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => demoMode.switchRole('vendor')}>
              <span className="flex items-center gap-2">
                <span className="text-lg">🛠️</span>
                <span>Vendor</span>
                <Badge variant="outline" className="ml-auto text-xs">Alt+3</Badge>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => demoMode.switchRole('admin')}>
              <span className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <span>Admin</span>
                <Badge variant="outline" className="ml-auto text-xs">Alt+4</Badge>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Copy Demo URL Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          onClick={handleCopyUrl}
          title="Copy Demo URL (Alt+C)"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>

        {/* Presentation Mode Toggle */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          onClick={handleTogglePresentation}
          title="Presentation Mode (Alt+P)"
        >
          {presentationMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        {/* Close Demo Mode */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          onClick={demoMode.disable}
          title="Exit Demo Mode (Alt+D)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};