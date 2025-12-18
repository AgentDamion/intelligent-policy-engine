import React, { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Search,
  FileText,
  Shield,
  Users,
  AlertTriangle,
  Download,
  Settings,
  Building2
} from 'lucide-react';

interface ProductCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductCommandMenu: React.FC<ProductCommandMenuProps> = ({
  open,
  onOpenChange
}) => {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search policies, tools, conflicts, or audits..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => console.log('View all policies'))}>
            <FileText className="mr-2 h-4 w-4" />
            View All Policies
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.href = '/document-processing-demo')}>
            <FileText className="mr-2 h-4 w-4" />
            Try Document Processing Demo
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Generate compliance report'))}>
            <Download className="mr-2 h-4 w-4" />
            Generate Compliance Report
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Check conflicts'))}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Check for Conflicts
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent Searches">
          <CommandItem onSelect={() => runCommand(() => console.log('MidJourney policy'))}>
            <Search className="mr-2 h-4 w-4" />
            MidJourney policy status
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Novartis audit'))}>
            <Search className="mr-2 h-4 w-4" />
            Novartis audit trail
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Client compliance'))}>
            <Search className="mr-2 h-4 w-4" />
            Client compliance overview
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => console.log('Go to clients'))}>
            <Users className="mr-2 h-4 w-4" />
            Go to Clients
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.href = '/document-processing-demo')}>
            <FileText className="mr-2 h-4 w-4" />
            Go to Document Processing
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Go to compliance'))}>
            <Shield className="mr-2 h-4 w-4" />
            Go to Compliance Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Go to settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};